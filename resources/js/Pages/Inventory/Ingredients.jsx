import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const formatRupiah = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount ?? 0);

// ── Modal Tambah/Edit Bahan Baku ──────────────────────
function IngredientModal({ ingredient, onClose }) {
    const isEdit = !!ingredient;
    const form = useForm({
        name:            ingredient?.name            ?? '',
        unit:            ingredient?.unit            ?? '',
        stock:           ingredient?.stock           ?? 0,
        min_alert_stock: ingredient?.min_alert_stock ?? 10,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            form.put(route('inventory.ingredients.update', ingredient.id), {
                onSuccess: onClose,
                preserveScroll: true,
            });
        } else {
            form.post(route('inventory.ingredients.store'), {
                onSuccess: onClose,
                preserveScroll: true,
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">{isEdit ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Field label="Nama Bahan" error={form.errors.name}>
                        <input
                            type="text"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                            placeholder="cth: Espresso Shot"
                            required
                        />
                    </Field>
                    <Field label="Satuan" error={form.errors.unit}>
                        <input
                            type="text"
                            value={form.data.unit}
                            onChange={(e) => form.setData('unit', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                            placeholder="cth: gram, ml, pcs, shot"
                            required
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Stok Saat Ini" error={form.errors.stock}>
                            <input
                                type="number" min="0"
                                value={form.data.stock}
                                onChange={(e) => form.setData('stock', Number(e.target.value))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                                required
                            />
                        </Field>
                        <Field label="Stok Minimum Alert" error={form.errors.min_alert_stock}>
                            <input
                                type="number" min="0"
                                value={form.data.min_alert_stock}
                                onChange={(e) => form.setData('min_alert_stock', Number(e.target.value))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                                required
                            />
                        </Field>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm transition">Batal</button>
                        <button type="submit" disabled={form.processing} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                            {form.processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal Top-Up Stok ─────────────────────────────────
function TopUpModal({ ingredient, onClose }) {
    const form = useForm({ amount: '' });
    const handleSubmit = (e) => {
        e.preventDefault();
        form.post(route('inventory.ingredients.topup', ingredient.id), {
            onSuccess: onClose,
            preserveScroll: true,
        });
    };
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Top-Up Stok — {ingredient.name}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-gray-500">Stok saat ini: <strong>{ingredient.stock} {ingredient.unit}</strong></p>
                    <Field label={`Tambahkan (${ingredient.unit})`} error={form.errors.amount}>
                        <input
                            type="number" min="1"
                            value={form.data.amount}
                            onChange={(e) => form.setData('amount', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                            placeholder="cth: 500"
                            required
                        />
                    </Field>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm transition">Batal</button>
                        <button type="submit" disabled={form.processing} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                            {form.processing ? 'Menyimpan...' : '+ Top-Up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, children, error }) {
    return (
        <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>
            {children}
            {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

// ── MAIN PAGE ─────────────────────────────────────────
export default function Ingredients({ ingredients, flash }) {
    const [showModal, setShowModal]       = useState(false);
    const [editTarget, setEditTarget]     = useState(null);
    const [topUpTarget, setTopUpTarget]   = useState(null);

    const handleDelete = (ingredient) => {
        if (!confirm(`Hapus bahan baku "${ingredient.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
        router.delete(route('inventory.ingredients.destroy', ingredient.id), { preserveScroll: true });
    };

    const lowStockCount = ingredients.filter((i) => i.stock <= i.min_alert_stock).length;

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-xl text-gray-800">Inventori — Bahan Baku</h2>
                <div className="flex items-center gap-3">
                    <Link href={route('inventory.products')} className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg transition">
                        🍵 Menu Produk
                    </Link>
                    <button
                        onClick={() => { setEditTarget(null); setShowModal(true); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-xl font-semibold transition"
                    >
                        + Tambah Bahan
                    </button>
                </div>
            </div>
        }>
            <Head title="Inventori Bahan Baku — Kasir Sesi Potret" />

            <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">

                {/* Flash */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
                        ✅ {flash.success}
                    </div>
                )}

                {/* Low stock warning */}
                {lowStockCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                        ⚠️ <strong>{lowStockCount} bahan baku</strong> hampir habis! Segera lakukan restok.
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <p className="text-xs text-gray-400">Total Bahan</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{ingredients.length}</p>
                    </div>
                    <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
                        <p className="text-xs text-amber-600">Hampir Habis</p>
                        <p className="text-2xl font-bold text-amber-700 mt-1">{lowStockCount}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
                        <p className="text-xs text-emerald-600">Stok Aman</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">{ingredients.length - lowStockCount}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3 text-left">Nama Bahan</th>
                                <th className="px-6 py-3 text-left">Satuan</th>
                                <th className="px-6 py-3 text-right">Stok</th>
                                <th className="px-6 py-3 text-right">Min. Alert</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {ingredients.map((ing) => {
                                const isLow = ing.stock <= ing.min_alert_stock;
                                const pct   = Math.min(100, Math.round((ing.stock / (ing.min_alert_stock * 3 || 1)) * 100));
                                return (
                                    <tr key={ing.id} className={`hover:bg-gray-50 transition ${isLow ? 'bg-amber-50/30' : ''}`}>
                                        <td className="px-6 py-4 font-medium text-gray-800">
                                            {ing.name}
                                            {isLow && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">⚠️ Rendah</span>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{ing.unit}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`font-semibold ${isLow ? 'text-amber-600' : 'text-gray-800'}`}>
                                                    {ing.stock}
                                                </span>
                                                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${isLow ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500">{ing.min_alert_stock}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                isLow ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {isLow ? '⚠️ Restok' : '✅ Aman'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setTopUpTarget(ing)}
                                                    className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition font-medium"
                                                >
                                                    + Stok
                                                </button>
                                                <button
                                                    onClick={() => { setEditTarget(ing); setShowModal(true); }}
                                                    className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ing)}
                                                    className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition font-medium"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {ingredients.length === 0 && (
                        <div className="py-16 text-center text-gray-400">
                            <p className="text-4xl mb-2">📦</p>
                            <p>Belum ada bahan baku. Tambahkan sekarang!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showModal && (
                <IngredientModal
                    ingredient={editTarget}
                    onClose={() => { setShowModal(false); setEditTarget(null); }}
                />
            )}
            {topUpTarget && (
                <TopUpModal
                    ingredient={topUpTarget}
                    onClose={() => setTopUpTarget(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
