import GuestLayout from "@/Layouts/GuestLayout";
import { Head, useForm } from "@inertiajs/react";

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-6 flex items-center gap-2 text-sm font-medium text-[#0E3B4D] bg-[#1FA9A0]/10 p-3.5 rounded-2xl border border-[#1FA9A0]/25">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="shrink-0"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="#1FA9A0"
                            strokeWidth="1.5"
                        />
                        <path
                            d="M9 12l2 2 4-4"
                            stroke="#1FA9A0"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-[#0E3B4D] mb-1.5"
                    >
                        Alamat Email
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#0E3B4D]/40">
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    d="M3 6.5A2.5 2.5 0 015.5 4h13A2.5 2.5 0 0121 6.5v11a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 17.5v-11z"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                />
                                <path
                                    d="M4 6.5l8 6 8-6"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className={`w-full pl-12 pr-4 py-3.5 rounded-full border text-sm outline-none transition-all duration-200 bg-white ${
                                errors.email
                                    ? "border-[#FF7657] focus:ring-4 focus:ring-[#FF7657]/20 focus:border-[#FF7657]"
                                    : "border-[#0E3B4D]/10 focus:ring-4 focus:ring-[#1FA9A0]/20 focus:border-[#1FA9A0]"
                            }`}
                            autoComplete="username"
                            placeholder="contoh@kasir.com"
                            autoFocus
                            onChange={(e) => setData("email", e.target.value)}
                        />
                    </div>
                    {errors.email && (
                        <p className="mt-1.5 ml-1 text-xs text-[#FF7657] font-medium">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-[#0E3B4D] mb-1.5"
                    >
                        Password
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#0E3B4D]/40">
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <rect
                                    x="5"
                                    y="10.5"
                                    width="14"
                                    height="9"
                                    rx="2.5"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                />
                                <path
                                    d="M8 10.5V7.5a4 4 0 118 0v3"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </span>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className={`w-full pl-12 pr-4 py-3.5 rounded-full border text-sm outline-none transition-all duration-200 bg-white ${
                                errors.password
                                    ? "border-[#FF7657] focus:ring-4 focus:ring-[#FF7657]/20 focus:border-[#FF7657]"
                                    : "border-[#0E3B4D]/10 focus:ring-4 focus:ring-[#1FA9A0]/20 focus:border-[#1FA9A0]"
                            }`}
                            placeholder="Masukkan password Anda"
                            autoComplete="current-password"
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                        />
                    </div>
                    {errors.password && (
                        <p className="mt-1.5 ml-1 text-xs text-[#FF7657] font-medium">
                            {errors.password}
                        </p>
                    )}
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-gradient-to-r from-[#1FA9A0] to-[#0E3B4D] hover:from-[#1c968e] hover:to-[#0b3140] text-white font-bold py-3.5 px-4 rounded-full shadow-lg shadow-[#0E3B4D]/25 transition-all duration-200 disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                        {processing ? (
                            <svg
                                className="animate-spin h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                        ) : (
                            <>
                                Masuk Sekarang
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M5 12h14M13 6l6 6-6 6"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
