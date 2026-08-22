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
        indigo:  'from-brand-teal to-brand-navy',
        emerald: 'from-brand-navy to-brand-navy/80',
        sky:     'from-brand-teal/80 to-brand-teal',
        violet:  'from-brand-gold to-brand-gold/80',
        amber:   'from-brand-gold/80 to-brand-gold',
        rose:    'from-brand-coral to-brand-coral/80',
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

// ── Custom Tooltip ───────────────────────────────────────
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
export default function Dashboard({ stats = {}, hourlyChart = [], topProducts = [], lowStockItems = [], flash = {} }) {
    const {
        total_revenue  = 0,
        total_trx      = 0,
        cash_revenue   = 0,
        qris_revenue   = 0,
        dine_in_count  = 0,
        takeaway_count = 0,
    } = stats;

    const hasLowStock = lowStockItems?.length > 0;
    const currentHour = new Date().getHours();
    const chartData   = hourlyChart?.slice(0, currentHour + 1) ?? [];

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <h2 className="font-serif font-semibold text-2xl text-brand-navy">Dashboard</h2>
                <div className="flex items-center gap-2 text-sm text-brand-navy/60">
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
                    <div className="bg-brand-coral/10 border border-brand-coral/20 rounded-2xl px-5 py-4 flex items-start gap-3">
                        <span className="text-brand-coral text-xl">⚠️</span>
                        <div>
                            <p className="font-semibold text-brand-coral text-sm">
                                {lowStockItems.length} bahan baku hampir habis!
                            </p>
                            <p className="text-brand-coral/80 text-xs mt-0.5">
                                {lowStockItems.map(i => `${i.name} (${i.stock} ${i.unit})`).join(', ')}
                            </p>
                        </div>
                        <Link
                            href={route('inventory.ingredients')}
                            className="ml-auto text-xs bg-brand-coral hover:bg-brand-coral/90 text-white px-3 py-1.5 rounded-lg font-medium transition shrink-0"
                        >
                            Restok →
                        </Link>
                    </div>
                )}

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
                    <div className="xl:col-span-2 bg-white rounded-2xl border border-brand-navy/5 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-brand-navy">📈 Penjualan Per Jam</h3>
                            <span className="text-xs text-brand-navy/50">Hari ini</span>
                        </div>
                        {chartData.length === 0 || chartData.every(d => d.total === 0) ? (
                            <div className="h-48 flex items-center justify-center text-brand-navy/30">
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
                                            <stop offset="5%" stopColor="#1FA9A0" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#1FA9A0" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#FBF3E2" />
                                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#0E3B4D', opacity: 0.6 }} tickLine={false} axisLine={false} />
                                    <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize: 11, fill: '#0E3B4D', opacity: 0.6 }} tickLine={false} axisLine={false} width={55} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area
                                        type="monotone" dataKey="total" name="Pendapatan"
                                        stroke="#1FA9A0" strokeWidth={2.5}
                                        fill="url(#colorRevenue)" dot={false} activeDot={{ r: 5 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Top Products Bar Chart */}
                    <div className="bg-white rounded-2xl border border-brand-navy/5 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-brand-navy">🏆 Menu Terlaris</h3>
                            <span className="text-xs text-brand-navy/50">Hari ini</span>
                        </div>
                        {!topProducts?.length ? (
                            <div className="h-48 flex items-center justify-center text-brand-navy/30">
                                <div className="text-center">
                                    <p className="text-4xl mb-2">🍵</p>
                                    <p className="text-sm">Belum ada penjualan</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#FBF3E2" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#0E3B4D', opacity: 0.6 }} tickLine={false} axisLine={false} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#0E3B4D' }} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip formatter={(v, n) => n === 'total_qty' ? [v + ' pcs', 'Terjual'] : [formatRupiah(v), 'Revenue']} />
                                    <Bar dataKey="total_qty" name="Terjual" fill="#1FA9A0" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* ── Bottom Row: Stok Kritis ── */}
                <div className="bg-white rounded-2xl border border-brand-navy/5 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-brand-navy/5 flex items-center justify-between">
                        <h3 className="font-semibold text-brand-navy">📦 Status Stok Bahan Baku</h3>
                        <Link href={route('inventory.ingredients')} className="text-xs text-brand-teal hover:text-brand-teal/80 transition">
                            Kelola →
                        </Link>
                    </div>
                    {!lowStockItems?.length ? (
                        <div className="px-5 py-8 text-center text-brand-navy/40">
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
                                            <p className="text-sm font-medium text-brand-navy truncate">{item.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1.5 bg-brand-navy/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-brand-coral rounded-full transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-brand-navy/40">{pct}%</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold text-brand-coral">{item.stock}</p>
                                            <p className="text-xs text-brand-navy/40">{item.unit}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Quick Links ── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { href: route('pos.index'),             label: 'Buka POS',    icon: '☕', color: 'bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20' },
                        { href: route('inventory.ingredients'), label: 'Bahan Baku',  icon: '📦', color: 'bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20' },
                        { href: route('inventory.products'),    label: 'Menu Produk', icon: '🍵', color: 'bg-brand-navy/10 text-brand-navy hover:bg-brand-navy/20' },
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
