import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function NewsShow({ news, relatedNews }) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            <Head title={news.title} />

            {/* Header */}
            <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    <div className="text-center">
                        <Link
                            href={route('news.index')}
                            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4 md:mb-6 transition-colors text-sm md:text-base"
                        >
                            <svg className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to News
                        </Link>
                        
                        <div className="mb-3 md:mb-4">
                            <span className="bg-blue-600/30 text-blue-300 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium border border-blue-500/30">
                                {news.category}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 px-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                            {news.title}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs sm:text-sm text-slate-400">
                            <span>By <span className="text-blue-300">{news.writer_name}</span></span>
                            <span className="hidden sm:inline">•</span>
                            <span>{new Date(news.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: isMobile ? 'short' : 'long', 
                                day: 'numeric' 
                            })}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{news.count} {isMobile ? 'views' : 'views'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <article className="bg-slate-800/60 rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden backdrop-blur-sm">
                            <div className="overflow-hidden">
                                <img
                                    src={`/storage/${news.image}`}
                                    alt={news.title}
                                    className="w-full h-auto max-h-[400px] sm:max-h-[500px] object-cover transition-transform duration-500 hover:scale-105"
                                    loading="lazy"
                                />
                            </div>

                            <div className="p-4 sm:p-6 md:p-8">
                                <div className="prose prose-sm sm:prose-base prose-invert max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-slate-100 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-slate-500 prose-img:rounded-lg prose-img:border prose-img:border-slate-700/50">
                                    <div dangerouslySetInnerHTML={{ __html: news.description }} />
                                </div>
                            </div>
                            
                            {/* Social Sharing Buttons */}
                            <div className="px-4 sm:px-6 md:px-8 pb-6 md:pb-8">
                                <div className="flex flex-wrap gap-3">
                                    <span className="text-sm text-slate-400 flex items-center mr-2">Share:</span>
                                    {['twitter', 'facebook', 'linkedin', 'whatsapp'].map((platform) => (
                                        <button 
                                            key={platform}
                                            className="w-9 h-9 rounded-full bg-slate-700/50 hover:bg-slate-700/80 flex items-center justify-center transition-colors"
                                            aria-label={`Share on ${platform}`}
                                        >
                                            <span className="sr-only">Share on {platform}</span>
                                            <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                                                {/* Add your social media icons here */}
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </article>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Table of Contents - Only show if content has headings */}
                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6 shadow-xl sticky top-6">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-4 pb-2 border-b border-slate-700/50 flex items-center">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                Table of Contents
                            </h3>
                            <nav className="space-y-2 text-sm sm:text-base">
                                {/* This would be dynamically generated from the article headings */}
                                <a href="#section1" className="block text-blue-400 hover:text-blue-300 py-1.5 transition-colors">Introduction</a>
                                <a href="#section2" className="block text-blue-400 hover:text-blue-300 py-1.5 transition-colors">Key Points</a>
                                <a href="#section3" className="block text-blue-400 hover:text-blue-300 py-1.5 transition-colors">Conclusion</a>
                            </nav>
                        </div>

                        {/* Related News */}
                        {relatedNews.length > 0 && (
                            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6 shadow-xl">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-4 sm:mb-6 pb-2 sm:pb-3 border-b border-slate-700/50 flex items-center">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                    </svg>
                                    Related Articles
                                </h3>
                                <div className="space-y-3 sm:space-y-4">
                                    {relatedNews.slice(0, isMobile ? 3 : 5).map((article) => (
                                        <div key={article.id} className="group">
                                            <Link 
                                                href={route('news.show', article.slug)}
                                                className="block hover:bg-slate-700/30 p-2 sm:p-3 rounded-lg transition-colors duration-200"
                                            >
                                                <div className="flex items-start space-x-3 sm:space-x-4">
                                                    <div className="flex-shrink-0 w-16 h-14 sm:w-20 sm:h-16 overflow-hidden rounded-lg">
                                                        <img
                                                            src={`/storage/${article.image}`}
                                                            alt={article.title}
                                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm sm:text-base font-medium text-slate-100 group-hover:text-blue-300 line-clamp-2 transition-colors">
                                                            {article.title}
                                                        </h4>
                                                        <div className="flex items-center mt-1 text-xs text-slate-400">
                                                            <span>{new Date(article.date).toLocaleDateString('en-US', { 
                                                                month: 'short', 
                                                                day: 'numeric' 
                                                            })}</span>
                                                            <span className="mx-1.5">•</span>
                                                            <span>{article.count} views</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Share Buttons */}
                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-xl">
                            <h3 className="text-lg font-semibold text-slate-100 mb-4">Share this article</h3>
                            <div className="flex space-x-3">
                                <a 
                                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(news.title)}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-slate-700/50 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 flex items-center justify-center transition-colors border border-slate-700/50"
                                    aria-label="Share on Twitter"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                                    </svg>
                                </a>
                                <a 
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-slate-700/50 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 flex items-center justify-center transition-colors border border-slate-700/50"
                                    aria-label="Share on Facebook"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                                    </svg>
                                </a>
                                <a 
                                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(news.title)}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-slate-700/50 hover:bg-blue-700/20 text-blue-400 hover:text-blue-300 flex items-center justify-center transition-colors border border-slate-700/50"
                                    aria-label="Share on LinkedIn"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                    </svg>
                                </a>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert('Link copied to clipboard!');
                                    }}
                                    className="w-10 h-10 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700/50"
                                    aria-label="Copy link"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
