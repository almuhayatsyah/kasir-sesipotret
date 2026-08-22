import { Head } from "@inertiajs/react";

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex relative bg-[#FBF3E2] font-['Plus_Jakarta_Sans']">
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            {/* Kiri: Cover foto kedai kopi tepi pantai */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0E3B4D]">
                <img
                    src="https://images.unsplash.com/photo-1743525407528-19a48569192a?auto=format&fit=crop&q=80&w=1600"
                    alt="Kedai kopi tepi pantai"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Gradasi senja: navy -> transparan -> keemasan */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E3B4D] via-[#0E3B4D]/70 to-[#0E3B4D]/10"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-[#FF7657]/30 via-transparent to-[#F4B860]/20 mix-blend-overlay"></div>

                {/* Badge mengambang */}
                <div className="absolute top-8 left-8 z-10 inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white text-xs font-semibold tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F4B860] animate-pulse"></span>
                    BUKA SETIAP HARI &middot; 07.00 &ndash; 22.00
                </div>

                <div className="relative z-10 flex flex-col justify-end p-12 pb-24 text-white h-full">
                    <div className="mb-8 flex items-center">
                        <img src="/logo.png" alt="Logo Kasir Sesi Potret" className="w-auto h-24 sm:h-32 object-contain drop-shadow-2xl" />
                    </div>
                    <p className="uppercase tracking-[0.25em] text-[#F4B860] text-xs font-bold mb-3">
                        Kedai Kopi Tepi Pantai
                    </p>
                    <h1 className="font-['Fraunces'] text-4xl font-semibold tracking-tight mb-4 leading-tight">
                        Kasir Sesi Potret
                    </h1>
                    <p className="text-base text-white/80 max-w-md leading-relaxed">
                        Sistem kasir (POS), manajemen stok, dan laporan keuangan
                        yang rapi &mdash; setenang deburan ombak, untuk
                        menjalankan kedai kopi pantaimu dari satu layar.
                    </p>
                </div>
            </div>

            {/* Garis ombak dekoratif di antara dua panel */}
            <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-16 z-20 pointer-events-none">
                <svg
                    viewBox="0 0 100 800"
                    preserveAspectRatio="none"
                    className="w-full h-full"
                >
                    <path
                        d="M50,0 C10,60 90,140 50,200 C10,260 90,340 50,400 C10,460 90,540 50,600 C10,660 90,740 50,800 L0,800 L0,0 Z"
                        fill="#FBF3E2"
                    />
                </svg>
            </div>

            {/* Kanan: Form Login */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#FBF3E2] p-8 sm:p-12 relative overflow-hidden">
                {/* Cahaya matahari */}
                <div className="absolute top-0 right-0 -mr-24 -mt-24 w-72 h-72 rounded-full bg-[#F4B860]/40 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-72 h-72 rounded-full bg-[#1FA9A0]/25 blur-3xl"></div>

                {/* Riak ombak halus di dasar panel */}
                <svg
                    className="absolute bottom-0 left-0 w-full h-24 text-[#1FA9A0]/10"
                    viewBox="0 0 500 80"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0,40 C125,80 375,0 500,40 L500,80 L0,80 Z"
                        fill="currentColor"
                    />
                </svg>

                <div className="w-full max-w-md relative z-10">
                    <div className="lg:hidden mb-10 flex flex-col items-center">
                        <div className="mb-5 flex items-center justify-center">
                            <img src="/logo.png" alt="Logo Kasir Sesi Potret" className="w-auto h-20 object-contain drop-shadow-lg" />
                        </div>
                        <h1 className="font-['Fraunces'] text-2xl font-semibold text-[#0E3B4D]">
                            Kasir Sesi Potret
                        </h1>
                    </div>

                    <p className="uppercase tracking-[0.2em] text-[#1FA9A0] text-xs font-bold mb-3">
                        Selamat Datang Kembali
                    </p>
                    <h2 className="font-['Fraunces'] text-3xl sm:text-4xl font-semibold text-[#0E3B4D] mb-2">
                        Masuk ke kedai{" "}
                        <span className="italic text-[#FF7657]">Anda</span>
                    </h2>
                    <p className="text-[#0E3B4D]/60 mb-8 text-sm">
                        Silakan masuk menggunakan akun kasir atau admin Anda.
                    </p>

                    {children}
                </div>
            </div>
        </div>
    );
}
