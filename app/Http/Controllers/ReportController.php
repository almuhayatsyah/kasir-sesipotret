<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionDetail;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        // Default range: awal bulan ini s/d hari ini
        $startDateInput = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDateInput   = $request->input('end_date', Carbon::now()->toDateString());

        $startDate = Carbon::parse($startDateInput)->startOfDay();
        $endDate   = Carbon::parse($endDateInput)->endOfDay();

        // 1. Ambil query transaksi dalam rentang tanggal
        $query = Transaction::whereBetween('created_at', [$startDate, $endDate]);

        // Ringkasan Finansial
        $totalRevenue  = (int) $query->sum('total_amount');
        $totalTrx      = (int) $query->count();
        $cashRevenue   = (int) $query->clone()->where('payment_method', 'cash')->sum('total_amount');
        $qrisRevenue   = (int) $query->clone()->where('payment_method', 'qris')->sum('total_amount');
        $dineInCount   = (int) $query->clone()->where('order_type', 'dine-in')->count();
        $takeawayCount = (int) $query->clone()->where('order_type', 'takeaway')->count();

        // 2. Ringkasan per Produk
        $productSales = TransactionDetail::join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->join('products', 'transaction_details.product_id', '=', 'products.id')
            ->whereBetween('transactions.created_at', [$startDate, $endDate])
            ->select(
                'products.name',
                'products.category',
                DB::raw('SUM(transaction_details.quantity) as total_qty'),
                DB::raw('SUM(transaction_details.subtotal) as total_revenue')
            )
            ->groupBy('products.id', 'products.name', 'products.category')
            ->orderByDesc('total_qty')
            ->get();

        // 3. Riwayat Transaksi Detail
        $transactions = Transaction::with('user')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Report/Index', [
            'filters' => [
                'start_date' => $startDateInput,
                'end_date'   => $endDateInput,
            ],
            'stats' => [
                'total_revenue'  => $totalRevenue,
                'total_trx'      => $totalTrx,
                'cash_revenue'   => $cashRevenue,
                'qris_revenue'   => $qrisRevenue,
                'dine_in_count'  => $dineInCount,
                'takeaway_count' => $takeawayCount,
            ],
            'productSales' => $productSales,
            'transactions' => $transactions,
        ]);
    }

    public function exportExcel(Request $request)
    {
        $startDateInput = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDateInput   = $request->input('end_date', Carbon::now()->toDateString());

        $startDate = Carbon::parse($startDateInput)->startOfDay();
        $endDate   = Carbon::parse($endDateInput)->endOfDay();

        $transactions = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at')
            ->get();

        $filename = "Laporan-Penjualan_{$startDateInput}_sd_{$endDateInput}.csv";

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        return response()->streamDownload(function () use ($transactions) {
            $file = fopen('php://output', 'w');
            
            // CSV Header
            fputcsv($file, ['No Invoice', 'Waktu Transaksi', 'Tipe Order', 'No. Meja', 'Metode Bayar', 'Total Belanja (Rp)']);
            
            // Rows
            foreach ($transactions as $trx) {
                fputcsv($file, [
                    $trx->invoice_number,
                    $trx->created_at->format('Y-m-d H:i:s'),
                    strtoupper($trx->order_type),
                    $trx->table_number ?? '-',
                    strtoupper($trx->payment_method),
                    $trx->total_amount
                ]);
            }
            
            fclose($file);
        }, $filename, $headers);
    }
}
