<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Product;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class POSController extends Controller
{
    /**
     * Tampilkan halaman POS utama (SPA).
     * Kasir HARUS punya shift aktif untuk mengakses halaman ini.
     */
    public function index(): Response|RedirectResponse
    {
        $user        = auth()->user();
        $activeShift = Shift::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        // Redirect ke halaman shift jika belum buka shift
        if (!$activeShift) {
            return redirect()->route('shift.index')
                ->with('warning', 'Buka shift terlebih dahulu sebelum memulai transaksi.');
        }

        $products = Product::where('is_active', true)
            ->with('recipes.ingredient')
            ->orderBy('name')
            ->get();

        return Inertia::render('POS/Index', [
            'shift'    => $activeShift,
            'products' => $products,
        ]);
    }

    /**
     * Proses transaksi baru.
     * Core logic: simpan transaksi → simpan detail → AUTO-DEDUCT stok bahan baku.
     */
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_type'     => 'required|in:dine-in,takeaway',
            'table_number'   => 'nullable|string|max:20',
            'payment_method' => 'required|in:cash,qris',
            'amount_paid'    => 'required|integer|min:0',
            'items'          => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.price'      => 'required|integer|min:0',
            'items.*.subtotal'   => 'required|integer|min:0',
        ]);

        $user        = auth()->user();
        $activeShift = Shift::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (!$activeShift) {
            return response()->json(['message' => 'Tidak ada shift aktif.'], 422);
        }

        $totalAmount = collect($validated['items'])->sum('subtotal');
        $change      = $validated['amount_paid'] - $totalAmount;

        // Validasi: uang bayar harus >= total (khusus cash)
        if ($validated['payment_method'] === 'cash' && $change < 0) {
            return response()->json(['message' => 'Uang pembayaran kurang dari total.'], 422);
        }

        DB::beginTransaction();
        try {
            // 1. Buat header transaksi
            $transaction = Transaction::create([
                'shift_id'       => $activeShift->id,
                'invoice_number' => $this->generateInvoiceNumber(),
                'order_type'     => $validated['order_type'],
                'table_number'   => $validated['table_number'] ?? null,
                'payment_method' => $validated['payment_method'],
                'total_amount'   => $totalAmount,
                'amount_paid'    => $validated['amount_paid'],
                'change'         => max(0, $change),
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

            // 3. AUTO-DEDUCT INVENTORY (Anti-Bocor)
            $this->deductInventory($validated['items']);

            // 4. Update expected_ending_cash pada shift (jika bayar cash)
            if ($validated['payment_method'] === 'cash') {
                $activeShift->increment('expected_ending_cash', $totalAmount);
            }

            DB::commit();

            // Load relasi untuk data struk
            $transaction->load('details.product');

            return response()->json([
                'success'     => true,
                'message'     => 'Transaksi berhasil!',
                'transaction' => $transaction,
                'change'      => max(0, $change),
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Terjadi kesalahan: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Auto-deduct stok bahan baku berdasarkan resep produk yang terjual.
     * Setiap item dikali kuantitasnya, lalu dikurangi dari stok.
     */
    private function deductInventory(array $items): void
    {
        // Group by product dan hitung total quantity
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
     * Single-role: semua user yang login bisa re-print transaksi mereka.
     */
    public function getTransaction(Transaction $transaction): JsonResponse
    {
        $transaction->load('details.product', 'shift.user');

        return response()->json($transaction);
    }

    /**
     * Cek stok bahan baku yang hampir habis (untuk peringatan di POS).
     */
    public function lowStockAlert(): JsonResponse
    {
        $lowStock = Ingredient::whereColumn('stock', '<=', 'min_alert_stock')
            ->select('id', 'name', 'stock', 'min_alert_stock', 'unit')
            ->get();

        return response()->json($lowStock);
    }
}
