import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

export default function WritersIndex({ writers }) {
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState({});

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        
        // Set initial value
        handleResize();
        
        // Add event listener
        window.addEventListener('resize', handleResize);
        
        // Clean up
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleMobileMenu = (writerId) => {
        setMobileMenuOpen(prev => ({
            ...prev,
            [writerId]: !prev[writerId]
        }));
    };
    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">Writers Management</h2>
            }
        >
            <Head title="Writers Management" />

            <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-end mb-6">
                    <Link
                        href={route('admin.writers.create')}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg text-sm flex items-center transition-colors duration-200 border border-blue-500 hover:border-blue-400"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add User
                    </Link>
                </div>
                
                {/* Mobile Header */}
                <div className="lg:hidden mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Writers</h2>
                </div>

                <div className="bg-slate-800/60 backdrop-blur-md rounded-lg shadow overflow-hidden border border-slate-700/50">
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700/60">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        News Count
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Specialization
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {writers.map((writer) => (
                                    <tr key={writer.id} className="hover:bg-slate-700/30 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center">
                                                    <span className="text-white font-medium">
                                                        {writer.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-100">
                                                        {writer.name}
                                                    </div>
                                                    <div className="text-sm text-slate-300 lg:hidden">
                                                        {writer.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 hidden lg:table-cell">
                                            {writer.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                                                writer.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                writer.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                                                writer.role === 'writer' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {writer.role.charAt(0).toUpperCase() + writer.role.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {writer.news_count || 0} {writer.news_count === 1 ? 'article' : 'articles'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-slate-700/50 text-slate-200 border border-slate-600/50">
                                                {writer.writer_profile?.specialization || 'Not specified'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 hidden md:table-cell">
                                            {formatDate(writer.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <Link
                                                    href={route('admin.writers.edit', writer.id)}
                                                    className="text-blue-400 hover:text-blue-200 transition-colors duration-200"
                                                    title="Edit"
                                                >
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>
                                                <Link
                                                    href={route('admin.writers.show', writer.id)}
                                                    className="text-green-400 hover:text-green-200 transition-colors duration-200"
                                                    title="View"
                                                >
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Link>
                                                <Link
                                                    href={route('admin.writers.destroy', writer.id)}
                                                    method="delete"
                                                    as="button"
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                    onClick={(e) => {
                                                        if (!confirm('Are you sure you want to delete this writer?')) {
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

                    {/* Mobile List */}
                    <div className="lg:hidden divide-y divide-slate-700">
                        {writers.map((writer) => (
                            <div key={writer.id} className="p-4 hover:bg-slate-700/30 transition-colors duration-150">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-12 w-12 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center">
                                            <span className="text-white font-medium text-lg">
                                                {writer.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-100">{writer.name}</div>
                                            <div className="text-sm text-slate-300">{writer.email}</div>
                                            <div className="text-xs mt-1">
                                                <span className={`px-2 py-0.5 inline-flex rounded-full ${
                                                    writer.role === 'admin' ? 'bg-purple-900/30 text-purple-300 border border-purple-700/50' :
                                                    writer.role === 'editor' ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50' :
                                                    writer.role === 'writer' ? 'bg-green-900/30 text-green-300 border border-green-700/50' :
                                                    'bg-gray-900/30 text-gray-300 border border-gray-700/50'
                                                }`}>
                                                    {writer.role.charAt(0).toUpperCase() + writer.role.slice(1)}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {writer.writer_profile?.specialization && (
                                                    <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-slate-700/50 text-slate-200 border border-slate-600/50">
                                                        {writer.writer_profile.specialization}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Link
                                            href={route('admin.writers.show', writer.id)}
                                            className="p-1.5 text-blue-400 hover:text-blue-200 hover:bg-slate-700/50 rounded transition-colors"
                                            title="View Profile"
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </Link>
                                        <Link
                                            href={route('admin.writers.edit', writer.id)}
                                            className="p-1.5 text-yellow-400 hover:text-yellow-200 hover:bg-slate-700/50 rounded transition-colors"
                                            title="Edit Writer"
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </Link>
                                        <Link
                                            href={route('admin.writers.destroy', writer.id)}
                                            method="delete"
                                            as="button"
                                            className="p-1.5 text-red-400 hover:text-red-200 hover:bg-slate-700/50 rounded transition-colors"
                                            title="Delete Writer"
                                            onClick={(e) => {
                                                if (!confirm('Are you sure you want to delete this writer? This action cannot be undone.')) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                                
                                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {writer.news_count || 0} {writer.news_count === 1 ? 'article' : 'articles'}
                                    </span>
                                    {writer.writer_profile?.specialization && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            {writer.writer_profile.specialization}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="mt-2 text-xs text-gray-500">
                                    Joined {formatDate(writer.created_at)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Empty State */}
                {writers.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No writers</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by adding a new writer.</p>
                        <div className="mt-6">
                            <Link
                                href={route('admin.writers.create')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                New Writer
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
