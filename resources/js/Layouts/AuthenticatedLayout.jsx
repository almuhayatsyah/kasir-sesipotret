import { Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// ── Icon SVG mini ────────────────────────────────────────
const Icon = {
    dashboard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    ),
    pos: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
        </svg>
    ),
    report: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    shift: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    ingredient: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M3 3h18v4H3z" rx="1" /><path d="M5 7v13h14V7" />
            <line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="15" y2="15" />
        </svg>
    ),
    product: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <path d="M8 12h8M12 8v8" />
        </svg>
    ),
    users: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
    ),
    logout: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    chevron: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    ),
    menu: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    ),
    close: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
};

// ── Nav Item ─────────────────────────────────────────────
function NavItem({ href, icon, label, active, collapsed, badge }) {
    return (
        <Link
            href={href}
            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm
                transition-all duration-200 group relative
                ${active
                    ? 'bg-brand-teal text-white shadow-md shadow-brand-teal/20'
                    : 'text-brand-sand/60 hover:bg-brand-teal/20 hover:text-white'
                }
            `}
            title={collapsed ? label : undefined}
        >
            <span className={`shrink-0 ${active ? 'text-white' : 'text-brand-sand/60 group-hover:text-white'}`}>
                {icon}
            </span>
            {!collapsed && (
                <span className="truncate">{label}</span>
            )}
            {badge > 0 && (
                <span className={`
                    ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0
                    ${active ? 'bg-white/25 text-white' : 'bg-brand-coral text-white'}
                    ${collapsed ? 'absolute -top-1 -right-1' : ''}
                `}>
                    {badge}
                </span>
            )}
            {/* Tooltip saat collapsed */}
            {collapsed && (
                <span className="absolute left-full ml-3 px-2 py-1 bg-brand-navy text-brand-sand text-xs rounded-lg
                    whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 shadow-xl border border-brand-teal/20">
                    {label}
                </span>
            )}
        </Link>
    );
}

// ── Nav Section label ────────────────────────────────────
function NavSection({ label, collapsed }) {
    if (collapsed) return <div className="h-px bg-white/5 my-2 mx-2" />;
    return (
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-sand/40 px-3 mt-5 mb-1.5">
            {label}
        </p>
    );
}

// ── MAIN LAYOUT ──────────────────────────────────────────
export default function AuthenticatedLayout({ header, children }) {
    const { auth, flash } = usePage().props;
    const user = auth?.user;

    const [collapsed, setCollapsed]   = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [canInstall, setCanInstall] = useState(false);

    const cur = (name) => route().current(name);

    const handleLogout = () => {
        router.post(route('logout'));
    };

    // PWA: pantau apakah tombol "Install App" tersedia
    useEffect(() => {
        if (window.__pwaInstallPrompt) setCanInstall(true);
        const onAvailable = () => setCanInstall(true);
        window.addEventListener('pwa-install-available', onAvailable);
        return () => window.removeEventListener('pwa-install-available', onAvailable);
    }, []);

    const handleInstall = async () => {
        if (!window.__pwaInstallPrompt) return;
        window.__pwaInstallPrompt.prompt();
        const { outcome } = await window.__pwaInstallPrompt.userChoice;
        if (outcome === 'accepted') {
            setCanInstall(false);
            window.__pwaInstallPrompt = null;
        }
    };

    const sidebarContent = (
        <div className="flex flex-col h-full">

            {/* Logo / Brand */}
            <div className={`flex items-center gap-3 px-4 py-6 ${collapsed ? 'justify-center' : ''}`}>
                <div className={`flex items-center justify-center shrink-0 transition-all duration-300 ${collapsed ? 'w-12 h-12' : 'w-16 h-16'}`}>
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
                </div>
                {!collapsed && (
                    <div className="flex flex-col justify-center">
                        <p className="text-white font-serif font-bold text-lg leading-tight">Kasir Sesi</p>
                        <p className="text-brand-gold text-[11px] font-semibold tracking-wider mt-0.5 uppercase">Potret Coffee</p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">

                <NavSection label="Utama" collapsed={collapsed} />
                <NavItem href={route('dashboard')}         icon={Icon.dashboard}  label="Dashboard"  active={cur('dashboard')}              collapsed={collapsed} />
                <NavItem href={route('pos.index')}         icon={Icon.pos}        label="Kasir POS"  active={cur('pos.index')}              collapsed={collapsed} />
                <NavItem href={route('report.index')}      icon={Icon.report}     label="Laporan"    active={cur('report.index')}           collapsed={collapsed} />

                <NavSection label="Inventori" collapsed={collapsed} />
                <NavItem href={route('inventory.ingredients')} icon={Icon.ingredient} label="Bahan Baku"  active={cur('inventory.ingredients')} collapsed={collapsed} />
                <NavItem href={route('inventory.products')}   icon={Icon.product}    label="Menu Produk" active={cur('inventory.products')}    collapsed={collapsed} />

                <NavSection label="Pengaturan" collapsed={collapsed} />
                <NavItem href={route('setting.users.index')} icon={Icon.users} label="Manajemen User" active={cur('setting.users.index')} collapsed={collapsed} />

            </nav>

            {/* User info + Logout */}
            <div className={`border-t border-white/10 p-3 space-y-1 ${collapsed ? 'items-center flex flex-col' : ''}`}>
                {!collapsed && (
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5 mb-2 border border-white/5">
                        <div className="w-7 h-7 rounded-full bg-brand-teal flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user?.name?.charAt(0) ?? 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                            <p className="text-brand-sand/60 text-[10px] truncate">{user?.email}</p>
                        </div>
                    </div>
                )}
                {/* PWA Install Button */}
                {canInstall && (
                    <button
                        onClick={handleInstall}
                        className={`
                            flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
                            bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20
                            transition-all duration-200 group relative border border-brand-gold/20
                            ${collapsed ? 'justify-center' : ''}
                        `}
                        title={collapsed ? 'Install App' : undefined}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0">
                            <path d="M12 16l-4-4h3V4h2v8h3l-4 4z" />
                            <path d="M4 20h16" />
                        </svg>
                        {!collapsed && <span>Install App</span>}
                        {collapsed && (
                            <span className="absolute left-full ml-3 px-2 py-1 bg-brand-navy text-brand-gold text-xs rounded-lg border border-brand-gold/30
                                whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 shadow-xl">
                                Install App
                            </span>
                        )}
                    </button>
                )}

                <button
                    onClick={handleLogout}
                    className={`
                        flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
                        text-brand-sand/60 hover:bg-brand-coral/20 hover:text-brand-coral
                        transition-all duration-200 group relative
                        ${collapsed ? 'justify-center' : ''}
                    `}
                    title={collapsed ? 'Keluar' : undefined}
                >
                    {Icon.logout}
                    {!collapsed && <span>Keluar</span>}
                    {collapsed && (
                        <span className="absolute left-full ml-3 px-2 py-1 bg-brand-navy text-white text-xs rounded-lg border border-brand-coral/30
                            whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 shadow-xl">
                            Keluar
                        </span>
                    )}
                </button>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="hidden lg:flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs text-brand-sand/40
                        hover:bg-white/5 hover:text-brand-sand transition justify-center"
                >
                    <svg
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                        className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
                    >
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    {!collapsed && <span>Sembunyikan</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-brand-sand flex font-sans">

            {/* ── Sidebar Desktop ── */}
            <aside className={`
                hidden lg:flex flex-col shrink-0 sticky top-0 h-screen
                bg-brand-navy transition-all duration-300 ease-in-out print:hidden
                ${collapsed ? 'w-[72px]' : 'w-64'}
            `}>
                {sidebarContent}
            </aside>

            {/* ── Sidebar Mobile overlay ── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}
            <aside className={`
                fixed top-0 left-0 h-full w-64 bg-brand-navy z-50 flex flex-col
                lg:hidden transition-transform duration-300 ease-in-out shadow-2xl
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {sidebarContent}
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-brand-sand/80 backdrop-blur-md border-b border-brand-navy/5 shadow-sm print:hidden">
                    <div className="flex items-center h-16 px-4 lg:px-8 gap-3">
                        {/* Hamburger mobile */}
                        <button
                            onClick={() => setMobileOpen(o => !o)}
                            className="lg:hidden p-2 rounded-xl text-brand-navy hover:bg-brand-navy/5 transition"
                        >
                            {Icon.menu}
                        </button>

                        {/* Page title / header slot */}
                        <div className="flex-1 min-w-0">
                            {header ? (
                                <div className="text-brand-navy">{header}</div>
                            ) : (
                                <p className="font-serif font-semibold text-brand-navy text-lg">Kasir Sesi Potret</p>
                            )}
                        </div>

                        {/* User chip (desktop) */}
                        <div className="hidden sm:flex items-center gap-2.5 text-sm text-brand-navy">
                            <div className="w-8 h-8 rounded-full bg-brand-teal/15 flex items-center justify-center text-brand-teal font-bold text-xs ring-1 ring-brand-teal/20">
                                {user?.name?.charAt(0) ?? 'U'}
                            </div>
                            <span className="font-semibold">{user?.name}</span>
                        </div>
                    </div>
                </header>

                {/* Flash messages */}
                {(flash?.success || flash?.error || flash?.warning) && (
                    <div className="px-6 pt-4">
                        {flash.success && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                <span>✅</span> {flash.success}
                            </div>
                        )}
                        {flash.error && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                <span>❌</span> {flash.error}
                            </div>
                        )}
                        {flash.warning && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                <span>⚠️</span> {flash.warning}
                            </div>
                        )}
                    </div>
                )}

                {/* Page content */}
                <main className="flex-1">{children}</main>
            </div>
        </div>
    );
}
