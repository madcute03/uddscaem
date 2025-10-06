import { Head } from '@inertiajs/react';

export default function GuestLayout({ title, children }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex flex-col">
            {title && (
                <Head>
                    <title>{`${title} | Your App Name`}</title>
                    <meta name="description" content="Your app description" />
                </Head>
            )}

            <main className="flex-1 flex items-center justify-center p-4">
                {children}
            </main>
        </div>
    );
}
