import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const formatRupiah = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount ?? 0);

// ─── Receipt Printer ──────────────────────────────────
// Lebar thermal 58mm ≈ 32 karakter monospace
const C = 32; // lebar kolom
const pad  = (str, len) => String(str).padEnd(len, " ");
const rpad = (str, len) => String(str).padStart(len, " ");
const center = (str) => {
    const s = String(str);
    const sp = Math.max(0, Math.floor((C - s.length) / 2));
    return " ".repeat(sp) + s;
};
const divider  = "=".repeat(C);
const divider2 = "-".repeat(C);

const printReceipt = (transaction) => {
    const isPending = transaction.payment_status === "pending";
    const now = new Date().toLocaleString("id-ID", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    const minuman = (transaction.details || []).filter(
        (d) => d.product?.category === "minuman",
    );
    const makanan = (transaction.details || []).filter(
        (d) => d.product?.category !== "minuman",
    );

    const fmtItem = (d) => {
        const suhu = d.temperature
            ? ` [${d.temperature === "hot" ? "HOT" : "ICE"}]`
            : "";
        const nama = `${d.product?.name ?? ""}${suhu}`;
        const namaLine = nama.length > C - 2 ? nama.slice(0, C - 2) : nama;
        const qty    = `  ${d.quantity}x`;
        const harga  = formatRupiah(d.price);
        const sub    = formatRupiah(d.subtotal);
        const gap    = C - qty.length - harga.length - sub.length - 3;
        const hargaLine = `${qty} ${harga}${" ".repeat(Math.max(1, gap))}${sub}`;
        return `${namaLine}\n${hargaLine}`;
    };

    const lines = [
        divider,
        center("SESI POTRET"),
        center("Coffee & Eatery"),
        divider,
        `No : ${transaction.invoice_number}`,
        `Tgl: ${now}`,
        `Jns: ${transaction.order_type === "dine-in" ? "Dine-in" : "Takeaway"}`,
        transaction.table_number
            ? `Meja: No. ${transaction.table_number}`
            : null,
        transaction.customer_name
            ? `Cust: ${transaction.customer_name}`
            : null,
        divider2,

        minuman.length > 0 ? center("[ MINUMAN ]") : null,
        minuman.length > 0 ? divider2 : null,
        ...minuman.map(fmtItem),

        makanan.length > 0 ? divider2 : null,
        makanan.length > 0 ? center("[ MAKANAN ]") : null,
        makanan.length > 0 ? divider2 : null,
        ...makanan.map(fmtItem),

        divider2,
        transaction.discount > 0 ? `${pad("SUBTOTAL", 16)}${rpad(formatRupiah(transaction.total_amount + transaction.discount), C - 16)}` : null,
        transaction.discount > 0 ? `${pad("DISKON", 16)}${rpad("-" + formatRupiah(transaction.discount), C - 16)}` : null,
        `${pad("TOTAL", 16)}${rpad(formatRupiah(transaction.total_amount), C - 16)}`,

        ...(isPending
            ? [
                divider,
                center("** BELUM DIBAYAR **"),
                center("Selesaikan pembayaran"),
              ]
            : [
                `${pad("BAYAR", 16)}${rpad(formatRupiah(transaction.amount_paid), C - 16)}`,
                transaction.change > 0
                    ? `${pad("KEMBALI", 16)}${rpad(formatRupiah(transaction.change), C - 16)}`
                    : null,
                divider,
                center((transaction.payment_method || "TUNAI").toUpperCase()),
              ]),

        divider,
        center("Terima kasih!"),
        center("Selamat menikmati"),
        divider,
        "\n\n"
    ]
        .filter((l) => l !== null)
        .join("\n");

    if (/android/i.test(navigator.userAgent)) {
        try {
            const base64data = btoa(unescape(encodeURIComponent(lines)));
            const intentUrl = "intent:base64," + base64data + "#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;";
            window.location.href = intentUrl;
        } catch (e) {
            console.error("Gagal format RawBT:", e);
            alert("Gagal mencetak struk. Pastikan aplikasi RawBT sudah terinstall.");
        }
    } else {
        const win = window.open("", "_blank", "width=340,height=700");
        win.document.write(`<!DOCTYPE html><html><head>
<title>Struk ${transaction.invoice_number}</title>
<style>
  @page { margin: 0; size: 58mm auto; }
  body { margin: 4px; font-family: 'Courier New', Courier, monospace; font-size: 11px; }
  pre { white-space: pre-wrap; word-break: break-word; }
</style>
</head><body><pre>${lines}</pre></body></html>`);
        win.document.close();
        win.print();
        win.close();
    }
};

export default function ReportIndex({ filters, stats, productSales, transactions }) {
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [activeTab, setActiveTab] = useState('products'); // 'products' atau 'transactions'
    const [activePreset, setActivePreset] = useState('');

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('report.index'), {
            start_date: startDate,
            end_date: endDate
        }, { preserveState: true });
    };

    const applyPreset = (preset) => {
        setActivePreset(preset);
        const now = new Date();
        // Shift to local time without dealing with timezone offsets messing up the date
        const offset = now.getTimezoneOffset() * 60000; 
        
        let start = new Date(now.getTime() - offset);
        let end = new Date(now.getTime() - offset);

        if (preset === 'today') {
            // start is today
        } else if (preset === 'week') {
            const day = now.getDay() || 7;
            start.setDate(start.getDate() - (day - 1));
        } else if (preset === 'month') {
            start.setDate(1);
        } else if (preset === 'year') {
            start.setMonth(0, 1);
        }

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        
        setStartDate(startStr);
        setEndDate(endStr);
        
        router.get(route('report.index'), {
            start_date: startStr,
            end_date: endStr
        }, { preserveState: true });
    };

    const handleReset = () => {
        setActivePreset('');
        const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        setStartDate(firstOfMonth);
        setEndDate(today);
        router.get(route('report.index'), {
            start_date: firstOfMonth,
            end_date: today
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <h2 className="font-serif font-semibold text-2xl text-brand-navy">Laporan Keuangan & Penjualan</h2>
                <div className="flex items-center gap-3 print:hidden">
                    <a
                        href={route('report.export', { start_date: startDate, end_date: endDate })}
                        className="bg-brand-teal hover:bg-brand-teal/90 text-white text-sm px-4 py-2 rounded-xl font-semibold transition flex items-center gap-1.5 shadow-lg shadow-brand-teal/20"
                    >
                        📊 Export Excel
                    </a>
                    <button
                        onClick={handlePrint}
                        className="bg-brand-navy hover:bg-brand-navy/90 text-white text-sm px-4 py-2 rounded-xl font-semibold transition flex items-center gap-1.5 shadow-lg shadow-brand-navy/20"
                    >
                        🖨️ Cetak PDF
                    </button>
                </div>
            </div>
        }>
            <Head title="Laporan Keuangan — Kasir Sesi Potret" />

            <div className="py-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* ── FILTER TANGGAL (print:hidden) ── */}
                <div className="bg-white border border-brand-navy/5 rounded-2xl p-5 shadow-sm print:hidden space-y-4">
                    {/* Preset Buttons */}
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-brand-navy/60 mr-2 py-1.5">Periode Cepat:</span>
                        {[
                            { id: 'today', label: 'Hari Ini' },
                            { id: 'week', label: 'Minggu Ini' },
                            { id: 'month', label: 'Bulan Ini' },
                            { id: 'year', label: 'Tahun Ini' },
                        ].map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => applyPreset(preset.id)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    activePreset === preset.id
                                        ? 'bg-brand-teal text-white shadow-md shadow-brand-teal/30 ring-2 ring-brand-teal/30'
                                        : 'bg-brand-navy/10 text-brand-navy hover:bg-brand-navy/20 hover:shadow-sm'
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs text-brand-navy/60 font-medium mb-1.5 block">Tanggal Mulai</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setActivePreset(''); }}
                                className="w-full border border-brand-navy/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition"
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs text-brand-navy/60 font-medium mb-1.5 block">Tanggal Selesai</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setActivePreset(''); }}
                                className="w-full border border-brand-navy/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition"
                            />
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-4 py-2 text-sm font-medium border border-brand-navy/10 hover:bg-brand-navy/5 text-brand-navy/80 rounded-xl transition"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 text-sm font-semibold bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl transition shadow-md shadow-brand-teal/20"
                            >
                                Terapkan Filter
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── PRINT-ONLY HEADER (Hanya tampil saat print) ── */}
                <div className="hidden print:block text-center border-b border-brand-navy/20 pb-5">
                    <h1 className="text-2xl font-bold text-brand-navy">KASIR SESI POTRET</h1>
                    <p className="text-sm text-brand-navy/60 mt-1">Laporan Keuangan & Penjualan</p>
                    <p className="text-xs text-brand-navy/40 mt-0.5">
                        Rentang Waktu: {new Date(startDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })} s/d {new Date(endDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    </p>
                </div>

                {/* ── STATS CARDS ── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 print:gap-2">
                    <div className="bg-white border border-brand-navy/5 p-5 rounded-2xl shadow-sm print:border-black print:rounded-none print:shadow-none">
                        <p className="text-xs text-brand-navy/50 font-medium print:text-black">Total Pendapatan</p>
                        <p className="text-2xl font-extrabold text-brand-navy mt-1.5 print:text-black">{formatRupiah(stats.total_revenue)}</p>
                        <p className="text-[10px] text-brand-navy/40 mt-1 print:text-black">Bruto penjualan bersih</p>
                    </div>
                    <div className="bg-white border border-brand-navy/5 p-5 rounded-2xl shadow-sm print:border-black print:rounded-none print:shadow-none">
                        <p className="text-xs text-brand-navy/50 font-medium print:text-black">Total Diskon</p>
                        <p className="text-2xl font-extrabold text-brand-coral mt-1.5 print:text-black">{formatRupiah(stats.total_discount)}</p>
                        <p className="text-[10px] text-brand-navy/40 mt-1 print:text-black">Potongan pelanggan</p>
                    </div>
                    <div className="bg-white border border-brand-navy/5 p-5 rounded-2xl shadow-sm print:border-black print:rounded-none print:shadow-none">
                        <p className="text-xs text-brand-navy/50 font-medium print:text-black">Total Transaksi</p>
                        <p className="text-2xl font-extrabold text-brand-teal mt-1.5 print:text-black">{stats.total_trx} <span className="text-sm font-semibold text-brand-navy/40 print:text-black">Nota</span></p>
                        <p className="text-[10px] text-brand-navy/40 mt-1 print:text-black">
                            {stats.dine_in_count} Dine-in • {stats.takeaway_count} Takeaway
                        </p>
                    </div>
                    <div className="bg-white border border-brand-navy/5 p-5 rounded-2xl shadow-sm print:border-black print:rounded-none print:shadow-none">
                        <p className="text-xs text-brand-navy/50 font-medium print:text-black">Pembayaran Tunai</p>
                        <p className="text-2xl font-extrabold text-brand-teal mt-1.5 print:text-black">{formatRupiah(stats.cash_revenue)}</p>
                        <p className="text-[10px] text-brand-navy/40 mt-1 print:text-black">Cash in hand</p>
                    </div>
                    <div className="bg-white border border-brand-navy/5 p-5 rounded-2xl shadow-sm print:border-black print:rounded-none print:shadow-none">
                        <p className="text-xs text-brand-navy/50 font-medium print:text-black">Pembayaran QRIS</p>
                        <p className="text-2xl font-extrabold text-brand-gold mt-1.5 print:text-black">{formatRupiah(stats.qris_revenue)}</p>
                        <p className="text-[10px] text-brand-navy/40 mt-1 print:text-black">Masuk rekening e-wallet</p>
                    </div>
                </div>

                {/* ── TAB PILIHAN VIEW (print:hidden) ── */}
                <div className="flex border-b border-brand-navy/10 print:hidden">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 -mb-px ${
                            activeTab === 'products'
                                ? 'border-brand-teal text-brand-teal'
                                : 'border-transparent text-brand-navy/50 hover:text-brand-navy/80'
                        }`}
                    >
                        🏆 Penjualan per Produk
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 -mb-px ${
                            activeTab === 'transactions'
                                ? 'border-brand-teal text-brand-teal'
                                : 'border-transparent text-brand-navy/50 hover:text-brand-navy/80'
                        }`}
                    >
                        🧾 Riwayat Transaksi Detail
                    </button>
                </div>

                {/* ══ CONTENT VIEW 1: PENJUALAN PER PRODUK ══ */}
                {(activeTab === 'products' || window.matchMedia('print').matches) && (
                    <div className="bg-white border border-brand-navy/5 rounded-2xl shadow-sm overflow-hidden print:border-black print:rounded-none print:shadow-none print:mt-6">
                        <div className="px-5 py-4 border-b border-brand-navy/5 bg-brand-navy/5 print:bg-transparent print:border-black">
                            <h3 className="font-bold text-brand-navy print:text-black">Ringkasan Penjualan Menu</h3>
                        </div>
                        {productSales.length === 0 ? (
                            <div className="p-12 text-center text-brand-navy/40 print:text-black">
                                Belum ada data penjualan pada rentang waktu ini.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm print:border-collapse">
                                    <thead>
                                        <tr className="bg-brand-navy/5 border-b border-brand-navy/10 text-brand-navy/60 font-semibold print:bg-transparent print:border-black print:text-black">
                                            <th className="px-6 py-3 print:border-b print:border-black">Nama Menu</th>
                                            <th className="px-6 py-3 print:border-b print:border-black">Kategori</th>
                                            <th className="px-6 py-3 text-right print:border-b print:border-black">Jumlah Terjual</th>
                                            <th className="px-6 py-3 text-right print:border-b print:border-black">Total Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-navy/5 print:divide-black">
                                        {productSales.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-brand-navy/5 print:border-b print:border-black/50">
                                                <td className="px-6 py-3.5 font-medium text-brand-navy print:text-black">{item.name}{item.temperature ? ` (${item.temperature === 'hot' ? 'Hot' : 'Ice'})` : ''}</td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase print:border print:border-black print:text-black print:bg-transparent ${
                                                        item.category === 'coffee' ? 'bg-brand-navy/10 text-brand-navy' :
                                                        item.category === 'non-coffee' ? 'bg-brand-teal/10 text-brand-teal' :
                                                        'bg-brand-gold/10 text-brand-gold'
                                                    }`}>
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-right font-bold text-brand-navy/80 print:text-black">{item.total_qty} pcs</td>
                                                <td className="px-6 py-3.5 text-right font-bold text-brand-teal print:text-black">{formatRupiah(item.total_revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ CONTENT VIEW 2: RIWAYAT TRANSAKSI ══ */}
                {(activeTab === 'transactions' && !window.matchMedia('print').matches) && (
                    <div className="bg-white border border-brand-navy/5 rounded-2xl shadow-sm overflow-hidden print:hidden">
                        <div className="px-5 py-4 border-b border-brand-navy/5 bg-brand-navy/5">
                            <h3 className="font-bold text-brand-navy">Daftar Transaksi</h3>
                        </div>
                        {transactions.length === 0 ? (
                            <div className="p-12 text-center text-brand-navy/40">
                                Belum ada riwayat transaksi pada rentang waktu ini.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-brand-navy/5 border-b border-brand-navy/10 text-brand-navy/50 font-semibold">
                                            <th className="px-6 py-3">No. Invoice</th>
                                            <th className="px-6 py-3">Tanggal / Waktu</th>
                                            <th className="px-6 py-3">Tipe Order</th>
                                            <th className="px-6 py-3">Metode Bayar</th>
                                            <th className="px-6 py-3 text-right">Diskon</th>
                                            <th className="px-6 py-3 text-right">Total Akhir</th>
                                            <th className="px-6 py-3 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-navy/5">
                                        {transactions.map((trx) => (
                                            <tr key={trx.id} className="hover:bg-brand-navy/5">
                                                <td className="px-6 py-3.5 font-bold text-brand-navy">{trx.invoice_number}</td>
                                                <td className="px-6 py-3.5 text-brand-navy/50">
                                                    {new Date(trx.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </td>
                                                <td className="px-6 py-3.5 capitalize text-brand-navy/80">{trx.order_type} {trx.table_number && `(Meja ${trx.table_number})`}</td>
                                                <td className="px-6 py-3.5">
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                                        trx.payment_method === 'cash' ? 'bg-brand-teal/10 text-brand-teal' : 'bg-brand-gold/10 text-brand-gold'
                                                    }`}>
                                                        {trx.payment_method.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-right font-medium text-brand-coral">
                                                    {trx.discount > 0 ? `-${formatRupiah(trx.discount)}` : '-'}
                                                </td>
                                                <td className="px-6 py-3.5 text-right font-bold text-brand-navy">{formatRupiah(trx.total_amount)}</td>
                                                <td className="px-6 py-3.5 text-center">
                                                    <button
                                                        onClick={() => printReceipt(trx)}
                                                        className="px-3 py-1.5 bg-brand-navy/10 text-brand-navy hover:bg-brand-navy/20 text-xs font-semibold rounded-lg transition"
                                                        title="Print Ulang Struk"
                                                    >
                                                        🖨️ Cetak
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
