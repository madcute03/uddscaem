import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-blue-400 bg-slate-800/60 text-slate-100 focus:border-blue-500 focus:bg-slate-800/70'
                    : 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-800/40 hover:text-white focus:border-slate-700 focus:bg-slate-800/40 focus:text-white'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
