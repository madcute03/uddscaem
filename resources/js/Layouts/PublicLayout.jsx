import PublicNavbar from '@/Components/PublicNavbar';
import HeadlinesTicker from '@/Components/HeadlinesTicker';

export default function PublicLayout({ children, headlines = [], showHeadlinesInHeader = true }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100">
            <PublicNavbar />
            {showHeadlinesInHeader && headlines?.length ? (
                <div className="bg-slate-900/40 backdrop-blur-sm border-b border-slate-800">
                    <div className="max-w-6xl mx-auto px-6 py-4">
                        <HeadlinesTicker headlines={headlines} />
                    </div>
                </div>
            ) : null}

            <main>{children}</main>
        </div>
    );
}
