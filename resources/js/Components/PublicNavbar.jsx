
import { useState } from "react";
import { Link } from "@inertiajs/react";

export default function PublicNavbar({
    active = false,
    className = "",
    children,
    ...props
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    return (
        <nav className="bg-slate-900 border-b border-slate-800 shadow-md shadow-blue-950/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Left - Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/">
                            <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 tracking-wide">
                                SCAEMS
                            </span>
                        </Link>
                    </div>

                    {/* Hamburger for mobile */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setMobileOpen((v) => !v)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-slate-200 hover:text-white hover:bg-slate-800 focus:outline-none focus:bg-slate-800"
                            aria-label="Open main menu"
                        >
                            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                {mobileOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Right - Navigation links */}
                    <div className="hidden md:flex space-x-6">
                        <Link
                            href="/"
                            className={
                                "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none " +
                                (active
                                    ? "text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 tracking-wide"
                                    : "text-xl border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 focus:border-gray-300 focus:text-gray-700") +
                                className
                            }
                        >
                            Events
                        </Link>
                        <Link
                            href={route("news.index")}
                            className={
                                "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none " +
                                (active
                                    ? "text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 tracking-wide"
                                    : "text-xl border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 focus:border-gray-300 focus:text-gray-700") +
                                className
                            }
                        >
                            News
                        </Link>
                        <Link
                            href={route('complaints.index')}
                            className={
                                "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none " +
                                (active
                                    ? "text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 tracking-wide"
                                    : "text-xl border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 focus:border-gray-300 focus:text-gray-700") +
                                className
                            }
                        >
                            Complaints
                        </Link>
                    </div>
                </div>
            </div>
            {/* Mobile menu, show/hide based on state */}
            {mobileOpen && (
                <div className="md:hidden px-4 pb-4 pt-2 space-y-2 bg-slate-900 border-b border-slate-800">
                    <Link
                        href="/"
                        className="block py-2 text-lg font-semibold text-slate-100 hover:text-blue-400"
                        onClick={() => setMobileOpen(false)}
                    >
                        Events
                    </Link>
                    <Link
                        href={route("news.index")}
                        className="block py-2 text-lg font-semibold text-slate-100 hover:text-blue-400"
                        onClick={() => setMobileOpen(false)}
                    >
                        News
                    </Link>
                    <Link
                        href={route('complaints.index')}
                        className="block py-2 text-lg font-semibold text-slate-100 hover:text-blue-400"
                        onClick={() => setMobileOpen(false)}
                    >
                        Complaints
                    </Link>
                </div>
            )}
        </nav>
    );
}
