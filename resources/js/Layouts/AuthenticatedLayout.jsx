import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const { flash } = usePage().props;
    const [visibleFlash, setVisibleFlash] = useState(flash);

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    const handleNavClick = () => setShowingNavigationDropdown(false);

    // Auto-dismiss flash messages after 5 seconds
    useEffect(() => {
        if (visibleFlash?.success || visibleFlash?.error) {
            const timer = setTimeout(() => {
                setVisibleFlash(null);
            }, 5000); // 5 seconds
            return () => clearTimeout(timer);
        }
    }, [visibleFlash]);

    // Update visible flash when page props change
    useEffect(() => {
        setVisibleFlash(flash);
    }, [flash]);

    const navigationLinks = [
        ...(user.role !== 'writer' ? [
            {
                label: 'Dashboard',
                href: route('dashboard.summary'),
                active: route().current('dashboard.summary'),
                icon: (
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                ),
            },
        ] : []),
        ...(user.role !== 'writer' ? [
            {
                label: 'Events',
                href: route('dashboard'),
                active: route().current('dashboard'),
                icon: (
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                    </svg>
                ),
            },
        ] : []),
        ...(user.role === 'admin' ? [
            {
                label: 'Manage Writer',
                href: route('admin.writers.index'),
                active: route().current('admin.writers.*'),
                icon: (
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                ),
            },
            {
                label: 'Borrowers Management',
                href: route('admin.borrowers.index'),
                active: route().current('admin.borrowers.*'),
                icon: (
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h14a2 2 0 012 2v8a2 2 0 01-2 2H7l-4 4V9a2 2 0 012-2z" />
                    </svg>
                ),
            },
        ] : []),
        {
            label: 'Manage News',
            href: route('admin.news.index'),
            active: route().current('admin.news.*'),
            icon: (
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100 flex">
            {/* Mobile Top Bar: Menu + Profile */}
            <div className="sm:hidden fixed top-0 left-0 w-full z-50 flex items-center gap-3 bg-slate-900/90 border-b border-slate-800/50 h-14 px-4 shadow-lg">
                <button
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800/90 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    onClick={() => setShowingNavigationDropdown((prev) => !prev)}
                    aria-label="Toggle menu"
                    aria-expanded={showingNavigationDropdown}
                >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <Link
                    href={user.role === 'admin' ? route('dashboard.summary') : (user.role === 'writer' ? "/admin/news" : "/dashboard")}
                    className="flex items-center gap-2"
                    onClick={() => setShowingNavigationDropdown(false)}
                >
                    <img
                        src="/images/sems.png"
                        alt="SCAEMS logo"
                        className="w-9 h-9 rounded-full object-cover border border-blue-500/40 bg-slate-950 shadow-md shadow-blue-950/30"
                    />
                    <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 tracking-wide">
                        SCAEMS
                    </span>
                </Link>
                <div className="flex-1" />
                <div className="relative">
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-full">
                                <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                                </div>
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content
                            contentClasses="py-1 bg-slate-950/95 text-slate-200 ring-blue-500/30 ring-opacity-40 border border-slate-800/60 shadow-2xl shadow-blue-950/40"
                        >
                            <div className="py-1">
                                <div className="px-4 py-2 border-b border-slate-800/60">
                                    <div className="text-sm font-medium text-slate-100">{user.name}</div>
                                    <div className="text-xs text-slate-400 truncate">{user.email}</div>
                                </div>
                                <Dropdown.Link
                                    href={route('profile.edit')}
                                    className="flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/70 hover:text-white focus:bg-slate-800/70 focus:text-white transition-colors duration-150"
                                >
                                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Profile
                                </Dropdown.Link>
                                <Dropdown.Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex items-center w-full px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/20 focus:bg-rose-500/20 hover:text-rose-200 focus:text-rose-200 transition-colors duration-150"
                                >
                                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Log Out
                                </Dropdown.Link>
                            </div>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </div>

            {/* Sidebar as Drawer on mobile, fixed on desktop */}
            {/* Overlay for mobile drawer */}
            {showingNavigationDropdown && (
                <div
                    className="fixed top-14 left-0 right-0 bottom-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
                    onClick={() => setShowingNavigationDropdown(false)}
                />
            )}
            <aside
                className={`fixed left-0 top-14 sm:top-0 h-[calc(100vh-3.5rem)] sm:h-full w-64 md:w-80 bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/70 border-r border-slate-800/50 shadow-2xl shadow-blue-950/30 z-50 sm:z-30 transition-transform duration-300 ease-in-out
                ${showingNavigationDropdown ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0 sm:block`}
                style={{ display: showingNavigationDropdown ? 'block' : undefined }}
            >
                <div className="flex flex-col h-full sm:pt-24">
                    {/* Navigation Menu */}
                    <nav className="flex-1 p-4">
                        <div className="space-y-2">
                            {navigationLinks.map((link, index) => (
                                <div
                                    key={link.label}
                                    className={`transform transition-all duration-300 ease-out ${
                                        showingNavigationDropdown
                                            ? 'translate-x-0 opacity-100'
                                            : '-translate-x-6 opacity-0'
                                    } sm:translate-x-0 sm:opacity-100`}
                                    style={{ transitionDelay: `${index * 60}ms` }}
                                >
                                    <NavLink
                                        href={link.href}
                                        active={link.active}
                                        onClick={handleNavClick}
                                        className=" flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-slate-800/50 hover:text-white"
                                    >
                                        {link.icon}
                                        {link.label}
                                    </NavLink>
                                </div>
                            ))}
                        </div>
                    </nav>

                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 pl-0 pt-16 sm:pl-64 md:pl-80 sm:pt-24">
                <div className="hidden sm:block fixed inset-x-0 top-0 z-40 sm:z-50 bg-slate-900/70 backdrop-blur border-b border-slate-800/60 shadow-lg shadow-blue-950/20">
                    <div className="flex items-center gap-6 px-4 md:px-6 lg:px-8 py-4">
                        <div className="flex-1 flex items-center gap-6 min-w-0">
                            <Link href={user.role === 'admin' ? route('dashboard.summary') : (user.role === 'writer' ? "/admin/news" : "/dashboard")} className="flex items-center gap-3 flex-none text-left">
                                <img
                                    src="/images/sems.png"
                                    alt="SCAEMS logo"
                                    className="hidden sm:block w-12 h-12 rounded-full object-cover border border-blue-500/40 bg-slate-950 shadow-md shadow-blue-950/30"
                                />
                                <div className="flex flex-col">
                                    <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 tracking-wide">SCAEMS</span>
                                    {!header && (
                                        <span className="text-xs text-slate-400 mt-1">Admin Panel</span>
                                    )}
                                </div>
                            </Link>
                            {header && (
                                <div className="flex-1 min-w-0 text-slate-100">
                                    <div className="truncate text-base font-semibold">
                                        {header}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative flex-none">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-full">
                                        <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                                        </div>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content
                                    contentClasses="py-1 bg-slate-950/95 text-slate-200 ring-blue-500/30 ring-opacity-40 border border-slate-800/60 shadow-2xl shadow-blue-950/40"
                                >
                                    <div className="py-1">
                                        <div className="px-4 py-2 border-b border-slate-800/60">
                                            <div className="text-sm font-medium text-slate-100">{user.name}</div>
                                            <div className="text-xs text-slate-400 truncate">{user.email}</div>
                                        </div>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                            className="flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/70 hover:text-white focus:bg-slate-800/70 focus:text-white transition-colors duration-150"
                                        >
                                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="flex items-center w-full px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/20 focus:bg-rose-500/20 hover:text-rose-200 focus:text-rose-200 transition-colors duration-150"
                                        >
                                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Log Out
                                        </Dropdown.Link>
                                    </div>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>

                {header && (
                    <header className="sm:hidden bg-slate-900/60 backdrop-blur border-b border-slate-800/50 shadow-lg shadow-blue-950/20">
                        <div className="mx-auto max-w-2xl md:max-w-4xl lg:max-w-5xl px-2 py-4 sm:px-4 md:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                {/* Flash Messages */}
                {(visibleFlash?.success || visibleFlash?.error) && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 sm:top-24">
                        <div className={`px-6 py-3 rounded-lg shadow-lg ${visibleFlash.success ? 'bg-emerald-600 text-white shadow-emerald-900/30' : 'bg-red-600 text-white shadow-red-900/30'}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{visibleFlash.success || visibleFlash.error}</span>
                                <button
                                    onClick={() => setVisibleFlash(null)}
                                    className="ml-4 text-white hover:text-gray-200 text-sm font-bold"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <main className="min-h-screen w-full max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6">{children}</main>
            </div>
        </div>
    );
}
