<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $today = Carbon::today();

        // ── Transaksi hari ini ───────────────────────────
        $todayTransactions = Transaction::whereDate('created_at', $today)->get();

        $totalRevenue    = $todayTransactions->sum('total_amount');
        $totalTrx        = $todayTransactions->count();
        $cashRevenue     = $todayTransactions->where('payment_method', 'cash')->sum('total_amount');
        $qrisRevenue     = $todayTransactions->where('payment_method', 'qris')->sum('total_amount');
        $dineInCount     = $todayTransactions->where('order_type', 'dine-in')->count();
        $takeawayCount   = $todayTransactions->where('order_type', 'takeaway')->count();

        // ── Grafik penjualan per jam ──────────────────────
        $salesPerHour = Transaction::whereDate('created_at', $today)
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('SUM(total_amount) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->keyBy('hour');

        $hourlyChart = [];
        for ($h = 0; $h <= 23; $h++) {
            $hourlyChart[] = [
                'hour'  => sprintf('%02d:00', $h),
                'total' => $salesPerHour->get($h)?->total ?? 0,
                'count' => $salesPerHour->get($h)?->count ?? 0,
            ];
        }

        // ── Produk terlaris hari ini (top 5) ─────────────
        $topProducts = TransactionDetail::join('transactions', 'transaction_details.transaction_id', '=', 'transactions.id')
            ->join('products', 'transaction_details.product_id', '=', 'products.id')
            ->whereDate('transactions.created_at', $today)
            ->select(
                'products.name',
                DB::raw('SUM(transaction_details.quantity) as total_qty'),
                DB::raw('SUM(transaction_details.subtotal) as total_revenue')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        // ── Bahan baku kritis ─────────────────────────────
        $lowStockItems = Ingredient::whereColumn('stock', '<=', 'min_alert_stock')
            ->orderBy('stock')
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_revenue'  => $totalRevenue,
                'total_trx'      => $totalTrx,
                'cash_revenue'   => $cashRevenue,
                'qris_revenue'   => $qrisRevenue,
                'dine_in_count'  => $dineInCount,
                'takeaway_count' => $takeawayCount,
            ],
            'hourlyChart'  => $hourlyChart,
            'topProducts'  => $topProducts,
            'lowStockItems'=> $lowStockItems,
        ]);
    }
}
