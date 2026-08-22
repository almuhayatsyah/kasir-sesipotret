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
                <div className="px-6 py-4 border-b border-brand-navy/5 flex items-center justify-between">
                    <h3 className="font-semibold text-brand-navy">{isEdit ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}</h3>
                    <button onClick={onClose} className="text-brand-navy/40 hover:text-brand-navy/60 text-xl">×</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Field label="Nama Bahan" error={form.errors.name}>
                        <input
                            type="text"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            className="w-full border border-brand-navy/10 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal text-sm transition"
                            placeholder="cth: Espresso Shot"
                            required
                        />
                    </Field>
                    <Field label="Satuan" error={form.errors.unit}>
                        <input
                            type="text"
                            value={form.data.unit}
                            onChange={(e) => form.setData('unit', e.target.value)}
                            className="w-full border border-brand-navy/10 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal text-sm transition"
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
                                className="w-full border border-brand-navy/10 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal text-sm transition"
                                required
                            />
                        </Field>
                        <Field label="Stok Minimum Alert" error={form.errors.min_alert_stock}>
                            <input
                                type="number" min="0"
                                value={form.data.min_alert_stock}
                                onChange={(e) => form.setData('min_alert_stock', Number(e.target.value))}
                                className="w-full border border-brand-navy/10 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal text-sm transition"
                                required
                            />
                        </Field>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-brand-navy/10 rounded-xl text-brand-navy/60 hover:bg-brand-navy/5 text-sm transition">Batal</button>
                        <button type="submit" disabled={form.processing} className="flex-1 py-2.5 bg-gradient-to-r from-brand-teal to-brand-navy hover:from-brand-teal/90 hover:to-brand-navy/90 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
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
                <div className="px-6 py-4 border-b border-brand-navy/5 flex items-center justify-between">
                    <h3 className="font-semibold text-brand-navy">Top-Up Stok — {ingredient.name}</h3>
                    <button onClick={onClose} className="text-brand-navy/40 hover:text-brand-navy/60 text-xl">×</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-brand-navy/60">Stok saat ini: <strong>{ingredient.stock} {ingredient.unit}</strong></p>
                    <Field label={`Tambahkan (${ingredient.unit})`} error={form.errors.amount}>
                        <input
                            type="number" min="1"
                            value={form.data.amount}
                            onChange={(e) => form.setData('amount', e.target.value)}
                            className="w-full border border-brand-navy/10 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal text-sm transition"
                            placeholder="cth: 500"
                            required
                        />
                    </Field>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-brand-navy/10 rounded-xl text-brand-navy/60 hover:bg-brand-navy/5 text-sm transition">Batal</button>
                        <button type="submit" disabled={form.processing} className="flex-1 py-2.5 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-brand-teal/20 disabled:opacity-50">
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
            <label className="text-sm font-medium text-brand-navy mb-1.5 block">{label}</label>
            {children}
            {error && <p className="text-brand-coral text-xs mt-1">{error}</p>}
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
                <h2 className="font-serif font-semibold text-2xl text-brand-navy">Inventori — Bahan Baku</h2>
                <div className="flex items-center gap-3">
                    <Link href={route('inventory.products')} className="text-sm text-brand-navy/60 hover:text-brand-navy border border-brand-navy/10 px-3 py-1.5 rounded-lg transition hover:bg-white">
                        🍵 Menu Produk
                    </Link>
                    <button
                        onClick={() => { setEditTarget(null); setShowModal(true); }}
                        className="bg-brand-teal hover:bg-brand-teal/90 text-white text-sm px-4 py-2 rounded-xl font-semibold transition shadow-lg shadow-brand-teal/20"
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
                    <div className="bg-brand-gold/10 border border-brand-gold/20 text-brand-gold px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                        ⚠️ <strong>{lowStockCount} bahan baku</strong> hampir habis! Segera lakukan restok.
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-brand-navy/5 shadow-sm p-5">
                        <p className="text-xs text-brand-navy/50">Total Bahan</p>
                        <p className="text-2xl font-bold text-brand-navy mt-1">{ingredients.length}</p>
                    </div>
                    <div className="bg-brand-gold/10 rounded-2xl border border-brand-gold/20 p-5 shadow-sm">
                        <p className="text-xs text-brand-gold">Hampir Habis</p>
                        <p className="text-2xl font-bold text-brand-gold mt-1">{lowStockCount}</p>
                    </div>
                    <div className="bg-brand-teal/10 rounded-2xl border border-brand-teal/20 p-5 shadow-sm">
                        <p className="text-xs text-brand-teal">Stok Aman</p>
                        <p className="text-2xl font-bold text-brand-teal mt-1">{ingredients.length - lowStockCount}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-brand-navy/5 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-brand-navy/5 text-brand-navy/50 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3 text-left">Nama Bahan</th>
                                <th className="px-6 py-3 text-left">Satuan</th>
                                <th className="px-6 py-3 text-right">Stok</th>
                                <th className="px-6 py-3 text-right">Min. Alert</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-navy/5">
                            {ingredients.map((ing) => {
                                const isLow = ing.stock <= ing.min_alert_stock;
                                const pct   = Math.min(100, Math.round((ing.stock / (ing.min_alert_stock * 3 || 1)) * 100));
                                return (
                                    <tr key={ing.id} className={`hover:bg-brand-navy/5 transition ${isLow ? 'bg-brand-gold/10' : ''}`}>
                                        <td className="px-6 py-4 font-medium text-brand-navy">
                                            {ing.name}
                                            {isLow && <span className="ml-2 text-xs bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded-full">⚠️ Rendah</span>}
                                        </td>
                                        <td className="px-6 py-4 text-brand-navy/50">{ing.unit}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`font-semibold ${isLow ? 'text-brand-gold' : 'text-brand-navy'}`}>
                                                    {ing.stock}
                                                </span>
                                                <div className="w-20 h-1.5 bg-brand-navy/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${isLow ? 'bg-brand-gold' : 'bg-brand-teal'}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-brand-navy/50">{ing.min_alert_stock}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                isLow ? 'bg-brand-gold/10 text-brand-gold' : 'bg-brand-teal/10 text-brand-teal'
                                            }`}>
                                                {isLow ? '⚠️ Restok' : '✅ Aman'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setTopUpTarget(ing)}
                                                    className="text-xs bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 px-3 py-1.5 rounded-lg transition font-medium"
                                                >
                                                    + Stok
                                                </button>
                                                <button
                                                    onClick={() => { setEditTarget(ing); setShowModal(true); }}
                                                    className="text-xs bg-brand-navy/10 text-brand-navy hover:bg-brand-navy/20 px-3 py-1.5 rounded-lg transition font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ing)}
                                                    className="text-xs bg-brand-coral/10 text-brand-coral hover:bg-brand-coral/20 px-3 py-1.5 rounded-lg transition font-medium"
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
                        <div className="py-16 text-center text-brand-navy/40">
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
