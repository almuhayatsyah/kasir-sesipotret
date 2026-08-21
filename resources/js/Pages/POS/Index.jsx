import { Head, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import axios from 'axios';

// ─── Helpers ──────────────────────────────────────────
const formatRupiah = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount ?? 0);

// ─── Receipt Printer (ESC/POS via Window.print fallback) ─
const printReceipt = (transaction, shift) => {
    const lines = [
        '================================',
        '      KASIR SESI POTRET         ',
        '         Coffee Shop            ',
        '================================',
        `No: ${transaction.invoice_number}`,
        `Tipe: ${transaction.order_type === 'dine-in' ? 'Dine-in' : 'Takeaway'}`,
        transaction.table_number ? `Meja: ${transaction.table_number}` : '',
        `Kasir: ${shift?.user?.name ?? 'Kasir'}`,
        new Date().toLocaleString('id-ID'),
        '--------------------------------',
        ...transaction.details.map(
            (d) => `${d.product.name}\n  ${d.quantity}x ${formatRupiah(d.price)} = ${formatRupiah(d.subtotal)}`
        ),
        '--------------------------------',
        `TOTAL   : ${formatRupiah(transaction.total_amount)}`,
        `BAYAR   : ${formatRupiah(transaction.amount_paid)}`,
        `KEMBALIAN: ${formatRupiah(transaction.change)}`,
        '================================',
        `     ${transaction.payment_method.toUpperCase()}     `,
        '================================',
        '   Terima kasih, selamat minum! ',
    ].filter(Boolean).join('\n');

    const win = window.open('', '_blank', 'width=300,height=600');
    win.document.write(`<pre style="font-family:monospace;font-size:12px;white-space:pre-wrap">${lines}</pre>`);
    win.document.close();
    win.print();
    win.close();
};

// ─── Cart Item Component ───────────────────────────────
function CartItem({ item, onQtyChange, onRemove }) {
    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">{formatRupiah(item.price)} / pcs</p>
            </div>
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => onQtyChange(item.product_id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
                >−</button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                    onClick={() => onQtyChange(item.product_id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center text-indigo-600 transition"
                >+</button>
            </div>
            <div className="text-right min-w-[80px]">
                <p className="text-sm font-semibold text-gray-800">{formatRupiah(item.subtotal)}</p>
                <button onClick={() => onRemove(item.product_id)} className="text-xs text-rose-400 hover:text-rose-600 transition">hapus</button>
            </div>
        </div>
    );
}

// ─── Payment Modal ────────────────────────────────────
function PaymentModal({ total, onConfirm, onClose, processing }) {
    const [method, setMethod] = useState('cash');
    const [paid, setPaid] = useState('');
    const change = method === 'cash' ? Math.max(0, Number(paid) - total) : 0;

    const quickAmounts = [total, 50000, 100000, 200000].filter((v, i, a) => a.indexOf(v) === i);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="bg-indigo-600 px-6 py-5 text-white">
                    <p className="text-sm opacity-75">Total Pembayaran</p>
                    <p className="text-3xl font-bold mt-1">{formatRupiah(total)}</p>
                </div>

                <div className="p-6 space-y-4">
                    {/* Metode bayar */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</p>
                        <div className="grid grid-cols-2 gap-2">
                            {['cash', 'qris'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMethod(m)}
                                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition ${
                                        method === m
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    {m === 'cash' ? '💵 Tunai' : '📱 QRIS'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input uang (hanya untuk cash) */}
                    {method === 'cash' && (
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Uang yang Dibayar</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                                <input
                                    type="number"
                                    value={paid}
                                    onChange={(e) => setPaid(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-lg font-semibold"
                                    placeholder="0"
                                />
                            </div>
                            {/* Quick amounts */}
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {quickAmounts.map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => setPaid(String(amt))}
                                        className="text-xs bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg transition"
                                    >
                                        {formatRupiah(amt)}
                                    </button>
                                ))}
                            </div>

                            {Number(paid) >= total && (
                                <div className="bg-emerald-50 rounded-xl p-3 flex justify-between mt-3">
                                    <span className="text-sm text-emerald-700">Kembalian</span>
                                    <span className="text-lg font-bold text-emerald-600">{formatRupiah(change)}</span>
                                </div>
                            )}
                            {Number(paid) > 0 && Number(paid) < total && (
                                <p className="text-rose-500 text-xs mt-2">⚠️ Uang kurang {formatRupiah(total - Number(paid))}</p>
                            )}
                        </div>
                    )}

                    {/* QRIS info */}
                    {method === 'qris' && (
                        <div className="bg-violet-50 rounded-xl p-4 text-center">
                            <p className="text-violet-700 text-sm font-medium">📱 Tampilkan QR Code kepada pelanggan</p>
                            <p className="text-violet-500 text-xs mt-1">Konfirmasi setelah pembayaran berhasil</p>
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
                            onClick={() => onConfirm({ method, paid: method === 'qris' ? total : Number(paid) })}
                            disabled={processing || (method === 'cash' && Number(paid) < total)}
                            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-40"
                        >
                            {processing ? 'Memproses...' : '✓ Bayar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Success Modal ────────────────────────────────────
function SuccessModal({ transaction, shift, onNewTransaction, onPrint }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center overflow-hidden">
                <div className="bg-emerald-500 px-6 py-8 text-white">
                    <div className="text-5xl mb-3">✅</div>
                    <p className="text-xl font-bold">Transaksi Berhasil!</p>
                    <p className="text-sm opacity-75 mt-1">{transaction.invoice_number}</p>
                </div>
                <div className="p-6 space-y-3">
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Total</span>
                            <span className="font-semibold">{formatRupiah(transaction.total_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Dibayar</span>
                            <span className="font-semibold">{formatRupiah(transaction.amount_paid)}</span>
                        </div>
                        {transaction.change > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Kembalian</span>
                                <span className="font-bold text-emerald-600 text-lg">{formatRupiah(transaction.change)}</span>
                            </div>
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
                        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
                    >
                        + Transaksi Baru
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── MAIN POS PAGE ────────────────────────────────────
export default function POSIndex({ shift, products }) {
    const [cart, setCart]               = useState([]);
    const [orderType, setOrderType]     = useState('dine-in');
    const [tableNumber, setTableNumber] = useState('');
    const [showPayment, setShowPayment] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastTransaction, setLastTransaction] = useState(null);
    const [processing, setProcessing]   = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError]             = useState(null);

    const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalItems  = cart.reduce((sum, item) => sum + item.quantity, 0);

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Add to cart
    const addToCart = useCallback((product) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.product_id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.product_id === product.id
                        ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
                        : i
                );
            }
            return [...prev, {
                product_id: product.id,
                name:       product.name,
                price:      product.price,
                quantity:   1,
                subtotal:   product.price,
            }];
        });
    }, []);

    // Change quantity
    const handleQtyChange = useCallback((productId, newQty) => {
        if (newQty <= 0) {
            setCart((prev) => prev.filter((i) => i.product_id !== productId));
        } else {
            setCart((prev) =>
                prev.map((i) =>
                    i.product_id === productId
                        ? { ...i, quantity: newQty, subtotal: newQty * i.price }
                        : i
                )
            );
        }
    }, []);

    // Remove item
    const handleRemove = useCallback((productId) => {
        setCart((prev) => prev.filter((i) => i.product_id !== productId));
    }, []);

    // Checkout
    const handleConfirmPayment = async ({ method, paid }) => {
        setProcessing(true);
        setError(null);
        try {
            const response = await axios.post(route('pos.checkout'), {
                order_type:     orderType,
                table_number:   tableNumber || null,
                payment_method: method,
                amount_paid:    paid,
                items:          cart,
            });

            setLastTransaction(response.data.transaction);
            setShowPayment(false);
            setShowSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message ?? 'Terjadi kesalahan, silakan coba lagi.');
        } finally {
            setProcessing(false);
        }
    };

    const handleNewTransaction = () => {
        setCart([]);
        setOrderType('dine-in');
        setTableNumber('');
        setShowSuccess(false);
        setLastTransaction(null);
    };

    return (
        <>
            <Head title="POS Kasir — Kasir Sesi Potret" />

            <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

                {/* ── TOP BAR ── */}
                <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-indigo-700">☕ Kasir Sesi Potret</span>
                        <span className="hidden sm:inline text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            Shift #{shift.id} • 🟢 Aktif
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={route('shift.index')}
                            className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg transition"
                        >
                            Tutup Shift
                        </a>
                    </div>
                </header>

                {/* ── MAIN CONTENT ── */}
                <div className="flex-1 flex overflow-hidden">

                    {/* ══ LEFT: PRODUCT GRID ══ */}
                    <div className="flex-1 flex flex-col overflow-hidden">

                        {/* Order type + table + search */}
                        <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-3">
                            <div className="flex items-center gap-3">
                                {/* Order Type */}
                                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                                    {['dine-in', 'takeaway'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setOrderType(type)}
                                            className={`px-4 py-2 text-sm font-medium transition ${
                                                orderType === type
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {type === 'dine-in' ? '🪑 Dine-in' : '🛍️ Takeaway'}
                                        </button>
                                    ))}
                                </div>

                                {/* Table number (dine-in only) */}
                                {orderType === 'dine-in' && (
                                    <input
                                        type="text"
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                        placeholder="No. Meja (opsional)"
                                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 w-40"
                                    />
                                )}

                                {/* Search */}
                                <div className="relative flex-1 max-w-xs ml-auto">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari menu..."
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Product grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {filteredProducts.map((product) => {
                                    const inCart = cart.find((i) => i.product_id === product.id);
                                    return (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className={`relative bg-white rounded-2xl p-4 text-left border-2 transition hover:shadow-md active:scale-95 ${
                                                inCart
                                                    ? 'border-indigo-400 shadow-indigo-100 shadow-md'
                                                    : 'border-gray-100 hover:border-indigo-200'
                                            }`}
                                        >
                                            {inCart && (
                                                <span className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                    {inCart.quantity}
                                                </span>
                                            )}
                                            <div className="text-3xl mb-2">☕</div>
                                            <p className="text-sm font-semibold text-gray-800 leading-tight">{product.name}</p>
                                            <p className="text-sm text-indigo-600 font-bold mt-1">{formatRupiah(product.price)}</p>
                                        </button>
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
                            <h2 className="font-bold text-gray-800">
                                Pesanan {totalItems > 0 && <span className="text-indigo-600">({totalItems})</span>}
                            </h2>
                            {cart.length > 0 && (
                                <button
                                    onClick={() => setCart([])}
                                    className="text-xs text-rose-400 hover:text-rose-600 transition"
                                >
                                    Kosongkan
                                </button>
                            )}
                        </div>

                        {/* Cart items */}
                        <div className="flex-1 overflow-y-auto px-5 py-2">
                            {cart.length === 0 ? (
                                <div className="text-center py-12 text-gray-300">
                                    <p className="text-4xl mb-2">🛒</p>
                                    <p className="text-sm">Pilih menu untuk memulai</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <CartItem
                                        key={item.product_id}
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
                                <p className="text-rose-500 text-xs bg-rose-50 rounded-lg px-3 py-2">{error}</p>
                            )}
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal ({totalItems} item)</span>
                                <span className="font-semibold text-gray-800">{formatRupiah(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span className="text-indigo-700">{formatRupiah(totalAmount)}</span>
                            </div>
                            <button
                                onClick={() => setShowPayment(true)}
                                disabled={cart.length === 0}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition disabled:opacity-40 disabled:cursor-not-allowed text-lg"
                            >
                                Bayar Sekarang →
                            </button>
                        </div>
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

            {showSuccess && lastTransaction && (
                <SuccessModal
                    transaction={lastTransaction}
                    shift={shift}
                    onNewTransaction={handleNewTransaction}
                    onPrint={() => printReceipt(lastTransaction, shift)}
                />
            )}
        </>
    );
}
