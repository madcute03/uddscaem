import { Link } from '@inertiajs/react';

export default function Navbar({ setSidebarOpen }) {
    return (
        <nav className="sticky top-0 z-40 flex items-center justify-between bg-white px-4 py-4 shadow-sm sm:px-6 lg:px-8">
            <button
                type="button"
                className="text-gray-500 hover:text-gray-600 lg:hidden"
                onClick={() => setSidebarOpen(true)}
            >
                <span className="sr-only">Open sidebar</span>
                <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                </svg>
            </button>

            <div className="flex-1 px-4">
                <h1 className="text-xl font-semibold text-gray-900">Your App Name</h1>
            </div>

            <div className="flex items-center space-x-4">
                {/* Add your navigation items here */}
                <Link
                    href={route('dashboard')}
                    className="text-gray-700 hover:text-gray-900"
                >
                    Dashboard
                </Link>
                <Link
                    href={route('profile.edit')}
                    className="text-gray-700 hover:text-gray-900"
                >
                    Profile
                </Link>
            </div>
        </nav>
    );
}
