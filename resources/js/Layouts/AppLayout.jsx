import { Head } from '@inertiajs/react';
import { useState } from 'react';
import Navbar from '@/Components/Navbar';
import Sidebar from '@/Components/Sidebar';

export default function AppLayout({ title, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100">
            {title && (
                <Head>
                    <title>{`${title} | Your App Name`}</title>
                </Head>
            )}

            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            
            <div className="lg:pl-72">
                <Navbar setSidebarOpen={setSidebarOpen} />
                
                <main className="py-10">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}