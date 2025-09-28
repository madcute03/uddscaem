import { Link } from "@inertiajs/react";

export default function PublicNavbar({
    active = false,
    className = "",
    children,
    ...props
}) {
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
                            Protest
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
