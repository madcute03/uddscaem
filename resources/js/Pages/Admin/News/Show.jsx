import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function NewsShow({ news }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        News Details
                    </h2>
                    
                </div>
            }
        >
            <Head title={`${news.title} - News`} />

            <div className="py-6 sm:py-8 lg:py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{news.title}</h1>
                                    <div className="flex items-center mt-2 text-sm text-gray-500">
                                        <span>By {news.writer?.name || news.writer_name}</span>
                                        <span className="mx-2">•</span>
                                        <span>{new Date(news.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</span>
                                        <span className="mx-2">•</span>
                                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                            {news.category}
                                        </span>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                    news.status === 'active' ? 'bg-green-100 text-green-800' :
                                    news.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {news.status.charAt(0).toUpperCase() + news.status.slice(1)}
                                </span>
                            </div>

                            {news.image && (
                                <div className="mb-6">
                                    <img 
                                        src={`/storage/${news.image}`} 
                                        alt={news.title}
                                        className="w-full h-auto rounded-lg shadow-md"
                                    />
                                </div>
                            )}

                            <div className="prose max-w-none">
                                <p className="whitespace-pre-line text-gray-700">
                                    {news.description}
                                </p>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                    <span>Views: {news.count || 0}</span>
                                </div>
                                <div className="flex space-x-3">
                                    <Link
                                        href={route('admin.news.edit', news.id)}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        Edit
                                    </Link>
                                    <Link
                                        href={route('admin.news.index')}
                                        className="inline-flex items-center px-4 py-2 bg-gray-200 border border-transparent rounded-md font-semibold text-xs text-gray-800 uppercase tracking-widest hover:bg-gray-300 focus:bg-gray-300 active:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        Back to List
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
