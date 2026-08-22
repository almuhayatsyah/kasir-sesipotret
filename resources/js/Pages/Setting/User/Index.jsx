import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';

export default function UserIndex({ users }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [editingUser, setEditingUser] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
    });

    const openAddModal = () => {
        setModalMode('add');
        setEditingUser(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setModalMode('edit');
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            password: '', // blank unless they want to change it
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
        clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (modalMode === 'add') {
            post(route('setting.users.store'), {
                onSuccess: () => closeModal(),
            });
        } else {
            put(route('setting.users.update', editingUser.id), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (user) => {
        if (confirm(`Yakin ingin menghapus pengguna ${user.name}?`)) {
            router.delete(route('setting.users.destroy', user.id));
        }
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <h2 className="font-serif font-semibold text-2xl text-brand-navy">Manajemen Pengguna</h2>
                <button
                    onClick={openAddModal}
                    className="bg-brand-teal hover:bg-brand-teal/90 text-white text-sm px-4 py-2 rounded-xl font-semibold transition flex items-center gap-1.5 shadow-lg shadow-brand-teal/20"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    Tambah Pengguna
                </button>
            </div>
        }>
            <Head title="Manajemen Pengguna — Kasir Sesi Potret" />

            <div className="py-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                
                {/* ── Table Container ── */}
                <div className="bg-white border border-brand-navy/5 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-brand-navy/5 bg-brand-navy/5">
                        <h3 className="font-bold text-brand-navy">Daftar Akun Kasir & Admin</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-brand-navy/5 border-b border-brand-navy/10 text-brand-navy/50 font-semibold">
                                    <th className="px-6 py-3">Nama</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-navy/5">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-brand-navy/5">
                                        <td className="px-6 py-3.5 font-bold text-brand-navy">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center font-bold">
                                                    {user.name.charAt(0)}
                                                </div>
                                                {user.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-brand-navy/60">{user.email}</td>
                                        <td className="px-6 py-3.5 text-right space-x-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="px-3 py-1.5 text-xs font-semibold bg-brand-navy/10 text-brand-navy hover:bg-brand-navy/20 rounded-lg transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="px-3 py-1.5 text-xs font-semibold bg-brand-coral/10 text-brand-coral hover:bg-brand-coral/20 rounded-lg transition"
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-brand-navy/40">
                                            Belum ada pengguna.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Modal Tambah / Edit */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="sm">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-brand-navy mb-4">
                        {modalMode === 'add' ? 'Tambah Pengguna Baru' : 'Edit Data Pengguna'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-brand-navy block mb-1">Nama Lengkap</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="w-full border border-brand-navy/10 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal outline-none transition"
                                placeholder="Misal: Budi Santoso"
                            />
                            {errors.name && <p className="text-brand-coral text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-brand-navy block mb-1">Email</label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                className="w-full border border-brand-navy/10 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal outline-none transition"
                                placeholder="Misal: budi@kasir.com"
                            />
                            {errors.email && <p className="text-brand-coral text-xs mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-brand-navy block mb-1">Password</label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                className="w-full border border-brand-navy/10 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal outline-none transition"
                                placeholder={modalMode === 'edit' ? "Kosongkan jika tidak ingin mengubah" : "Buat password"}
                            />
                            {errors.password && <p className="text-brand-coral text-xs mt-1">{errors.password}</p>}
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-brand-navy/5 mt-6">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 text-sm font-medium text-brand-navy/80 hover:bg-brand-navy/5 border border-brand-navy/10 rounded-xl transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-gradient-to-r from-brand-teal to-brand-navy hover:from-brand-teal/90 hover:to-brand-navy/90 text-white text-sm px-4 py-2 rounded-xl font-semibold transition shadow-lg shadow-brand-navy/20 disabled:opacity-50"
                            >
                                {modalMode === 'add' ? 'Simpan Pengguna' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

        </AuthenticatedLayout>
    );
}
