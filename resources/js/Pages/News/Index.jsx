import { Head, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

export default function NewsIndex({ news }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [expandedCards, setExpandedCards] = useState({});
    const contentRefs = useRef({});

    // Check if mobile on component mount and window resize
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        // Initial check
        checkIfMobile();
        
        // Add event listener for window resize
        window.addEventListener('resize', checkIfMobile);
        
        // Cleanup
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                            Latest News & Updates
                        </h1>
                        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto px-2">
                            Stay informed with our latest articles, updates, and insights from our team of experts.
                        </p>
                        
                        {/* Search and Filter - Stacked on mobile, side by side on larger screens */}
                        <div className="mt-8 max-w-2xl mx-auto px-2">
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <div className="relative flex-grow">
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
                                </div>
                                <div className="w-full sm:w-auto">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full h-12 px-4 py-2 bg-slate-800/60 border border-slate-700 text-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
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
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
                {filteredNews.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {filteredNews.map((article) => (
                            <article 
                                key={article.id}
                                className="h-full flex flex-col bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <Link href={route('news.show', article.slug)} className="block group">
                                    <div className="relative overflow-hidden flex-shrink-0">
                                        <div className="aspect-w-16 aspect-h-9 w-full">
                                            <img
                                                src={`/storage/${article.image}`}
                                                alt={article.title}
                                                className="w-full h-48 sm:h-56 object-cover transform transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="absolute top-3 left-3">
                                            <span className="bg-blue-600/80 text-blue-100 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                                                {article.category}
                                            </span>
                                        </div>
                                    </div>
                                </Link>

                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-center text-xs text-slate-400 mb-3">
                                        <span>By <span className="text-blue-300">{article.writer_name}</span></span>
                                        <span className="mx-2">•</span>
                                        <span>{formatDate(article.date)}</span>
                                    </div>

                                    <Link href={route('news.show', article.slug)} className="group">
                                        <h2 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                                            {article.title}
                                        </h2>
                                    </Link>
                                    
                                    <div className="relative">
                                        <div 
                                            ref={el => contentRefs.current[article.id] = el}
                                            className={`text-slate-400 text-sm mb-4 overflow-hidden transition-all duration-300 ${
                                                expandedCards[article.id] ? 'max-h-full' : 'max-h-[4.5rem]'
                                            }`}
                                        >
                                            <div dangerouslySetInnerHTML={{ 
                                                __html: article.description 
                                                    .replace(/<img[^>]+src=["']data:image\/[^;]+;base64[^"']+["'][^>]*>/g, '') 
                                            }} />
                                        </div>
                                        
                                        {(!expandedCards[article.id] && contentRefs.current[article.id]?.scrollHeight > 100) && (
                                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900 to-transparent flex items-end justify-center pb-1">
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setExpandedCards(prev => ({
                                                            ...prev,
                                                            [article.id]: true
                                                        }));
                                                    }}
                                                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                                >
                                                    Read More
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-auto pt-3 border-t border-slate-700/50 flex items-center justify-between text-sm text-slate-500">
                                        <span className="text-xs sm:text-sm">{article.views || 0} views</span>
                                        <Link 
                                            href={route('news.show', article.slug)}
                                            className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                                        >
                                            Read full article →
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 px-4">
                        <svg
                            className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <h3 className="mt-3 text-base sm:text-lg font-medium text-slate-200">No articles found</h3>
                        <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
                            {searchTerm || selectedCategory
                                ? 'Try adjusting your search or filter to find what you\'re looking for.'
                                : 'There are no news articles available at the moment. Please check back later.'}
                        </p>
                        {(searchTerm || selectedCategory) && (
                            <div className="mt-4">
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('');
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
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
