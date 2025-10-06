import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function NewsIndex({ news }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const categories = [...new Set(news.data.map(article => article.category))];

    const filteredNews = news.data.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (article.description && article.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = !selectedCategory || article.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Format date to be more readable
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            <Head title="News" />

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                            Latest News & Updates
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Stay informed with our latest articles, updates, and insights from our team of experts.
                        </p>
                        
                        {/* Search and Filter */}
                        <div className="mt-10 max-w-2xl mx-auto">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 bg-slate-800/60 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="h-full bg-slate-800/60 border-l border-slate-700 pl-3 pr-8 py-2 text-sm text-slate-300 rounded-r-lg focus:outline-none focus:ring-0 focus:border-blue-500"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* News Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {filteredNews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredNews.map((article) => (
                            <article 
                                key={article.id} 
                                className="group bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="relative overflow-hidden">
                                    <div className="aspect-w-16 aspect-h-9 w-full">
                                        <img
                                            src={`/storage/${article.image}`}
                                            alt={article.title}
                                            className="w-full h-56 object-cover transform transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-blue-600/80 text-blue-100 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                                            {article.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center text-xs text-slate-400 mb-3">
                                        <span>By <span className="text-blue-300">{article.writer_name}</span></span>
                                        <span className="mx-2">•</span>
                                        <span>{formatDate(article.date)}</span>
                                    </div>

                                    <h2 className="text-xl font-bold text-slate-100 mb-3 line-clamp-2 group-hover:text-blue-300 transition-colors">
                                        <Link href={route('news.show', article.slug)} className="hover:underline">
                                            {article.title}
                                        </Link>
                                    </h2>

                                    {article.description && (
                                        <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                                            {article.description.replace(/<[^>]*>?/gm, '')}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
                                        <div className="flex items-center text-sm text-slate-500">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <span>{article.count} views</span>
                                        </div>
                                        <Link
                                            href={route('news.show', article.slug)}
                                            className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors group-hover:translate-x-1 duration-200"
                                        >
                                            Read more
                                            <svg className="w-4 h-4 ml-1 transform transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-700/50">
                        <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-slate-300">No articles found</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {searchTerm || selectedCategory 
                                ? 'Try adjusting your search or filter to find what you\'re looking for.'
                                : 'There are no articles available at the moment. Please check back later.'}
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('');
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Clear filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {news.links && news.links.length > 3 && (
                    <div className="mt-16 flex justify-center">
                        <nav className="flex items-center space-x-1">
                            {news.links.map((link, index) => (
                                <span key={index}>
                                    {link.url ? (
                                        <Link
                                            href={link.url}
                                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                                link.active
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
                                            } transition-colors`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span 
                                            className="px-3 py-2 text-slate-600 cursor-not-allowed"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )}
                                </span>
                            ))}
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
}
