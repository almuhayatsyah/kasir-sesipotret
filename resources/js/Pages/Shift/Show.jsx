import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const formatRupiah = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '—';

export default function ShiftShow({ shift, summary }) {
    const selisih = (shift.actual_ending_cash ?? 0) - (shift.expected_ending_cash ?? 0);

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-4">
                <Link href={route('shift.index')} className="text-gray-500 hover:text-gray-800 transition text-sm">← Kembali</Link>
                <h2 className="font-semibold text-xl text-gray-800">Laporan Shift #{shift.id}</h2>
            </div>
        }>
            <Head title={`Laporan Shift #${shift.id}`} />

            <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Header info */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoCard label="Kasir" value={shift.user?.name ?? '—'} />
                    <InfoCard label="Mulai" value={formatDate(shift.start_time)} />
                    <InfoCard label="Selesai" value={formatDate(shift.end_time)} />
                    <InfoCard label="Status" value={shift.status === 'open' ? '🟢 Aktif' : '⚪ Selesai'} />
                </div>

                {/* Revenue summary */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard label="Total Transaksi" value={summary.total_transactions} unit="transaksi" color="indigo" />
                    <StatCard label="Total Pendapatan" value={formatRupiah(summary.total_revenue)} color="emerald" />
                    <StatCard label="Selisih Kas" value={formatRupiah(selisih)} color={selisih >= 0 ? 'emerald' : 'rose'} />
                    <StatCard label="Cash" value={formatRupiah(summary.cash_revenue)} color="sky" />
                    <StatCard label="QRIS" value={formatRupiah(summary.qris_revenue)} color="violet" />
                    <StatCard label="Dine-in / Takeaway" value={`${summary.dine_in_count} / ${summary.takeaway_count}`} color="amber" />
                </div>

                {/* Kas rekonsiliasi */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Rekonsiliasi Kas</h3>
                    <div className="space-y-3 text-sm">
                        <Row label="Modal Awal"        value={formatRupiah(shift.starting_cash)} />
                        <Row label="Total Cash Masuk"  value={formatRupiah(summary.cash_revenue)} />
                        <Row label="Ekspektasi Kas"    value={formatRupiah(shift.expected_ending_cash)} bold />
                        <Row label="Setoran Aktual"    value={formatRupiah(shift.actual_ending_cash)} bold />
                        <hr className="border-gray-100" />
                        <Row
                            label="Selisih"
                            value={(selisih >= 0 ? '+' : '') + formatRupiah(selisih)}
                            color={selisih >= 0 ? 'text-emerald-600' : 'text-rose-500'}
                            bold
                        />
                    </div>
                </div>

                {/* Daftar transaksi */}
                {shift.transactions?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">Daftar Transaksi ({shift.transactions.length})</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Invoice</th>
                                        <th className="px-6 py-3 text-left">Tipe</th>
                                        <th className="px-6 py-3 text-left">Bayar</th>
                                        <th className="px-6 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {shift.transactions.map((trx) => (
                                        <tr key={trx.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 font-mono text-xs text-indigo-600">{trx.invoice_number}</td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    trx.order_type === 'dine-in'
                                                        ? 'bg-sky-100 text-sky-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {trx.order_type === 'dine-in' ? '🪑 Dine-in' : '🛍️ Takeaway'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    trx.payment_method === 'cash'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-violet-100 text-violet-700'
                                                }`}>
                                                    {trx.payment_method === 'cash' ? '💵 Cash' : '📱 QRIS'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right font-semibold text-gray-800">
                                                {formatRupiah(trx.total_amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function InfoCard({ label, value }) {
    return (
        <div>
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-gray-800">{value}</p>
        </div>
    );
}

function StatCard({ label, value, unit, color }) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        rose: 'bg-rose-50 text-rose-500',
        sky: 'bg-sky-50 text-sky-700',
        violet: 'bg-violet-50 text-violet-700',
        amber: 'bg-amber-50 text-amber-700',
    };
    return (
        <div className={`rounded-2xl p-5 ${colors[color] || colors.indigo}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
            {unit && <p className="text-xs opacity-60">{unit}</p>}
        </div>
    );
}

function Row({ label, value, color, bold }) {
    return (
        <div className="flex justify-between">
            <span className="text-gray-500">{label}</span>
            <span className={`${bold ? 'font-semibold' : ''} ${color || 'text-gray-800'}`}>{value}</span>
        </div>
    );
}
