import PublicNavbar from '@/Components/PublicNavbar';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function PublicLayout({
    children,
    showNavbar = true,
}) {
    const { flash } = usePage().props;
    const [visibleFlash, setVisibleFlash] = useState(flash);

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100">
            {showNavbar && <PublicNavbar />}
            <main>{children}</main>
            {(visibleFlash?.success || visibleFlash?.error) && (
                <div className="fixed top-10 left-1/2 -translate-x-1/2 z-20">
                    <div className={`px-4 py-2 rounded-lg shadow-lg ${visibleFlash.success ? 'bg-emerald-600 text-white shadow-emerald-900/30' : 'bg-red-600 text-white shadow-red-900/30'}`}>
                        <div className="flex items-center justify-between">
                            <span>{visibleFlash.success || visibleFlash.error}</span>
                            <button
                                onClick={() => setVisibleFlash(null)}
                                className="ml-1 text-white hover:text-gray-200 text-sm"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Borrow moved to navbar */}
        </div>
    );
}
