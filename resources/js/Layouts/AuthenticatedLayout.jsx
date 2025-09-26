import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100 flex">
            {/* Left Sidebar - responsive */}
            <aside className="fixed left-0 top-0 h-full w-64 md:w-80 bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/70 border-r border-slate-800/50 shadow-2xl shadow-blue-950/30 z-50 hidden sm:block">
                <div className="flex flex-col h-full">
                    {/* Logo/Brand & User Profile */}
                    <div className="p-6 border-b border-slate-800/50">
                        <div className="flex items-center justify-between">
                            <Link href="/dashboard" className="flex-1">
                                <p className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 tracking-wide text-center">SCAEMS</p>
                                <p className="text-xs text-slate-400 text-center mt-1">Admin Panel</p>
                            </Link>

                            {/* Compact User Profile */}
                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="flex items-center px-2 py-2 text-sm font-medium rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                            <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold text-xs">{user.name.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <svg className="w-3 h-3 text-slate-400 ml-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                                        <div className="py-1">
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                            </div>
                                            <Dropdown.Link
                                                href={route('profile.edit')}
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
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
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
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

                    {/* Navigation Menu */}
                    <nav className="flex-1 p-4">
                        <div className="space-y-2">
                            <NavLink
                                href={route('dashboard')}
                                active={route().current('dashboard')}
                                className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-slate-800/50 hover:text-white"
                            >
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                                </svg>
                                Dashboard
                            </NavLink>

                            <NavLink
                                href={route('dashboard.create-competition')}
                                active={route().current('dashboard.create-competition') || route().current('dashboard.create-tryouts')}
                                className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-slate-800/50 hover:text-white"
                            >
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Create Event
                            </NavLink>

                            <NavLink
                                href={route('bracket')}
                                active={route().current('bracket')}
                                className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-slate-800/50 hover:text-white"
                            >
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 9l4-4m0 0l-4-4m4 4H8" />
                                </svg>
                                Create Bracket
                            </NavLink>

                            <NavLink
                                href={route('dashboard.createnews')}
                                active={route().current('dashboard.createnews')}
                                className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-slate-800/50 hover:text-white"
                            >
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                                Create News
                            </NavLink>
                            <NavLink
                                href={route('admin.complaints.index')}
                                active={route().current('admin.complaints.index')}
                                className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-slate-800/50 hover:text-white"
                            >
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View Complaints
                            </NavLink>
                        </div>
                    </nav>

                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 pl-0 sm:pl-64 md:pl-80">
                {header && (
                    <header className="bg-slate-900/60 backdrop-blur border-b border-slate-800/50 shadow-lg shadow-blue-950/20">
                        <div className="mx-auto max-w-2xl md:max-w-4xl lg:max-w-5xl px-2 py-4 sm:px-4 md:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <main className="min-h-screen w-full max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6">{children}</main>
            </div>
    </div>
    );
}
