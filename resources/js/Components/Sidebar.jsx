import { Link } from '@inertiajs/react';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-30 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden ${
                    sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-16 flex-shrink-0 items-center px-6">
                    <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                    <button
                        type="button"
                        className="ml-auto -mr-2 p-2 text-gray-500 hover:text-gray-600 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span className="sr-only">Close sidebar</span>
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    <ul className="space-y-2">
                        <li>
                            <Link
                                href={route('dashboard')}
                                className="flex items-center rounded-lg p-3 text-base font-normal text-gray-900 hover:bg-gray-100"
                            >
                                <span className="ml-3">Dashboard</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={route('profile.edit')}
                                className="flex items-center rounded-lg p-3 text-base font-normal text-gray-900 hover:bg-gray-100"
                            >
                                <span className="ml-3">Profile</span>
                            </Link>
                        </li>
                        {/* Add more navigation items as needed */}
                    </ul>
                </nav>
            </div>
        </>
    );
}
