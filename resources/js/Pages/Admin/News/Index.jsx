import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState, useEffect } from 'react';

export default function NewsIndex({ news, stats }) {
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">News Management</h2>
            }
        >
            <Head title="News Management" />

            <div className="py-6 sm:py-8">
                <div className="ml-8 mr-8">
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <Link
                            href={route('admin.news.create')}
                            className="w-[141px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create News
                        </Link>
                    </div>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                        <div className="bg-slate-900 overflow-hidden shadow-sm rounded-lg border border-slate-700 transition-transform hover:scale-[1.02]">
                            <div className="p-3 sm:p-4 lg:p-6 text-slate-100">
                                <div className="text-xl sm:text-2xl font-bold text-blue-400">{stats.total}</div>
                                <div className="text-xs sm:text-sm text-slate-400">Total News</div>
                            </div>
                        </div>
                        <div className="bg-slate-900 overflow-hidden shadow-sm rounded-lg border border-slate-700 transition-transform hover:scale-[1.02]">
                            <div className="p-3 sm:p-4 lg:p-6 text-slate-100">
                                <div className="text-xl sm:text-2xl font-bold text-yellow-400">{stats.pending}</div>
                                <div className="text-xs sm:text-sm text-slate-400">Pending</div>
                            </div>
                        </div>
                        <div className="bg-slate-900 overflow-hidden shadow-sm rounded-lg border border-slate-700 transition-transform hover:scale-[1.02] hidden sm:block">
                            <div className="p-3 sm:p-4 lg:p-6 text-slate-100">
                                <div className="text-xl sm:text-2xl font-bold text-green-400">{stats.active}</div>
                                <div className="text-xs sm:text-sm text-slate-400">Active</div>
                            </div>
                        </div>
                        <div className="bg-slate-900 overflow-hidden shadow-sm rounded-lg border border-slate-700 transition-transform hover:scale-[1.02] hidden lg:block">
                            <div className="p-3 sm:p-4 lg:p-6 text-slate-100">
                                <div className="text-xl sm:text-2xl font-bold text-red-400">{stats.inactive}</div>
                                <div className="text-xs sm:text-sm text-slate-400">Inactive</div>
                            </div>
                        </div>
                        <div className="bg-slate-900 overflow-hidden shadow-sm rounded-lg border border-slate-700 transition-transform hover:scale-[1.02]">
                            <div className="p-3 sm:p-4 lg:p-6 text-slate-100">
                                <div className="text-xl sm:text-2xl font-bold text-purple-400">{stats.writers}</div>
                                <div className="text-xs sm:text-sm text-slate-400">Writers</div>
                            </div>
                        </div>
                    </div>

                    {/* News Table */}
                    <div className="bg-slate-800 backdrop-blur-md rounded-lg shadow overflow-hidden border border-slate-700/50">
                        <div className="p-6">
                            {/* Mobile Search */}
                            <div className="mb-4 sm:hidden">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search news..."
                                        className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-lg bg-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-800 backdrop-blur-md rounded-lg shadow overflow-hidden border border-slate-700/50">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-700">
                                        <thead className="bg-slate-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider whitespace-nowrap">
                                                    Article
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider whitespace-nowrap">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider whitespace-nowrap">
                                                    Writer
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider whitespace-nowrap">
                                                    Date
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider whitespace-nowrap">
                                                    Actions
                                                </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {news.map((article) => (
                                            <tr key={article.id} className="hover:bg-slate-700/30 transition-colors duration-150">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <img
                                                            className="h-10 w-10 rounded-lg object-cover border border-slate-600 flex-shrink-0"
                                                            src={`/storage/${article.image}`}
                                                            alt={article.title}
                                                            loading="lazy"
                                                        />
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-slate-100 line-clamp-1">
                                                                {article.title}
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                                    {article.category}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        article.status === 'active'
                                                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                            : article.status === 'pending'
                                                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                    }`}>
                                                        {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    <div className="truncate max-w-[150px]">{article.writer_name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    {formatDate(article.date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <Link
                                                            href={route('admin.news.edit', article.id)}
                                                            className="text-blue-400 hover:text-blue-200 transition-colors duration-200"
                                                            title="Edit"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </Link>
                                                        <Link
                                                            href={route('admin.news.destroy', article.id)}
                                                            method="delete"
                                                            as="button"
                                                            className="text-red-600 hover:text-red-400 transition-colors duration-200"
                                                            title="Delete"
                                                            onClick={(e) => {
                                                                if (!confirm('Are you sure you want to delete this news?')) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                        >
                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                            
                            {/* Pagination */}
                            {news.links && news.links.length > 3 && (
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
                                    <div className="text-sm text-slate-400 mb-4 sm:mb-0">
                                        Showing <span className="font-medium">{news.from || 0}</span> to <span className="font-medium">{news.to || 0}</span> of <span className="font-medium">{news.total}</span> results
                                    </div>
                                    <div className="flex space-x-1">
                                        {news.links.map((link, idx) => (
                                            <Link
                                                key={idx}
                                                href={link.url || '#'}
                                                className={`px-3 py-1 rounded-md text-sm font-medium ${
                                                    link.active
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-slate-300 hover:bg-slate-700'
                                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
