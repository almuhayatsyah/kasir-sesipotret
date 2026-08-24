<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class POSController extends Controller
{
    /**
     * Tampilkan halaman POS utama.
     */
    public function index(): Response
    {
        $products = Product::where('is_active', true)
            ->with('recipes.ingredient')
            ->orderBy('name')
            ->get();

        // Ambil pesanan pending hari ini
        $pendingOrders = Transaction::pending()
            ->with('details.product')
            ->whereDate('created_at', today())
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('POS/Index', [
            'products'      => $products,
            'pendingOrders' => $pendingOrders,
        ]);
    }

    /**
     * Proses transaksi baru (bayar sekarang ATAU bayar nanti).
     */
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_type'      => 'required|in:dine-in,takeaway',
            'table_number'    => 'nullable|string|max:20',
            'payment_method'  => 'nullable|in:cash,qris',
            'amount_paid'     => 'nullable|integer|min:0',
            'payment_status'  => 'required|in:paid,pending',
            'customer_name'   => 'nullable|string|max:100',
            'items'           => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.price'      => 'required|integer|min:0',
            'items.*.subtotal'   => 'required|integer|min:0',
        ]);

        $totalAmount = collect($validated['items'])->sum('subtotal');
        $isPending   = $validated['payment_status'] === 'pending';

        // Validasi: jika bayar sekarang (paid), uang bayar harus >= total (khusus cash)
        if (!$isPending) {
            $amountPaid = $validated['amount_paid'] ?? 0;
            $change     = $amountPaid - $totalAmount;

            if ($validated['payment_method'] === 'cash' && $change < 0) {
                return response()->json(['message' => 'Uang pembayaran kurang dari total.'], 422);
            }
        }

        DB::beginTransaction();
        try {
            // 1. Buat header transaksi
            $transaction = Transaction::create([
                'user_id'        => auth()->id(),
                'invoice_number' => $this->generateInvoiceNumber(),
                'order_type'     => $validated['order_type'],
                'table_number'   => $validated['table_number'] ?? null,
                'payment_method' => $isPending ? null : $validated['payment_method'],
                'total_amount'   => $totalAmount,
                'amount_paid'    => $isPending ? 0 : ($validated['amount_paid'] ?? 0),
                'change'         => $isPending ? 0 : max(0, ($validated['amount_paid'] ?? 0) - $totalAmount),
                'payment_status' => $validated['payment_status'],
                'customer_name'  => $validated['customer_name'] ?? null,
            ]);

            // 2. Buat detail transaksi
            foreach ($validated['items'] as $item) {
                TransactionDetail::create([
                    'transaction_id' => $transaction->id,
                    'product_id'     => $item['product_id'],
                    'quantity'       => $item['quantity'],
                    'price'          => $item['price'],
                    'subtotal'       => $item['subtotal'],
                ]);
            }

            // 3. AUTO-DEDUCT INVENTORY (baik paid maupun pending, stok langsung berkurang)
            $this->deductInventory($validated['items']);

            DB::commit();

            $transaction->load('details.product');

            $message = $isPending
                ? 'Pesanan tersimpan! Menunggu pembayaran.'
                : 'Transaksi berhasil!';

            return response()->json([
                'success'     => true,
                'message'     => $message,
                'transaction' => $transaction,
                'change'      => $isPending ? 0 : max(0, ($validated['amount_paid'] ?? 0) - $totalAmount),
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Terjadi kesalahan: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Ambil daftar pesanan pending (untuk AJAX refresh).
     */
    public function pendingOrders(): JsonResponse
    {
        $pending = Transaction::pending()
            ->with('details.product')
            ->whereDate('created_at', today())
            ->orderByDesc('created_at')
            ->get();

        return response()->json($pending);
    }

    /**
     * Lunasi pesanan pending → ubah status menjadi 'paid'.
     */
    public function settlePayment(Request $request, Transaction $transaction): JsonResponse
    {
        if ($transaction->payment_status !== 'pending') {
            return response()->json(['message' => 'Transaksi ini sudah dibayar.'], 422);
        }

        $validated = $request->validate([
            'payment_method' => 'required|in:cash,qris',
            'amount_paid'    => 'required|integer|min:0',
        ]);

        $change = $validated['amount_paid'] - $transaction->total_amount;

        if ($validated['payment_method'] === 'cash' && $change < 0) {
            return response()->json(['message' => 'Uang pembayaran kurang dari total.'], 422);
        }

        $transaction->update([
            'payment_method' => $validated['payment_method'],
            'amount_paid'    => $validated['amount_paid'],
            'change'         => max(0, $change),
            'payment_status' => 'paid',
        ]);

        $transaction->load('details.product');

        return response()->json([
            'success'     => true,
            'message'     => 'Pembayaran berhasil!',
            'transaction' => $transaction,
            'change'      => max(0, $change),
        ]);
    }

    /**
     * Batalkan pesanan pending → kembalikan stok bahan baku.
     */
    public function cancelPending(Transaction $transaction): JsonResponse
    {
        if ($transaction->payment_status !== 'pending') {
            return response()->json(['message' => 'Hanya pesanan pending yang bisa dibatalkan.'], 422);
        }

        DB::beginTransaction();
        try {
            // Kembalikan stok bahan baku
            $this->restoreInventory($transaction);

            // Hapus transaksi (cascade akan hapus details juga)
            $transaction->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibatalkan dan stok telah dikembalikan.',
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membatalkan: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Auto-deduct stok bahan baku berdasarkan resep produk yang terjual.
     */
    private function deductInventory(array $items): void
    {
        $soldProducts = collect($items)->groupBy('product_id')->map(function ($group) {
            return $group->sum('quantity');
        });

        foreach ($soldProducts as $productId => $totalQty) {
            $recipes = \App\Models\Recipe::where('product_id', $productId)->get();

            foreach ($recipes as $recipe) {
                $totalDeduction = $recipe->quantity_needed * $totalQty;

                Ingredient::where('id', $recipe->ingredient_id)
                    ->decrement('stock', $totalDeduction);
            }
        }
    }

    /**
     * Kembalikan stok bahan baku saat pesanan pending dibatalkan.
     */
    private function restoreInventory(Transaction $transaction): void
    {
        $transaction->load('details');

        foreach ($transaction->details as $detail) {
            $recipes = \App\Models\Recipe::where('product_id', $detail->product_id)->get();

            foreach ($recipes as $recipe) {
                $totalRestore = $recipe->quantity_needed * $detail->quantity;

                Ingredient::where('id', $recipe->ingredient_id)
                    ->increment('stock', $totalRestore);
            }
        }
    }

    /**
     * Generate nomor invoice unik: INV-YYYYMMDD-XXXXX
     */
    private function generateInvoiceNumber(): string
    {
        $date   = now()->format('Ymd');
        $random = strtoupper(Str::random(5));
        return "INV-{$date}-{$random}";
    }

    /**
     * Ambil data transaksi untuk keperluan re-print struk.
     */
    public function getTransaction(Transaction $transaction): JsonResponse
    {
        $transaction->load('details.product', 'user');

        return response()->json($transaction);
    }

    /**
     * Cek stok bahan baku yang hampir habis.
     */
    public function lowStockAlert(): JsonResponse
    {
        $lowStock = Ingredient::whereColumn('stock', '<=', 'min_alert_stock')
            ->select('id', 'name', 'stock', 'min_alert_stock', 'unit')
            ->get();

        return response()->json($lowStock);
    }
}
