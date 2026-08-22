import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const formatRupiah = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount ?? 0);

// ── Recipe Row dalam Form ─────────────────────────────
function RecipeRow({ recipe, index, ingredients, onChange, onRemove }) {
    return (
        <div className="flex items-center gap-2 py-2">
            <select
                value={recipe.ingredient_id}
                onChange={(e) => onChange(index, 'ingredient_id', Number(e.target.value))}
                className="flex-1 border border-brand-navy/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition"
                required
            >
                <option value="">— Pilih Bahan —</option>
                {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                ))}
            </select>
            <input
                type="number" min="1"
                value={recipe.quantity_needed}
                onChange={(e) => onChange(index, 'quantity_needed', Number(e.target.value))}
                className="w-24 border border-brand-navy/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition"
                placeholder="Qty"
                required
            />
            <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-brand-coral/60 hover:text-brand-coral text-lg px-1 transition"
            >×</button>
        </div>
    );
}

// ── Modal Tambah/Edit Produk ──────────────────────────
function ProductModal({ product, ingredients, onClose }) {
    const isEdit = !!product;

    const defaultRecipes = product?.recipes?.map((r) => ({
        ingredient_id:   r.ingredient_id,
        quantity_needed: r.quantity_needed,
    })) ?? [];

    const form = useForm({
        name:      product?.name      ?? '',
        category:  product?.category  ?? 'coffee',
        price:     product?.price     ?? '',
        is_active: product?.is_active ?? true,
        recipes:   defaultRecipes,
    });

    const addRecipeRow = () => {
        form.setData('recipes', [...form.data.recipes, { ingredient_id: '', quantity_needed: 1 }]);
    };

    const updateRecipeRow = (index, field, value) => {
        const updated = form.data.recipes.map((r, i) => i === index ? { ...r, [field]: value } : r);
        form.setData('recipes', updated);
    };

    const removeRecipeRow = (index) => {
        form.setData('recipes', form.data.recipes.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            form.put(route('inventory.products.update', product.id), {
                onSuccess: onClose,
                preserveScroll: true,
            });
        } else {
            form.post(route('inventory.products.store'), {
                onSuccess: onClose,
                preserveScroll: true,
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-brand-navy/5 flex items-center justify-between shrink-0">
                    <h3 className="font-semibold text-brand-navy">{isEdit ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
                    <button onClick={onClose} className="text-brand-navy/40 hover:text-brand-navy/60 text-xl">×</button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Nama, Kategori & Harga */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-sm font-medium text-brand-navy mb-1.5 block">Nama Menu</label>
                            <input
                                type="text"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                className="w-full border border-brand-navy/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition"
                                placeholder="cth: Cappuccino"
                                required
                            />
                            {form.errors.name && <p className="text-brand-coral text-xs mt-1">{form.errors.name}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-brand-navy mb-1.5 block">Kategori</label>
                            <select
                                value={form.data.category}
                                onChange={(e) => form.setData('category', e.target.value)}
                                className="w-full border border-brand-navy/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition"
                            >
                                <option value="coffee">☕ Coffee</option>
                                <option value="non-coffee">🍵 Non-Coffee</option>
                                <option value="makanan">🍽️ Makanan</option>
                            </select>
                            {form.errors.category && <p className="text-brand-coral text-xs mt-1">{form.errors.category}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-brand-navy mb-1.5 block">Harga (Rp)</label>
                            <input
                                type="number" min="0"
                                value={form.data.price}
                                onChange={(e) => form.setData('price', Number(e.target.value))}
                                className="w-full border border-brand-navy/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition"
                                placeholder="22000"
                                required
                            />
                            {form.errors.price && <p className="text-brand-coral text-xs mt-1">{form.errors.price}</p>}
                        </div>
                    </div>

                    {/* Status */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div
                            onClick={() => form.setData('is_active', !form.data.is_active)}
                            className={`relative w-11 h-6 rounded-full transition ${form.data.is_active ? 'bg-brand-teal' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.data.is_active ? 'translate-x-5' : ''}`} />
                        </div>
                        <span className="text-sm text-brand-navy">
                            Menu {form.data.is_active ? 'Aktif (tersedia di POS)' : 'Nonaktif (disembunyikan dari POS)'}
                        </span>
                    </label>

                    {/* Recipes / BOM */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-brand-navy">Resep (Bahan Baku yang Digunakan)</label>
                            <button
                                type="button"
                                onClick={addRecipeRow}
                                className="text-xs bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 px-3 py-1.5 rounded-lg transition font-medium"
                            >
                                + Tambah Bahan
                            </button>
                        </div>

                        {form.data.recipes.length === 0 ? (
                            <div className="border-2 border-dashed border-brand-navy/10 rounded-xl py-6 text-center text-brand-navy/40 text-sm">
                                Belum ada resep. Klik "+ Tambah Bahan" untuk mendefinisikan BOM.
                            </div>
                        ) : (
                            <div className="border border-brand-navy/5 rounded-xl divide-y divide-brand-navy/5 px-3">
                                {form.data.recipes.map((recipe, i) => (
                                    <RecipeRow
                                        key={i}
                                        recipe={recipe}
                                        index={i}
                                        ingredients={ingredients}
                                        onChange={updateRecipeRow}
                                        onRemove={removeRecipeRow}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                <div className="px-6 py-4 border-t border-brand-navy/5 flex gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-brand-navy/10 rounded-xl text-brand-navy/60 hover:bg-brand-navy/5 text-sm transition">Batal</button>
                    <button
                        onClick={handleSubmit}
                        disabled={form.processing}
                        className="flex-1 py-2.5 bg-gradient-to-r from-brand-teal to-brand-navy hover:from-brand-teal/90 hover:to-brand-navy/90 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-navy/20 transition disabled:opacity-50"
                    >
                        {form.processing ? 'Menyimpan...' : 'Simpan Menu'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── MAIN PAGE ─────────────────────────────────────────
export default function Products({ products, ingredients, flash }) {
    const [showModal, setShowModal]   = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    const handleDelete = (product) => {
        if (!confirm(`Hapus menu "${product.name}"? Resepnya juga akan dihapus.`)) return;
        router.delete(route('inventory.products.destroy', product.id), { preserveScroll: true });
    };

    const handleToggle = (product) => {
        router.patch(route('inventory.products.toggle', product.id), {}, { preserveScroll: true });
    };

    const activeCount = products.filter((p) => p.is_active).length;

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <h2 className="font-serif font-semibold text-2xl text-brand-navy">Inventori — Menu Produk</h2>
                <div className="flex items-center gap-3">
                    <Link href={route('inventory.ingredients')} className="text-sm text-brand-navy/60 hover:text-brand-navy border border-brand-navy/10 px-3 py-1.5 rounded-lg transition hover:bg-white">
                        📦 Bahan Baku
                    </Link>
                    <button
                        onClick={() => { setEditTarget(null); setShowModal(true); }}
                        className="bg-brand-teal hover:bg-brand-teal/90 text-white text-sm px-4 py-2 rounded-xl font-semibold shadow-lg shadow-brand-teal/20 transition"
                    >
                        + Tambah Menu
                    </button>
                </div>
            </div>
        }>
            <Head title="Inventori Menu — Kasir Sesi Potret" />

            <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">

                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
                        ✅ {flash.success}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-brand-navy/5 p-5 shadow-sm">
                        <p className="text-xs text-brand-navy/50">Total Menu</p>
                        <p className="text-2xl font-bold text-brand-navy mt-1">{products.length}</p>
                    </div>
                    <div className="bg-brand-teal/10 rounded-2xl border border-brand-teal/20 p-5 shadow-sm">
                        <p className="text-xs text-brand-teal">Menu Aktif</p>
                        <p className="text-2xl font-bold text-brand-teal mt-1">{activeCount}</p>
                    </div>
                    <div className="bg-brand-navy/5 rounded-2xl border border-brand-navy/10 p-5">
                        <p className="text-xs text-brand-navy/50">Menu Nonaktif</p>
                        <p className="text-2xl font-bold text-brand-navy/70 mt-1">{products.length - activeCount}</p>
                    </div>
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4 transition ${
                                product.is_active ? 'border-brand-navy/5' : 'border-brand-navy/10 opacity-60'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-brand-navy">{product.name}</h3>
                                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${
                                        product.category === 'coffee' ? 'bg-brand-navy/10 text-brand-navy' :
                                        product.category === 'non-coffee' ? 'bg-brand-teal/10 text-brand-teal' :
                                        'bg-brand-gold/10 text-brand-gold'
                                    }`}>
                                        {product.category === 'coffee' ? '☕' : product.category === 'non-coffee' ? '🍵' : '🍽️'} {product.category}
                                    </span>
                                    <p className="text-brand-teal font-bold text-lg mt-0.5">{formatRupiah(product.price)}</p>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                    product.is_active
                                        ? 'bg-brand-teal/10 text-brand-teal'
                                        : 'bg-brand-navy/10 text-brand-navy/60'
                                }`}>
                                    {product.is_active ? '✅ Aktif' : '⏸️ Nonaktif'}
                                </span>
                            </div>

                            {/* Recipes */}
                            {product.recipes?.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-xs text-brand-navy/40 font-medium">RESEP</p>
                                    {product.recipes.map((r) => (
                                        <div key={r.id} className="flex justify-between text-xs text-brand-navy/80">
                                            <span>{r.ingredient?.name}</span>
                                            <span className="font-medium">{r.quantity_needed} {r.ingredient?.unit}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 mt-auto pt-2 border-t border-brand-navy/5">
                                <button
                                    onClick={() => handleToggle(product)}
                                    className={`flex-1 text-xs py-2 rounded-lg font-medium transition ${
                                        product.is_active
                                            ? 'bg-brand-navy/5 text-brand-navy/60 hover:bg-brand-navy/10'
                                            : 'bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20'
                                    }`}
                                >
                                    {product.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                                <button
                                    onClick={() => { setEditTarget(product); setShowModal(true); }}
                                    className="flex-1 text-xs py-2 rounded-lg bg-brand-navy/10 text-brand-navy hover:bg-brand-navy/20 font-medium transition"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(product)}
                                    className="text-xs py-2 px-3 rounded-lg bg-brand-coral/10 text-brand-coral hover:bg-brand-coral/20 font-medium transition"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {products.length === 0 && (
                    <div className="text-center py-16 text-brand-navy/40 bg-white rounded-2xl border border-brand-navy/5">
                        <p className="text-4xl mb-2">🍵</p>
                        <p>Belum ada menu. Tambahkan menu pertama!</p>
                    </div>
                )}
            </div>

            {showModal && (
                <ProductModal
                    product={editTarget}
                    ingredients={ingredients}
                    onClose={() => { setShowModal(false); setEditTarget(null); }}
                />
            )}
        </AuthenticatedLayout>
    );
}
