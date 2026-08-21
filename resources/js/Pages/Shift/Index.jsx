import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// ─── Format currency ──────────────────────────────────
const formatRupiah = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

// ─── Duration calculator ──────────────────────────────
const calcDuration = (start, end) => {
    if (!start || !end) return null;
    const diffMs  = new Date(end) - new Date(start);
    const hours   = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}j ${minutes}m`;
};

export default function ShiftIndex({ activeShift, recentShifts, flash }) {
    const [tab, setTab] = useState(activeShift ? 'close' : 'open');

    // Form buka shift
    const openForm = useForm({ starting_cash: '' });
    // Form tutup shift
    const closeForm = useForm({ actual_ending_cash: '' });

    const handleOpen = (e) => {
        e.preventDefault();
        openForm.post(route('shift.open'), { preserveScroll: true });
    };

    const handleClose = (e) => {
        e.preventDefault();
        if (!activeShift) return;
        closeForm.post(route('shift.close', activeShift.id), {
            method: 'post',
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen Shift</h2>}>
            <Head title="Manajemen Shift — Kasir Sesi Potret" />

            <div className="py-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Flash message */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-2">
                        <span>✅</span> {flash.success}
                    </div>
                )}
                {flash?.warning && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-2">
                        <span>⚠️</span> {flash.warning}
                    </div>
                )}

                {/* Status Banner */}
                <div className={`rounded-2xl p-6 flex items-center justify-between shadow-sm ${activeShift ? 'bg-emerald-500' : 'bg-slate-700'} text-white`}>
                    <div>
                        <p className="text-sm font-medium opacity-80">Status Shift</p>
                        <p className="text-2xl font-bold mt-1">
                            {activeShift ? '🟢 Shift Aktif' : '🔴 Tidak Ada Shift'}
                        </p>
                        {activeShift && (
                            <p className="text-sm opacity-75 mt-1">
                                Dibuka: {formatDate(activeShift.start_time)} •
                                Modal: {formatRupiah(activeShift.starting_cash)}
                            </p>
                        )}
                    </div>
                    {activeShift && (
                        <Link
                            href={route('pos.index')}
                            className="bg-white text-emerald-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition"
                        >
                            Buka POS →
                        </Link>
                    )}
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setTab('open')}
                            disabled={!!activeShift}
                            className={`flex-1 py-4 text-sm font-semibold transition ${
                                tab === 'open'
                                    ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500'
                                    : 'text-gray-500 hover:bg-gray-50'
                            } ${activeShift ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            ☀️ Buka Shift
                        </button>
                        <button
                            onClick={() => setTab('close')}
                            disabled={!activeShift}
                            className={`flex-1 py-4 text-sm font-semibold transition ${
                                tab === 'close'
                                    ? 'bg-rose-50 text-rose-700 border-b-2 border-rose-500'
                                    : 'text-gray-500 hover:bg-gray-50'
                            } ${!activeShift ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            🌙 Tutup Shift
                        </button>
                    </div>

                    <div className="p-6">
                        {/* ── BUKA SHIFT ── */}
                        {tab === 'open' && !activeShift && (
                            <form onSubmit={handleOpen} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Modal Awal (Uang Receh di Laci)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1000"
                                            value={openForm.data.starting_cash}
                                            onChange={(e) => openForm.setData('starting_cash', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-lg"
                                            placeholder="100000"
                                            required
                                        />
                                    </div>
                                    {openForm.errors.starting_cash && (
                                        <p className="text-rose-500 text-sm mt-1">{openForm.errors.starting_cash}</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={openForm.processing}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-50"
                                >
                                    {openForm.processing ? 'Memproses...' : '☀️ Buka Shift Sekarang'}
                                </button>
                            </form>
                        )}

                        {/* ── TUTUP SHIFT ── */}
                        {tab === 'close' && activeShift && (
                            <form onSubmit={handleClose} className="space-y-4">
                                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Modal Awal</span>
                                        <span className="font-semibold">{formatRupiah(activeShift.starting_cash)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Ekspektasi Kas</span>
                                        <span className="font-semibold text-emerald-600">{formatRupiah(activeShift.expected_ending_cash)}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Setoran Aktual (Hitung uang di laci)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1000"
                                            value={closeForm.data.actual_ending_cash}
                                            onChange={(e) => closeForm.setData('actual_ending_cash', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none text-lg"
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                    {closeForm.errors.actual_ending_cash && (
                                        <p className="text-rose-500 text-sm mt-1">{closeForm.errors.actual_ending_cash}</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={closeForm.processing}
                                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-50"
                                >
                                    {closeForm.processing ? 'Memproses...' : '🌙 Tutup Shift & Hitung'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Riwayat Shift */}
                {recentShifts?.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">Riwayat Shift Terakhir</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {recentShifts.map((shift) => {
                                const selisih = shift.actual_ending_cash - shift.expected_ending_cash;
                                return (
                                    <Link
                                        key={shift.id}
                                        href={route('shift.show', shift.id)}
                                        className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-800 text-sm">
                                                {formatDate(shift.start_time)}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Durasi: {calcDuration(shift.start_time, shift.end_time)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-semibold ${selisih >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                {selisih >= 0 ? '+' : ''}{formatRupiah(selisih)}
                                            </p>
                                            <p className="text-xs text-gray-400">selisih kas</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
