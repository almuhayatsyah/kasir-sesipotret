import { Head, Link } from '@inertiajs/react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// ── Helpers ──────────────────────────────────────────────
const formatRupiah = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v ?? 0);

const formatRupiahShort = (v) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
    if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}rb`;
    return String(v);
};

// ── Stat Card ────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color }) {
    const colors = {
        indigo:  'from-indigo-500 to-indigo-600',
        emerald: 'from-emerald-500 to-emerald-600',
        sky:     'from-sky-500 to-sky-600',
        violet:  'from-violet-500 to-violet-600',
        amber:   'from-amber-400 to-amber-500',
        rose:    'from-rose-500 to-rose-600',
    };
    return (
        <div className={`bg-gradient-to-br ${colors[color] ?? colors.indigo} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium opacity-80">{label}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    {sub && <p className="text-xs opacity-65 mt-0.5">{sub}</p>}
                </div>
                <span className="text-3xl opacity-80">{icon}</span>
            </div>
        </div>
    );
}

// ── Custom Tooltip untuk chart ───────────────────────────
function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color }}>
                    {p.name}: {p.dataKey === 'total' ? formatRupiah(p.value) : p.value + ' trx'}
                </p>
            ))}
        </div>
    );
}

// ── MAIN DASHBOARD ───────────────────────────────────────
export default function Dashboard({ stats = {}, hourlyChart = [], topProducts = [], lowStockItems = [], recentShifts = [], activeShift = null, flash = {} }) {
    const {
        total_revenue  = 0,
        total_trx      = 0,
        cash_revenue   = 0,
        qris_revenue   = 0,
        dine_in_count  = 0,
        takeaway_count = 0,
    } = stats;

    const hasLowStock = lowStockItems?.length > 0;

    // Filter jam yang relevan untuk chart (hanya sampai jam sekarang)
    const currentHour = new Date().getHours();
    const chartData   = hourlyChart?.slice(0, currentHour + 1) ?? [];

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-xl text-gray-800">Dashboard</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    📅 {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>
        }>
            <Head title="Dashboard — Kasir Sesi Potret" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* ── Flash ── */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
                        ✅ {flash.success}
                    </div>
                )}

                {/* ── Alert Stok Kritis ── */}
                {hasLowStock && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                        <span className="text-rose-500 text-xl">⚠️</span>
                        <div>
                            <p className="font-semibold text-rose-700 text-sm">
                                {lowStockItems.length} bahan baku hampir habis!
                            </p>
                            <p className="text-rose-600 text-xs mt-0.5">
                                {lowStockItems.map(i => `${i.name} (${i.stock} ${i.unit})`).join(', ')}
                            </p>
                        </div>
                        <Link
                            href={route('inventory.ingredients')}
                            className="ml-auto text-xs bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg font-medium transition shrink-0"
                        >
                            Restok →
                        </Link>
                    </div>
                )}

                {/* ── Status Shift ── */}
                <div className={`rounded-2xl px-6 py-4 flex items-center justify-between ${activeShift ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <div>
                        <p className="text-sm opacity-80">Status Shift Saat Ini</p>
                        <p className="font-bold text-lg mt-0.5">
                            {activeShift ? `🟢 Shift #${activeShift.id} Aktif` : '🔴 Tidak Ada Shift Aktif'}
                        </p>
                    </div>
                    <Link
                        href={activeShift ? route('pos.index') : route('shift.index')}
                        className={`text-sm font-semibold px-4 py-2 rounded-xl transition ${activeShift ? 'bg-white text-emerald-600 hover:bg-emerald-50' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                    >
                        {activeShift ? '☕ Buka POS' : '☀️ Buka Shift'}
                    </Link>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <StatCard label="Pendapatan Hari Ini" value={formatRupiahShort(total_revenue)}
                        sub={formatRupiah(total_revenue)} icon="💰" color="indigo" />
                    <StatCard label="Total Transaksi" value={total_trx}
                        sub="hari ini" icon="🧾" color="emerald" />
                    <StatCard label="Tunai" value={formatRupiahShort(cash_revenue)}
                        sub={formatRupiah(cash_revenue)} icon="💵" color="sky" />
                    <StatCard label="QRIS" value={formatRupiahShort(qris_revenue)}
                        sub={formatRupiah(qris_revenue)} icon="📱" color="violet" />
                    <StatCard label="Dine-in" value={dine_in_count}
                        sub="transaksi" icon="🪑" color="amber" />
                    <StatCard label="Takeaway" value={takeaway_count}
                        sub="transaksi" icon="🛍️" color="rose" />
                </div>

                {/* ── Charts Row ── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                    {/* Area Chart — Penjualan per jam */}
                    <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800">📈 Penjualan Per Jam</h3>
                            <span className="text-xs text-gray-400">Hari ini</span>
                        </div>
                        {chartData.length === 0 || chartData.every(d => d.total === 0) ? (
                            <div className="h-48 flex items-center justify-center text-gray-300">
                                <div className="text-center">
                                    <p className="text-4xl mb-2">📊</p>
                                    <p className="text-sm">Belum ada transaksi hari ini</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                    <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={55} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area
                                        type="monotone" dataKey="total" name="Pendapatan"
                                        stroke="#6366f1" strokeWidth={2.5}
                                        fill="url(#colorRevenue)" dot={false} activeDot={{ r: 5 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Top Products Bar Chart */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800">🏆 Menu Terlaris</h3>
                            <span className="text-xs text-gray-400">Hari ini</span>
                        </div>
                        {!topProducts?.length ? (
                            <div className="h-48 flex items-center justify-center text-gray-300">
                                <div className="text-center">
                                    <p className="text-4xl mb-2">🍵</p>
                                    <p className="text-sm">Belum ada penjualan</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip formatter={(v, n) => n === 'total_qty' ? [v + ' pcs', 'Terjual'] : [formatRupiah(v), 'Revenue']} />
                                    <Bar dataKey="total_qty" name="Terjual" fill="#6366f1" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* ── Bottom Row ── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                    {/* Stok Kritis */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">📦 Status Stok Bahan Baku</h3>
                            <Link href={route('inventory.ingredients')} className="text-xs text-indigo-600 hover:text-indigo-800 transition">
                                Kelola →
                            </Link>
                        </div>
                        {!lowStockItems?.length ? (
                            <div className="px-5 py-8 text-center text-gray-400">
                                <p className="text-3xl mb-2">✅</p>
                                <p className="text-sm font-medium">Semua stok aman</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {lowStockItems.map((item) => {
                                    const pct = Math.min(100, Math.round((item.stock / (item.min_alert_stock || 1)) * 100));
                                    return (
                                        <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-rose-400 rounded-full transition-all"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-400">{pct}%</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-bold text-rose-500">{item.stock}</p>
                                                <p className="text-xs text-gray-400">{item.unit}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Riwayat Shift Terakhir */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">🕐 Riwayat Shift</h3>
                            <Link href={route('shift.index')} className="text-xs text-indigo-600 hover:text-indigo-800 transition">
                                Lihat semua →
                            </Link>
                        </div>
                        {!recentShifts?.length ? (
                            <div className="px-5 py-8 text-center text-gray-400">
                                <p className="text-3xl mb-2">📋</p>
                                <p className="text-sm">Belum ada riwayat shift</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {recentShifts.map((shift) => {
                                    const selisih = (shift.actual_ending_cash ?? 0) - (shift.expected_ending_cash ?? 0);
                                    const startDate = new Date(shift.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                                    const startTime = new Date(shift.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <Link
                                            key={shift.id}
                                            href={route('shift.show', shift.id)}
                                            className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">
                                                    Shift #{shift.id} — {startDate} {startTime}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {shift.transactions_count ?? 0} transaksi
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {formatRupiah(shift.total_revenue ?? 0)}
                                                </p>
                                                <p className={`text-xs font-medium ${selisih >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {selisih >= 0 ? '+' : ''}{formatRupiah(selisih)}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Quick Links ── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { href: route('pos.index'),                label: 'Buka POS',           icon: '☕', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
                        { href: route('inventory.ingredients'),    label: 'Bahan Baku',         icon: '📦', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
                        { href: route('inventory.products'),       label: 'Menu Produk',        icon: '🍵', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
                    ].map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${link.color} rounded-2xl py-4 flex flex-col items-center gap-2 transition font-medium text-sm`}
                        >
                            <span className="text-2xl">{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
