
import { useState } from "react";
import { Link, router } from "@inertiajs/react";

export default function PublicNavbar({
    active = false,
    className = "",
    children,
    ...props
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [requestDropdownOpen, setRequestDropdownOpen] = useState(false);
    return (
        <nav className="bg-slate-900 border-b border-slate-800 shadow-md shadow-blue-950/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Left - Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/">
                            <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 tracking-wide">
                                UdD Eventure
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
                    <div className="hidden md:flex items-center space-x-6">
                        <Link
                            href={route('events.list')}
                            className={
                                "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none " +
                                (active
                                    ? "text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-200 tracking-wide"
                                    : "text-xl border-transparent text-slate-300 hover:border-sky-300/60 hover:text-sky-200 focus:border-sky-300 focus:text-sky-200") +
                                className
                            }
                        >
                            Events
                        </Link>
                        <Link
                            href={route('news.index')}
                            className={
                                "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none " +
                                (active
                                    ? "text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-200 tracking-wide"
                                    : "text-xl border-transparent text-slate-300 hover:border-sky-300/60 hover:text-sky-200 focus:border-sky-300 focus:text-sky-200") +
                                className
                            }
                        >
                            News
                        </Link>
                        
                        {/* Request Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setRequestDropdownOpen(!requestDropdownOpen)}
                                className="inline-flex items-center border-b-2 px-1 pt-1 text-xl border-transparent text-slate-300 hover:border-sky-300/60 hover:text-sky-200 focus:border-sky-300 focus:text-sky-200 font-medium leading-5 transition duration-150 ease-in-out focus:outline-none"
                            >
                                Request
                                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {requestDropdownOpen && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setRequestDropdownOpen(false)}
                                    />
                                    <div className="absolute left-0 mt-3 w-56 rounded-xl shadow-2xl bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 z-50 overflow-hidden">
                                        <div className="py-2">
                                            <button
                                                onClick={() => {
                                                    setRequestDropdownOpen(false);
                                                    router.visit(route('borrow.index'));
                                                }}
                                                className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-blue-600/20 hover:text-white transition-all duration-200 group"
                                            >
                                                <svg className="w-5 h-5 text-blue-400 group-hover:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h14a2 2 0 012 2v8a2 2 0 01-2 2H7l-4 4V9a2 2 0 012-2z" />
                                                </svg>
                                                <span className="font-medium">Borrow</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setRequestDropdownOpen(false);
                                                    router.visit(route('complaints.index'));
                                                }}
                                                className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-blue-600/20 hover:text-white transition-all duration-200 group"
                                            >
                                                <svg className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                <span className="font-medium">Protest</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setRequestDropdownOpen(false);
                                                    router.visit(route('requirements.index'));
                                                }}
                                                className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-blue-600/20 hover:text-white transition-all duration-200 group"
                                            >
                                                <svg className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span className="font-medium">Requirements</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <Link
                            href={route('login')}
                            className={
                                "inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-transparent hover:border-sky-300/60 hover:bg-slate-800/50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 " +
                                (active ? "text-sky-300" : "text-slate-300 hover:text-white")
                            }
                            title="Login"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
            {/* Mobile menu, show/hide based on state */}
            {mobileOpen && (
                <div className="md:hidden px-4 pb-4 pt-2 space-y-2 bg-slate-900 border-b border-slate-800">
                    <Link
                        href={route('events.list')}
                        className="block py-2 text-lg font-semibold text-slate-100 hover:text-sky-200"
                        onClick={() => setMobileOpen(false)}
                    >
                        Events
                    </Link>
                    <Link
                        href={route('news.index')}
                        className="block py-2 text-lg font-semibold text-slate-100 hover:text-sky-200"
                        onClick={() => setMobileOpen(false)}
                    >
                        News
                    </Link>
                    
                    {/* Request Section in Mobile */}
                    <div>
                        <button
                            onClick={() => setRequestDropdownOpen(!requestDropdownOpen)}
                            className="flex items-center justify-between w-full py-2 text-lg font-semibold text-slate-100 hover:text-sky-200"
                        >
                            Request
                            <svg className={`h-4 w-4 transition-transform ${requestDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {requestDropdownOpen && (
                            <div className="pl-4 space-y-2 mt-2">
                                <Link
                                    href={route('borrow.index')}
                                    className="block py-2 text-base text-slate-300 hover:text-sky-200"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Borrow
                                </Link>
                                <Link
                                    href={route('complaints.index')}
                                    className="block py-2 text-base text-slate-300 hover:text-sky-200"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Protest
                                </Link>
                                <Link
                                    href={route('requirements.index')}
                                    className="block py-2 text-base text-slate-300 hover:text-sky-200"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Requirements
                                </Link>
                            </div>
                        )}
                    </div>

                    <Link
                        href={route('login')}
                        className="flex items-center py-2 text-lg font-semibold text-slate-100 hover:text-sky-200"
                        onClick={() => setMobileOpen(false)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Login
                    </Link>
                </div>
            )}
        </nav>
    );
}
