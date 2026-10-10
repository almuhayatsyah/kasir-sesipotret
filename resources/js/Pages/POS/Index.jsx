import { Head } from "@inertiajs/react";
import { useState, useCallback } from "react";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

// ─── Helpers ──────────────────────────────────────────
const formatRupiah = (amount) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount ?? 0);

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} mnt lalu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} jam lalu`;
    return `${Math.floor(hrs / 24)} hari lalu`;
};

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

    // Pisahkan item: minuman vs makanan
    const minuman = (transaction.details || []).filter(
        (d) => d.product?.category === "minuman",
    );
    const makanan = (transaction.details || []).filter(
        (d) => d.product?.category !== "minuman",
    );

    // Format satu baris item
    const fmtItem = (d) => {
        const suhu = d.temperature
            ? ` [${d.temperature === "hot" ? "HOT" : "ICE"}]`
            : "";
        const nama = `${d.product?.name ?? ""}${suhu}`;
        // Baris nama
        const namaLine = nama.length > C - 2 ? nama.slice(0, C - 2) : nama;
        // Baris qty x harga = subtotal
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

        // ── MINUMAN ──
        minuman.length > 0 ? center("[ MINUMAN ]") : null,
        minuman.length > 0 ? divider2 : null,
        ...minuman.map(fmtItem),

        // ── MAKANAN ──
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
        "\n\n" // Beri jarak sedikit sebelum kertas dipotong
    ]
        .filter((l) => l !== null)
        .join("\n");

    // Jika perangkat Android, gunakan aplikasi RawBT
    if (/android/i.test(navigator.userAgent)) {
        try {
            // Encode teks menjadi base64 yang aman untuk UTF-8
            const base64data = btoa(unescape(encodeURIComponent(lines)));
            const intentUrl = "intent:" + base64data + "#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;";
            window.location.href = intentUrl;
        } catch (e) {
            console.error("Gagal format RawBT:", e);
            alert("Gagal mencetak struk. Pastikan aplikasi RawBT sudah terinstall.");
        }
    } else {
        // Fallback untuk testing di PC/Windows via dialog browser
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

// ─── Cart Item Component ───────────────────────────────
function CartItem({ item, onQtyChange, onRemove }) {
    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                    {item.name}
                    {item.temperature && (
                        <span
                            className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md align-middle ${
                                item.temperature === "hot"
                                    ? "bg-brand-coral/15 text-brand-coral"
                                    : "bg-brand-teal/15 text-brand-teal"
                            }`}
                        >
                            {item.temperature === "hot" ? "🔥 Hot" : "🧊 Ice"}
                        </span>
                    )}
                </p>
                <p className="text-xs text-gray-400">
                    {formatRupiah(item.price)} / pcs
                </p>
            </div>
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() =>
                        onQtyChange(item.cart_key, item.quantity - 1)
                    }
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
                >
                    −
                </button>
                <span className="w-8 text-center text-sm font-semibold">
                    {item.quantity}
                </span>
                <button
                    onClick={() =>
                        onQtyChange(item.cart_key, item.quantity + 1)
                    }
                    className="w-7 h-7 rounded-lg bg-brand-teal/15 hover:bg-brand-teal/25 flex items-center justify-center text-brand-teal transition"
                >
                    +
                </button>
            </div>
            <div className="text-right min-w-[80px]">
                <p className="text-sm font-semibold text-gray-800">
                    {formatRupiah(item.subtotal)}
                </p>
                <button
                    onClick={() => onRemove(item.cart_key)}
                    className="text-xs text-brand-coral hover:text-brand-coral/80 transition"
                >
                    hapus
                </button>
            </div>
        </div>
    );
}

// ─── Payment Modal (dipakai untuk bayar sekarang DAN pelunasan) ──
function PaymentModal({ total, onConfirm, onClose, processing, title, details }) {
    const [method, setMethod] = useState("cash");
    const [paid, setPaid] = useState("");
    const [discountMode, setDiscountMode] = useState("none"); // "none", "10", "30", "custom"
    const [customDiscountStr, setCustomDiscountStr] = useState("");

    let discountNominal = 0;
    if (discountMode === "10") discountNominal = total * 0.1;
    else if (discountMode === "30") discountNominal = total * 0.3;
    else if (discountMode === "custom") discountNominal = Number(customDiscountStr) || 0;

    const finalTotal = Math.max(0, total - discountNominal);
    const change = method === "cash" ? Math.max(0, Number(paid) - finalTotal) : 0;

    const quickAmounts = [finalTotal, 50000, 100000, 200000].filter(
        (v, i, a) => a.indexOf(v) === i && v >= finalTotal,
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="bg-gradient-to-br from-brand-teal to-brand-navy px-6 py-5 text-white">
                    <p className="text-sm opacity-80 font-medium">
                        {title || "Total Pembayaran"}
                    </p>
                    <div className="flex flex-col">
                        {discountNominal > 0 && (
                            <span className="text-sm line-through opacity-70">
                                {formatRupiah(total)}
                            </span>
                        )}
                        <span className="text-3xl font-serif font-bold tracking-tight">
                            {formatRupiah(finalTotal)}
                        </span>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {/* Diskon */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">
                            Diskon
                        </label>
                        <div className="flex gap-2">
                            {[
                                { id: "none", label: "0%" },
                                { id: "10", label: "10%" },
                                { id: "30", label: "30%" },
                                { id: "custom", label: "Kustom" },
                            ].map((d) => (
                                <button
                                    key={d.id}
                                    onClick={() => setDiscountMode(d.id)}
                                    className={`flex-1 py-2 rounded-xl font-medium text-xs transition border ${
                                        discountMode === d.id
                                            ? "bg-brand-gold/10 text-brand-gold border-brand-gold"
                                            : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100"
                                    }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                        {discountMode === "custom" && (
                            <input
                                type="number"
                                placeholder="Nominal Diskon (Rp)"
                                value={customDiscountStr}
                                onChange={(e) => setCustomDiscountStr(e.target.value)}
                                className="w-full py-2.5 px-4 mt-2 border-2 border-gray-200 rounded-xl text-sm focus:border-brand-gold outline-none transition"
                            />
                        )}
                    </div>
                    {/* Item Details (opsional untuk pelunasan) */}
                    {details && details.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs max-h-28 overflow-y-auto">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                Rincian Pesanan
                            </p>
                            {details.map((d, idx) => (
                                <div key={d.id || idx} className="flex justify-between text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <span>{d.quantity}x {d.product?.name || d.name}</span>
                                        {d.temperature && (
                                            <span
                                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                    d.temperature === "hot"
                                                        ? "bg-brand-coral/15 text-brand-coral"
                                                        : "bg-brand-teal/15 text-brand-teal"
                                                }`}
                                            >
                                                {d.temperature === "hot" ? "🔥 Hot" : "🧊 Ice"}
                                            </span>
                                        )}
                                    </span>
                                    <span className="font-medium">{formatRupiah(d.subtotal)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Payment method */}
                    <div className="flex gap-2">
                        {[
                            { id: "cash", label: "💵 Tunai" },
                            { id: "qris", label: "📱 QRIS" },
                        ].map(({ id, label }) => (
                            <button
                                key={id}
                                onClick={() => {
                                    setMethod(id);
                                    setPaid("");
                                }}
                                className={`flex-1 py-3 rounded-xl font-medium transition text-sm ${
                                    method === id
                                        ? "bg-brand-teal/15 text-brand-teal border-2 border-brand-teal/30"
                                        : "bg-gray-50 text-gray-600 border-2 border-transparent"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Cash input */}
                    {method === "cash" && (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                    Uang Diterima
                                </label>
                                <input
                                    type="number"
                                    value={paid}
                                    onChange={(e) => setPaid(e.target.value)}
                                    placeholder="Masukkan nominal..."
                                    className="w-full text-xl font-bold text-center py-3 border-2 border-brand-navy/10 rounded-xl focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/20 outline-none transition"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {quickAmounts.map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => setPaid(String(amount))}
                                        className="px-3 py-1.5 bg-gray-100 hover:bg-brand-teal/10 hover:text-brand-teal text-sm rounded-lg font-medium transition"
                                    >
                                        {formatRupiah(amount)}
                                    </button>
                                ))}
                            </div>
                            {Number(paid) >= finalTotal && (
                                <div className="bg-brand-teal/10 rounded-xl p-3 text-center border border-brand-teal/20">
                                    <p className="text-xs text-brand-teal font-medium">
                                        Kembalian
                                    </p>
                                    <p className="text-2xl font-bold text-brand-teal">
                                        {formatRupiah(change)}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {method === "qris" && (
                        <div className="bg-gray-50 rounded-xl p-6 text-center">
                            <p className="text-4xl mb-2">📱</p>
                            <p className="text-sm text-gray-500">
                                Scan QRIS untuk pembayaran
                            </p>
                            <p className="text-lg font-bold text-brand-navy mt-1">
                                {formatRupiah(finalTotal)}
                            </p>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() =>
                                onConfirm({
                                    method,
                                    paid:
                                        method === "qris"
                                            ? finalTotal
                                            : Number(paid),
                                    discount: discountNominal,
                                })
                            }
                            disabled={
                                processing ||
                                (method === "cash" && Number(paid) < finalTotal)
                            }
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-teal to-brand-navy hover:from-brand-teal/90 hover:to-brand-navy/90 text-white font-semibold transition shadow-lg shadow-brand-navy/20 disabled:opacity-40"
                        >
                            {processing ? "Memproses..." : "✓ Bayar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Pay Later Confirm Modal ──────────────────────────
function PayLaterModal({
    total,
    items,
    orderType,
    tableNumber,
    onConfirm,
    onClose,
    processing,
}) {
    const [customerName, setCustomerName] = useState("");

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="bg-gradient-to-br from-brand-gold to-brand-coral px-6 py-5 text-white">
                    <p className="text-sm opacity-80 font-medium">
                        ⏳ Bayar Nanti
                    </p>
                    <p className="text-3xl font-serif font-bold tracking-tight">
                        {formatRupiah(total)}
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-xl p-3 text-center">
                        <p className="text-xs text-brand-gold font-semibold">
                            Pesanan akan disimpan dan bisa dilunasi nanti
                        </p>
                    </div>

                    {/* Ringkasan */}
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm max-h-32 overflow-y-auto">
                        {items.map((item) => (
                            <div
                                key={item.cart_key || item.product_id}
                                className="flex justify-between text-gray-600 items-center"
                            >
                                <span className="flex items-center gap-1.5">
                                    <span>{item.quantity}x {item.name}</span>
                                    {item.temperature && (
                                        <span
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                item.temperature === "hot"
                                                    ? "bg-brand-coral/15 text-brand-coral"
                                                    : "bg-brand-teal/15 text-brand-teal"
                                            }`}
                                        >
                                            {item.temperature === "hot" ? "🔥 Hot" : "🧊 Ice"}
                                        </span>
                                    )}
                                </span>
                                <span className="font-medium">
                                    {formatRupiah(item.subtotal)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Customer name */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                            Nama Pelanggan (opsional)
                        </label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder={
                                tableNumber
                                    ? `Meja ${tableNumber}`
                                    : "Misal: Pak Budi"
                            }
                            className="w-full text-sm py-3 px-4 border-2 border-brand-navy/10 rounded-xl focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/20 outline-none transition"
                            autoFocus
                        />
                    </div>

                    {/* Info */}
                    <div className="text-xs text-gray-400 space-y-1">
                        <p>
                            • Tipe:{" "}
                            <span className="font-medium text-gray-600">
                                {orderType === "dine-in"
                                    ? "Dine-in"
                                    : "Takeaway"}
                            </span>
                        </p>
                        {tableNumber && (
                            <p>
                                • Meja:{" "}
                                <span className="font-medium text-gray-600">
                                    {tableNumber}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => onConfirm(customerName)}
                            disabled={processing}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-gold to-brand-coral hover:from-brand-gold/90 hover:to-brand-coral/90 text-white font-semibold transition shadow-lg shadow-brand-coral/20 disabled:opacity-40"
                        >
                            {processing ? "Menyimpan..." : "⏳ Simpan Pesanan"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Success Modal ────────────────────────────────────
function SuccessModal({ transaction, onNewTransaction, onPrint }) {
    const isPending = transaction.payment_status === "pending";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center overflow-hidden">
                <div
                    className={`px-6 py-8 text-white relative overflow-hidden ${
                        isPending
                            ? "bg-gradient-to-br from-brand-gold to-brand-coral"
                            : "bg-gradient-to-br from-brand-teal to-brand-navy"
                    }`}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="text-5xl mb-3 relative z-10">
                        {isPending ? "⏳" : "✅"}
                    </div>
                    <p className="text-2xl font-serif font-bold relative z-10">
                        {isPending
                            ? "Pesanan Tersimpan!"
                            : "Transaksi Berhasil!"}
                    </p>
                    <p className="text-sm opacity-80 mt-1 relative z-10">
                        {transaction.invoice_number}
                    </p>
                </div>
                <div className="p-6 space-y-3">
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Total</span>
                            <span className="font-semibold">
                                {formatRupiah(transaction.total_amount)}
                            </span>
                        </div>
                        {isPending ? (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">
                                        Status
                                    </span>
                                    <span className="font-bold text-brand-gold">
                                        Belum Dibayar
                                    </span>
                                </div>
                                {transaction.customer_name && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">
                                            Pelanggan
                                        </span>
                                        <span className="font-medium">
                                            {transaction.customer_name}
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">
                                        Dibayar
                                    </span>
                                    <span className="font-semibold">
                                        {formatRupiah(transaction.amount_paid)}
                                    </span>
                                </div>
                                {transaction.change > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">
                                            Kembalian
                                        </span>
                                        <span className="font-bold text-brand-teal text-lg">
                                            {formatRupiah(transaction.change)}
                                        </span>
                                    </div>
                                )}
                                {transaction.customer_name && (
                                    <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
                                        <span className="text-gray-500">
                                            👤 Pelanggan
                                        </span>
                                        <span className="font-semibold text-brand-navy">
                                            {transaction.customer_name}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <button
                        onClick={onPrint}
                        className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-medium transition"
                    >
                        🖨️ Cetak Struk
                    </button>
                    <button
                        onClick={onNewTransaction}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-teal to-brand-navy hover:from-brand-teal/90 hover:to-brand-navy/90 text-white font-semibold shadow-lg shadow-brand-navy/20 transition"
                    >
                        + Transaksi Baru
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Pending Orders Panel (Drawer) ────────────────────
function PendingOrdersPanel({ orders, onSettle, onCancel, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-50">
            <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-slide-in">
                {/* Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-brand-gold to-brand-coral text-white flex items-center justify-between shrink-0">
                    <div>
                        <p className="font-serif font-bold text-lg">
                            ⏳ Pesanan Belum Bayar
                        </p>
                        <p className="text-sm opacity-80">
                            {orders.length} pesanan menunggu
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Orders list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {orders.length === 0 ? (
                        <div className="text-center py-16 text-gray-300">
                            <p className="text-4xl mb-2">🎉</p>
                            <p className="text-sm">
                                Semua pesanan sudah dibayar!
                            </p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3"
                            >
                                {/* Order header */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-bold text-brand-navy text-sm">
                                            {order.invoice_number}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {timeAgo(order.created_at)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-brand-coral">
                                            {formatRupiah(order.total_amount)}
                                        </p>
                                        <p className="text-[10px] text-gray-400 capitalize">
                                            {order.order_type}
                                            {order.table_number
                                                ? ` · Meja ${order.table_number}`
                                                : ""}
                                        </p>
                                    </div>
                                </div>

                                {/* Customer name */}
                                {order.customer_name && (
                                    <div className="bg-white rounded-lg px-3 py-1.5 text-xs font-medium text-brand-navy border border-brand-navy/5">
                                        👤 {order.customer_name}
                                    </div>
                                )}

                                {/* Items list */}
                                <div className="space-y-1">
                                    {order.details?.map((d) => (
                                        <div
                                            key={d.id}
                                            className="flex justify-between text-xs text-gray-500 items-center"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <span>{d.quantity}x {d.product?.name}</span>
                                                {d.temperature && (
                                                    <span
                                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                            d.temperature === "hot"
                                                                ? "bg-brand-coral/15 text-brand-coral"
                                                                : "bg-brand-teal/15 text-brand-teal"
                                                        }`}
                                                    >
                                                        {d.temperature === "hot" ? "🔥 Hot" : "🧊 Ice"}
                                                    </span>
                                                )}
                                            </span>
                                            <span>
                                                {formatRupiah(d.subtotal)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => printReceipt(order)}
                                        className="py-2.5 px-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition flex items-center justify-center"
                                        title="Cetak Struk Pending"
                                    >
                                        🖨️
                                    </button>
                                    <button
                                        onClick={() => onCancel(order)}
                                        className="flex-1 py-2.5 rounded-xl border border-brand-coral/20 text-brand-coral hover:bg-brand-coral/5 text-xs font-semibold transition"
                                    >
                                        ✕ Batalkan
                                    </button>
                                    <button
                                        onClick={() => onSettle(order)}
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-teal to-brand-navy text-white text-xs font-semibold shadow-md shadow-brand-navy/20 hover:from-brand-teal/90 hover:to-brand-navy/90 transition"
                                    >
                                        💰 Bayar Sekarang
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Antrian Panel ────────────────────────────────────
function AntrianPanel({ antrian, onSelesai, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-50">
            <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
                {/* Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-brand-teal to-brand-navy text-white flex items-center justify-between shrink-0">
                    <div>
                        <p className="font-serif font-bold text-lg">🍽️ Antrian Pesanan</p>
                        <p className="text-sm opacity-80">
                            {antrian.length === 0
                                ? "Tidak ada antrian"
                                : `${antrian.length} pesanan sedang dikerjakan`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {antrian.length === 0 ? (
                        <div className="text-center py-16 text-gray-300">
                            <p className="text-5xl mb-3">✅</p>
                            <p className="text-sm">Semua pesanan sudah selesai!</p>
                        </div>
                    ) : (
                        antrian.map((order) => {
                            const minuman = order.details?.filter(
                                (d) => d.product?.category === "minuman",
                            ) ?? [];
                            const makanan = order.details?.filter(
                                (d) => d.product?.category !== "minuman",
                            ) ?? [];
                            return (
                                <div
                                    key={order.id}
                                    className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-3"
                                >
                                    {/* Order header */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-bold text-brand-navy text-sm">
                                                {order.invoice_number}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {timeAgo(order.created_at)}
                                                {order.table_number
                                                    ? ` · Meja ${order.table_number}`
                                                    : ""}
                                                {order.order_type === "takeaway"
                                                    ? " · 🛍️ Takeaway"
                                                    : ""}
                                            </p>
                                        </div>
                                        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-700">
                                            🟡 Antri
                                        </span>
                                    </div>

                                    {order.customer_name && (
                                        <div className="text-xs font-medium text-brand-navy bg-white rounded-lg px-3 py-1.5 border border-brand-navy/5">
                                            👤 {order.customer_name}
                                        </div>
                                    )}

                                    {/* Minuman */}
                                    {minuman.length > 0 && (
                                        <div className="bg-white rounded-xl p-3 space-y-1">
                                            <p className="text-[10px] font-bold text-brand-teal uppercase tracking-wider mb-1">☕ Minuman</p>
                                            {minuman.map((d) => (
                                                <div key={d.id} className="flex items-center gap-2 text-xs text-gray-700">
                                                    <span className="font-bold text-brand-navy w-5 text-center">{d.quantity}×</span>
                                                    <span className="flex-1">{d.product?.name}</span>
                                                    {d.temperature && (
                                                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                                            d.temperature === "hot"
                                                                ? "bg-brand-coral/15 text-brand-coral"
                                                                : "bg-brand-teal/15 text-brand-teal"
                                                        }`}>
                                                            {d.temperature === "hot" ? "🔥 Hot" : "🧊 Ice"}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Makanan */}
                                    {makanan.length > 0 && (
                                        <div className="bg-white rounded-xl p-3 space-y-1">
                                            <p className="text-[10px] font-bold text-brand-coral uppercase tracking-wider mb-1">🍽️ Makanan</p>
                                            {makanan.map((d) => (
                                                <div key={d.id} className="flex items-center gap-2 text-xs text-gray-700">
                                                    <span className="font-bold text-brand-navy w-5 text-center">{d.quantity}×</span>
                                                    <span className="flex-1">{d.product?.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => printReceipt(order)}
                                            className="w-12 flex-shrink-0 flex items-center justify-center py-2.5 rounded-xl border-2 border-amber-300 text-amber-700 bg-amber-100 hover:bg-amber-200 text-sm font-bold transition active:scale-95"
                                            title="Cetak Tiket Antrian / Struk"
                                        >
                                            🖨️
                                        </button>
                                        <button
                                            onClick={() => onSelesai(order)}
                                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-teal to-brand-navy text-white text-sm font-bold shadow-md hover:from-brand-teal/90 hover:to-brand-navy/90 transition active:scale-95"
                                        >
                                            ✅ Selesai — Sudah Diantar
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── MAIN POS PAGE ────────────────────────────────────
const CATEGORIES = [
    { id: "all",       label: "Semua",      icon: "📋" },
    // ── Minuman ──────────────────────────────────────
    { id: "coffee",    label: "Coffee",     icon: "☕" },
    { id: "non-coffee",label: "Non Coffee", icon: "🍵" },
    { id: "refreshing",label: "Refreshing", icon: "🍋" },
    { id: "healthy",   label: "Healthy",    icon: "🌿" },
    // ── Makanan ──────────────────────────────────────
    { id: "snack",     label: "Snack",      icon: "🍿" },
    { id: "makanan",   label: "Makanan",    icon: "🍽️" },
    { id: "aneka-mie", label: "Aneka Mie",  icon: "🍜" },
];

const CATEGORY_EMOJI = Object.fromEntries(
    CATEGORIES.filter((c) => c.id !== "all").map((c) => [c.id, c.icon]),
);
const CATEGORY_LABEL = Object.fromEntries(
    CATEGORIES.filter((c) => c.id !== "all").map((c) => [c.id, c.label]),
);

// Kunci kategori tampilan: pakai sub_category bila ada, fallback ke category
const categoryKey = (p) => p.sub_category ?? p.category;

export default function POSIndex({ products, pendingOrders: initialPending }) {
    const [cart, setCart] = useState([]);
    const [orderType, setOrderType] = useState("dine-in");
    const [tableNumber, setTableNumber] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [showPayment, setShowPayment] = useState(false);
    const [showPayLater, setShowPayLater] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showPending, setShowPending] = useState(false);
    const [showAntrian, setShowAntrian] = useState(false);
    const [lastTransaction, setLastTransaction] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [error, setError] = useState(null);
    const [pendingOrders, setPendingOrders] = useState(initialPending ?? []);
    const [antrian, setAntrian] = useState([]);

    // Settle modal state
    const [settleTarget, setSettleTarget] = useState(null);

    const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const filteredProducts = products.filter((p) => {
        const matchSearch = p.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchCategory =
            activeCategory === "all" || categoryKey(p) === activeCategory;
        return matchSearch && matchCategory;
    });

    // Refresh pending orders from server
    const refreshPending = async () => {
        try {
            const res = await axios.get(route("pos.pending"));
            setPendingOrders(res.data);
        } catch (e) {
            /* silent */
        }
    };

    // Refresh antrian dari server
    const refreshAntrian = async () => {
        try {
            const res = await axios.get(route("pos.antrian"));
            setAntrian(res.data);
        } catch (e) {
            /* silent */
        }
    };

    // Auto-refresh antrian setiap 15 detik
    useState(() => {
        refreshAntrian();
        const interval = setInterval(refreshAntrian, 15000);
        return () => clearInterval(interval);
    }, []);

    // Add to cart (temperature & price opsional untuk menu varian Hot/Ice)
    const addToCart = useCallback(
        (product, temperature = null, price = null) => {
            const unitPrice = price ?? product.price;
            const cartKey = `${product.id}-${temperature ?? "std"}`;
            setCart((prev) => {
                const existing = prev.find((i) => i.cart_key === cartKey);
                if (existing) {
                    return prev.map((i) =>
                        i.cart_key === cartKey
                            ? {
                                  ...i,
                                  quantity: i.quantity + 1,
                                  subtotal: (i.quantity + 1) * i.price,
                              }
                            : i,
                    );
                }
                return [
                    ...prev,
                    {
                        cart_key: cartKey,
                        product_id: product.id,
                        temperature,
                        name: product.name,
                        price: unitPrice,
                        quantity: 1,
                        subtotal: unitPrice,
                    },
                ];
            });
        },
        [],
    );

    // Change quantity
    const handleQtyChange = useCallback((cartKey, newQty) => {
        if (newQty <= 0) {
            setCart((prev) => prev.filter((i) => i.cart_key !== cartKey));
        } else {
            setCart((prev) =>
                prev.map((i) =>
                    i.cart_key === cartKey
                        ? { ...i, quantity: newQty, subtotal: newQty * i.price }
                        : i,
                ),
            );
        }
    }, []);

    // Remove item
    const handleRemove = useCallback((cartKey) => {
        setCart((prev) => prev.filter((i) => i.cart_key !== cartKey));
    }, []);

    // ─── Checkout: Bayar Sekarang ──────────────────────
    const handleConfirmPayment = async ({ method, paid, discount }) => {
        setProcessing(true);
        setError(null);
        try {
            const response = await axios.post(route("pos.checkout"), {
                order_type: orderType,
                table_number: tableNumber || null,
                customer_name: customerName || null,
                payment_method: method,
                amount_paid: paid,
                payment_status: "paid",
                discount: discount || 0,
                items: cart,
            });

            setLastTransaction(response.data.transaction);
            setShowPayment(false);
            setShowSuccess(true);
            refreshAntrian();
        } catch (err) {
            setError(
                err.response?.data?.message ??
                    "Terjadi kesalahan, silakan coba lagi.",
            );
        } finally {
            setProcessing(false);
        }
    };

    // ─── Checkout: Bayar Nanti ─────────────────────────
    const handleConfirmPayLater = async (customerName) => {
        setProcessing(true);
        setError(null);
        try {
            const response = await axios.post(route("pos.checkout"), {
                order_type: orderType,
                table_number: tableNumber || null,
                payment_status: "pending",
                customer_name: customerName || null,
                items: cart,
            });

            setLastTransaction(response.data.transaction);
            setShowPayLater(false);
            setShowSuccess(true);
            refreshPending();
            refreshAntrian();
        } catch (err) {
            setError(
                err.response?.data?.message ??
                    "Terjadi kesalahan, silakan coba lagi.",
            );
        } finally {
            setProcessing(false);
        }
    };

    // ─── Settle pending payment ────────────────────────
    const handleSettlePayment = async ({ method, paid, discount }) => {
        if (!settleTarget) return;
        setProcessing(true);
        try {
            const res = await axios.post(
                route("pos.pending.settle", settleTarget.id),
                {
                    payment_method: method,
                    amount_paid: paid,
                    discount: discount || 0,
                },
            );
            setSettleTarget(null);
            setLastTransaction(res.data.transaction);
            setShowSuccess(true);
            setShowPending(false);
            refreshPending();
            refreshAntrian();
        } catch (err) {
            alert(err.response?.data?.message ?? "Gagal melunasi");
        } finally {
            setProcessing(false);
        }
    };

    // ─── Cancel pending order ──────────────────────────
    const handleCancelPending = async (order) => {
        if (
            !confirm(
                `Batalkan pesanan ${order.invoice_number}? Stok bahan baku akan dikembalikan.`,
            )
        )
            return;
        try {
            await axios.delete(route("pos.pending.cancel", order.id));
            refreshPending();
        } catch (err) {
            alert(err.response?.data?.message ?? "Gagal membatalkan");
        }
    };

    const handleNewTransaction = () => {
        setCart([]);
        setOrderType("dine-in");
        setTableNumber("");
        setCustomerName("");
        setShowSuccess(false);
        setLastTransaction(null);
    };

    // ─── Selesaikan antrian ────────────────────────────
    const handleSelesaiAntrian = async (order) => {
        try {
            await axios.patch(route("pos.antrian.selesai", order.id));
            refreshAntrian();
        } catch (err) {
            alert("Gagal update status antrian");
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-serif font-semibold text-2xl text-brand-navy">
                    ☕ Kasir POS
                </h2>
            }
        >
            <Head title="POS Kasir — Kasir Sesi Potret" />

            <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
                {/* ══ LEFT: PRODUCT GRID ══ */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Order type + table + search */}
                    <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-3">
                        <div className="flex items-center gap-3">
                            {/* Order Type */}
                            <div className="flex rounded-xl overflow-hidden border border-gray-200">
                                {["dine-in", "takeaway"].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setOrderType(type)}
                                        className={`px-4 py-2 text-xs font-semibold transition ${
                                            orderType === type
                                                ? "bg-brand-teal text-white"
                                                : "bg-white text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        {type === "dine-in"
                                            ? "🍽️ Dine-in"
                                            : "🛍️ Takeaway"}
                                    </button>
                                ))}
                            </div>

                            {/* Table number (dine-in only) */}
                            {orderType === "dine-in" && (
                                <input
                                    type="text"
                                    value={tableNumber}
                                    onChange={(e) =>
                                        setTableNumber(e.target.value)
                                    }
                                    placeholder="No. Meja"
                                    className="w-24 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition"
                                />
                            )}

                            {/* Search */}
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Cari menu..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition"
                                />
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                        activeCategory === cat.id
                                            ? "bg-brand-navy text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    {cat.icon} {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {filteredProducts.map((product) => {
                                const qtyInCart = cart
                                    .filter((i) => i.product_id === product.id)
                                    .reduce((s, i) => s + i.quantity, 0);
                                const variants = product.variants ?? [];
                                const hasVariants = variants.length > 0;
                                // Satu varian saja (mis. ice cream) → klik kartu langsung masuk keranjang
                                const singleVariant =
                                    variants.length === 1 ? variants[0] : null;
                                const needsChoice = variants.length > 1;
                                const hot = variants.find(
                                    (v) => v.temperature === "hot",
                                );
                                const ice = variants.find(
                                    (v) => v.temperature === "ice",
                                );
                                const handleCardClick = () => {
                                    if (needsChoice) return;
                                    if (singleVariant) {
                                        addToCart(
                                            product,
                                            singleVariant.temperature,
                                            singleVariant.price,
                                        );
                                    } else {
                                        addToCart(product);
                                    }
                                };
                                return (
                                    <div
                                        key={product.id}
                                        onClick={handleCardClick}
                                        className={`relative bg-white rounded-2xl p-4 text-left border-2 transition hover:shadow-md ${
                                            needsChoice
                                                ? ""
                                                : "cursor-pointer active:scale-95"
                                        } ${
                                            qtyInCart > 0
                                                ? "border-brand-teal shadow-brand-teal/10 shadow-md"
                                                : "border-transparent hover:border-brand-teal/30"
                                        }`}
                                    >
                                        {qtyInCart > 0 && (
                                            <span className="absolute top-2 right-2 w-6 h-6 bg-brand-teal text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                {qtyInCart}
                                            </span>
                                        )}
                                        <div className="text-3xl mb-2">
                                            {CATEGORY_EMOJI[
                                                categoryKey(product)
                                            ] ?? "☕"}
                                        </div>
                                        <p className="text-sm font-semibold text-brand-navy leading-tight">
                                            {product.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {CATEGORY_LABEL[
                                                categoryKey(product)
                                            ] ?? categoryKey(product)}
                                        </p>
                                        {needsChoice ? (
                                            <div className="grid grid-cols-2 gap-1.5 mt-2">
                                                {[
                                                    {
                                                        v: hot,
                                                        label: "🔥 Hot",
                                                        cls: "bg-brand-coral/10 text-brand-coral hover:bg-brand-coral/20",
                                                    },
                                                    {
                                                        v: ice,
                                                        label: "🧊 Ice",
                                                        cls: "bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20",
                                                    },
                                                ].map(({ v, label, cls }) =>
                                                    v ? (
                                                        <button
                                                            key={v.temperature}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                addToCart(
                                                                    product,
                                                                    v.temperature,
                                                                    v.price,
                                                                );
                                                            }}
                                                            className={`rounded-lg px-1 py-2 text-center text-xs font-bold transition active:scale-95 ${cls}`}
                                                        >
                                                            {label}
                                                        </button>
                                                    ) : null,
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-brand-teal font-bold mt-1">
                                                {singleVariant && (
                                                    <span className="text-[10px] mr-1">
                                                        {singleVariant.temperature ===
                                                        "hot"
                                                            ? "🔥 Hot"
                                                            : "🧊 Ice"}
                                                    </span>
                                                )}
                                                {formatRupiah(
                                                    singleVariant?.price ??
                                                        product.price,
                                                )}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-16 text-gray-400">
                                <p className="text-4xl mb-2">🔍</p>
                                <p>Menu tidak ditemukan</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ══ RIGHT: CART ══ */}
                <div className="w-80 xl:w-96 bg-white border-l border-gray-200 flex flex-col shrink-0">
                    {/* Cart header */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-brand-navy">
                            Pesanan{" "}
                            {totalItems > 0 && (
                                <span className="text-brand-teal">
                                    ({totalItems})
                                </span>
                            )}
                        </h2>
                        <div className="flex items-center gap-2">
                            {/* Antrian badge button */}
                            <button
                                onClick={() => setShowAntrian(true)}
                                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                                    antrian.length > 0
                                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                        : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                                }`}
                            >
                                🍽️ Antrian
                                {antrian.length > 0 && (
                                    <span className="w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {antrian.length}
                                    </span>
                                )}
                            </button>
                            {/* Pending badge button */}
                            {pendingOrders.length > 0 && (
                                <button
                                    onClick={() => setShowPending(true)}
                                    className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 text-xs font-semibold transition border border-brand-gold/20"
                                >
                                    ⏳ {pendingOrders.length} Belum Bayar
                                </button>
                            )}
                            {cart.length > 0 && (
                                <button
                                    onClick={() => setCart([])}
                                    className="text-xs text-brand-coral hover:text-brand-coral/80 transition"
                                >
                                    Kosongkan
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Cart items */}
                    <div className="flex-1 overflow-y-auto px-5 py-2">
                        {cart.length === 0 ? (
                            <div className="text-center py-12 text-gray-300">
                                <p className="text-4xl mb-2">🛒</p>
                                <p className="text-sm">
                                    Pilih menu untuk memulai
                                </p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <CartItem
                                    key={item.cart_key}
                                    item={item}
                                    onQtyChange={handleQtyChange}
                                    onRemove={handleRemove}
                                />
                            ))
                        )}
                    </div>

                    {/* Cart footer */}
                    <div className="border-t border-gray-100 px-5 py-4 space-y-3 shrink-0">
                        {error && (
                            <p className="text-brand-coral text-xs bg-brand-coral/10 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}
                        {/* Nama Customer */}
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
                                👤
                            </span>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) =>
                                    setCustomerName(e.target.value)
                                }
                                placeholder="Nama customer (opsional)"
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition placeholder:text-gray-300"
                            />
                        </div>

                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal ({totalItems} item)</span>
                            <span className="font-semibold text-gray-800">
                                {formatRupiah(totalAmount)}
                            </span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                            <span className="text-brand-navy">Total</span>
                            <span className="text-brand-teal">
                                {formatRupiah(totalAmount)}
                            </span>
                        </div>

                        {/* Two checkout buttons */}
                        <button
                            onClick={() => setShowPayment(true)}
                            disabled={cart.length === 0}
                            className="w-full bg-gradient-to-r from-brand-teal to-brand-navy hover:from-brand-teal/90 hover:to-brand-navy/90 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-brand-navy/20 disabled:opacity-40 disabled:cursor-not-allowed text-lg"
                        >
                            Bayar Sekarang →
                        </button>
                        <button
                            onClick={() => setShowPayLater(true)}
                            disabled={cart.length === 0}
                            className="w-full border-2 border-brand-gold/30 text-brand-gold hover:bg-brand-gold/5 font-semibold py-3 rounded-2xl transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                        >
                            ⏳ Bayar Nanti
                        </button>
                    </div>
                </div>
            </div>

            {/* ── MODALS ── */}
            {showPayment && (
                <PaymentModal
                    total={totalAmount}
                    onConfirm={handleConfirmPayment}
                    onClose={() => setShowPayment(false)}
                    processing={processing}
                />
            )}

            {showPayLater && (
                <PayLaterModal
                    total={totalAmount}
                    items={cart}
                    orderType={orderType}
                    tableNumber={tableNumber}
                    onConfirm={handleConfirmPayLater}
                    onClose={() => setShowPayLater(false)}
                    processing={processing}
                />
            )}

            {showSuccess && lastTransaction && (
                <SuccessModal
                    transaction={lastTransaction}
                    onNewTransaction={handleNewTransaction}
                    onPrint={() => printReceipt(lastTransaction)}
                />
            )}

            {showPending && (
                <PendingOrdersPanel
                    orders={pendingOrders}
                    onSettle={(order) => {
                        setSettleTarget(order);
                        setShowPending(false);
                    }}
                    onCancel={handleCancelPending}
                    onClose={() => setShowPending(false)}
                />
            )}

            {showAntrian && (
                <AntrianPanel
                    antrian={antrian}
                    onSelesai={handleSelesaiAntrian}
                    onClose={() => setShowAntrian(false)}
                />
            )}
            {settleTarget && (
                <PaymentModal
                    total={settleTarget.total_amount}
                    title={`Lunasi: ${settleTarget.customer_name || settleTarget.invoice_number}`}
                    details={settleTarget.details}
                    onConfirm={handleSettlePayment}
                    onClose={() => setSettleTarget(null)}
                    processing={processing}
                />
            )}
        </AuthenticatedLayout>
    );
}
