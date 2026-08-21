<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    /**
     * Tampilkan halaman manajemen shift (buka / tutup shift).
     */
    public function index(): Response
    {
        $user        = auth()->user();
        $activeShift = Shift::where('user_id', $user->id)
            ->where('status', 'open')
            ->with('transactions')
            ->first();

        $recentShifts = Shift::where('user_id', $user->id)
            ->where('status', 'closed')
            ->latest('end_time')
            ->take(5)
            ->get();

        return Inertia::render('Shift/Index', [
            'activeShift'  => $activeShift,
            'recentShifts' => $recentShifts,
        ]);
    }

    /**
     * Buka shift baru (Kasir memasukkan modal awal).
     */
    public function open(Request $request): RedirectResponse
    {
        $user = auth()->user();

        // Pastikan tidak ada shift yang masih open
        $existingShift = Shift::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        if ($existingShift) {
            return redirect()->back()->withErrors(['shift' => 'Anda masih memiliki shift yang aktif. Tutup shift terlebih dahulu.']);
        }

        $validated = $request->validate([
            'starting_cash' => 'required|integer|min:0',
        ]);

        Shift::create([
            'user_id'                => $user->id,
            'start_time'             => Carbon::now(),
            'starting_cash'          => $validated['starting_cash'],
            'expected_ending_cash'   => $validated['starting_cash'], // akan di-update setiap transaksi
            'status'                 => 'open',
        ]);

        return redirect()->route('pos.index')->with('success', 'Shift berhasil dibuka! Selamat bekerja.');
    }

    /**
     * Tutup shift (Kasir memasukkan setoran fisik).
     */
    public function close(Request $request, Shift $shift): RedirectResponse
    {
        if ($shift->user_id !== auth()->id()) {
            abort(403);
        }

        if ($shift->status === 'closed') {
            return redirect()->back()->withErrors(['shift' => 'Shift ini sudah ditutup.']);
        }

        $validated = $request->validate([
            'actual_ending_cash' => 'required|integer|min:0',
        ]);

        // Hitung expected: modal awal + total cash dari semua transaksi cash di shift ini
        $totalCashIncome = $shift->transactions()
            ->where('payment_method', 'cash')
            ->sum('total_amount');

        $expectedEndingCash = $shift->starting_cash + $totalCashIncome;

        $shift->update([
            'end_time'             => Carbon::now(),
            'expected_ending_cash' => $expectedEndingCash,
            'actual_ending_cash'   => $validated['actual_ending_cash'],
            'status'               => 'closed',
        ]);

        return redirect()->route('shift.index')->with('success', 'Shift berhasil ditutup. Sampai jumpa!');
    }

    /**
     * Tampilkan laporan detail satu shift.
     */
    public function show(Shift $shift): Response
    {
        // Single-role: setiap user hanya bisa lihat shift miliknya sendiri

        $shift->load([
            'transactions.details.product',
            'user',
        ]);

        // Hitung ringkasan
        $summary = [
            'total_transactions' => $shift->transactions->count(),
            'total_revenue'      => $shift->transactions->sum('total_amount'),
            'cash_revenue'       => $shift->transactions->where('payment_method', 'cash')->sum('total_amount'),
            'qris_revenue'       => $shift->transactions->where('payment_method', 'qris')->sum('total_amount'),
            'dine_in_count'      => $shift->transactions->where('order_type', 'dine-in')->count(),
            'takeaway_count'     => $shift->transactions->where('order_type', 'takeaway')->count(),
        ];

        return Inertia::render('Shift/Show', [
            'shift'   => $shift,
            'summary' => $summary,
        ]);
    }
}
