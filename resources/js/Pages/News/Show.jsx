import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
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

    // Share functionality
    const handleShare = (platform) => {
        const url = window.location.href;
        const title = news.title;
        const description = news.description ? news.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : title;

        let shareUrl = '';

        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
                break;
            default:
                // Copy to clipboard as fallback
                navigator.clipboard.writeText(url);
                // You could add a toast notification here
                return;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    };

    return (
        <PublicLayout>
            <style jsx global>{`
                /* Ensure ReactQuill content displays properly */
                .ql-editor {
                    padding: 0 !important;
                }

                .ql-editor h1,
                .ql-editor h2,
                .ql-editor h3,
                .ql-editor h4,
                .ql-editor h5,
                .ql-editor h6 {
                    color: #f1f5f9 !important;
                    font-weight: 600 !important;
                    margin-top: 1.5em !important;
                    margin-bottom: 0.5em !important;
                    line-height: 1.3 !important;
                }

                .ql-editor h1 { font-size: 2em !important; }
                .ql-editor h2 { font-size: 1.5em !important; }
                .ql-editor h3 { font-size: 1.25em !important; }
                .ql-editor h4 { font-size: 1.1em !important; }
                .ql-editor h5 { font-size: 1em !important; }
                .ql-editor h6 { font-size: 0.9em !important; }

                .ql-editor p {
                    color: #cbd5e1 !important;
                    margin-bottom: 1em !important;
                    line-height: 1.7 !important;
                }

                .ql-editor strong, .ql-editor b {
                    color: #f1f5f9 !important;
                    font-weight: 600 !important;
                }

                .ql-editor em, .ql-editor i {
                    color: #cbd5e1 !important;
                    font-style: italic !important;
                }

                .ql-editor u {
                    color: #cbd5e1 !important;
                    text-decoration: underline !important;
                }

                .ql-editor a {
                    color: #60a5fa !important;
                    text-decoration: none !important;
                    transition: color 0.2s ease !important;
                }

                .ql-editor a:hover {
                    color: #93c5fd !important;
                    text-decoration: underline !important;
                }

                .ql-editor ul, .ql-editor ol {
                    color: #cbd5e1 !important;
                    padding-left: 1.5em !important;
                    margin-bottom: 1em !important;
                }

                .ql-editor li {
                    color: #cbd5e1 !important;
                    margin-bottom: 0.25em !important;
                }

                .ql-editor blockquote {
                    border-left: 4px solid #3b82f6 !important;
                    padding-left: 1em !important;
                    margin: 1.5em 0 !important;
                    color: #94a3b8 !important;
                    font-style: italic !important;
                }

                .ql-editor code {
                    background-color: #1e293b !important;
                    color: #f1f5f9 !important;
                    padding: 0.2em 0.4em !important;
                    border-radius: 0.25em !important;
                    font-size: 0.9em !important;
                }

                .ql-editor pre {
                    background-color: #1e293b !important;
                    color: #f1f5f9 !important;
                    padding: 1em !important;
                    border-radius: 0.5em !important;
                    overflow-x: auto !important;
                    margin: 1em 0 !important;
                }

                .ql-editor img {
                    border-radius: 0.5em !important;
                    border: 1px solid #475569 !important;
                    margin: 1em 0 !important;
                    max-width: 100% !important;
                    height: auto !important;
                }

                .ql-editor table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    margin: 1em 0 !important;
                }

                .ql-editor th, .ql-editor td {
                    border: 1px solid #475569 !important;
                    padding: 0.5em 1em !important;
                    text-align: left !important;
                }

                .ql-editor th {
                    background-color: #1e293b !important;
                    color: #f1f5f9 !important;
                    font-weight: 600 !important;
                }

                .ql-editor td {
                    color: #cbd5e1 !important;
                }
            `}</style>

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
                                        {/* ReactQuill content styling */}
                                        <style jsx>{`
                                            .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
                                                color: #f1f5f9 !important;
                                                font-weight: 600 !important;
                                                margin-top: 1.5em !important;
                                                margin-bottom: 0.5em !important;
                                                line-height: 1.3 !important;
                                            }

                                            .prose h1 { font-size: 2em !important; }
                                            .prose h2 { font-size: 1.5em !important; }
                                            .prose h3 { font-size: 1.25em !important; }
                                            .prose h4 { font-size: 1.1em !important; }
                                            .prose h5 { font-size: 1em !important; }
                                            .prose h6 { font-size: 0.9em !important; }

                                            .prose p {
                                                color: #cbd5e1 !important;
                                                margin-bottom: 1em !important;
                                                line-height: 1.7 !important;
                                            }

                                            .prose strong, .prose b {
                                                color: #f1f5f9 !important;
                                                font-weight: 600 !important;
                                            }

                                            .prose em, .prose i {
                                                color: #cbd5e1 !important;
                                                font-style: italic !important;
                                            }

                                            .prose u {
                                                color: #cbd5e1 !important;
                                                text-decoration: underline !important;
                                            }

                                            .prose a {
                                                color: #60a5fa !important;
                                                text-decoration: none !important;
                                                transition: color 0.2s ease !important;
                                            }

                                            .prose a:hover {
                                                color: #93c5fd !important;
                                                text-decoration: underline !important;
                                            }

                                            .prose ul, .prose ol {
                                                color: #cbd5e1 !important;
                                                padding-left: 1.5em !important;
                                                margin-bottom: 1em !important;
                                            }

                                            .prose li {
                                                color: #cbd5e1 !important;
                                                margin-bottom: 0.25em !important;
                                            }

                                            .prose blockquote {
                                                border-left: 4px solid #3b82f6 !important;
                                                padding-left: 1em !important;
                                                margin: 1.5em 0 !important;
                                                color: #94a3b8 !important;
                                                font-style: italic !important;
                                            }

                                            .prose code {
                                                background-color: #1e293b !important;
                                                color: #f1f5f9 !important;
                                                padding: 0.2em 0.4em !important;
                                                border-radius: 0.25em !important;
                                                font-size: 0.9em !important;
                                            }

                                            .prose pre {
                                                background-color: #1e293b !important;
                                                color: #f1f5f9 !important;
                                                padding: 1em !important;
                                                border-radius: 0.5em !important;
                                                overflow-x: auto !important;
                                                margin: 1em 0 !important;
                                            }

                                            .prose img {
                                                border-radius: 0.5em !important;
                                                border: 1px solid #475569 !important;
                                                margin: 1em 0 !important;
                                                max-width: 100% !important;
                                                height: auto !important;
                                            }

                                            .prose table {
                                                width: 100% !important;
                                                border-collapse: collapse !important;
                                                margin: 1em 0 !important;
                                            }

                                            .prose th, .prose td {
                                                border: 1px solid #475569 !important;
                                                padding: 0.5em 1em !important;
                                                text-align: left !important;
                                            }

                                            .prose th {
                                                background-color: #1e293b !important;
                                                color: #f1f5f9 !important;
                                                font-weight: 600 !important;
                                            }

                                            .prose td {
                                                color: #cbd5e1 !important;
                                            }
                                        `}</style>
                                        <div dangerouslySetInnerHTML={{ __html: news.description }} />
                                    </div>
                                </div>

                                {/* Social Sharing Buttons */}
                                <div className="px-4 sm:px-6 md:px-8 pb-6 md:pb-8">
                                    <div className="flex flex-wrap gap-3">
                                        <span className="text-sm text-slate-400 flex items-center mr-2">Share:</span>
                                        {[
                                            { 
                                                name: 'twitter',
                                                path: 'M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.5 2.96,10.3 2.38,10C2.38,10 2.38,10 2.38,10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.19,14.4 4.62,14.4 4,14.31C4.32,15.19 4.97,15.88 5.79,16.18C4.66,16.85 3.32,17.23 1.88,17.23C1.53,17.23 1.19,17.22 0.85,17.16C1.7,17.85 2.76,18.27 3.92,18.27C8.1,18.27 10.68,14.59 10.68,11.5C10.68,11.4 10.68,11.29 10.67,11.19C11.5,10.6 12.2,9.86 12.72,9' 
                                            },
                                            { 
                                                name: 'facebook',
                                                path: 'M18.77,7.46H14.5v-1.9c0-0.8,0.43-1.56,1.5-1.56h1.27V0.56c-0.22-0.03-0.98-0.09-1.86-0.09c-1.85,0-3.11,1.12-3.11,3.19v1.7h-2.5v3.2h2.5v8.53h3.16v-8.53h2.22L18.77,7.46z'
                                            },
                                            { 
                                                name: 'linkedin',
                                                path: 'M20.45,20.45h-3.56v-5.57c0-1.33-0.02-3.03-1.84-3.03c-1.85,0-2.13,1.44-2.13,2.94v5.66H9.35V9h3.42v1.56h0.05c0.47-0.9,1.64-1.84,3.37-1.84c3.61,0,4.27,2.38,4.27,5.47V20.45z M5.34,7.43c-1.15,0-2.08-0.94-2.08-2.08c0-1.15,0.93-2.08,2.08-2.08c1.15,0,2.08,0.93,2.08,2.08C7.42,6.5,6.49,7.43,5.34,7.43z M7.12,20.45H3.56V9h3.56V20.45z M22.23,0H1.77C0.79,0,0,0.78,0,1.75v20.5C0,23.22,0.79,24,1.77,24h20.46c0.98,0,1.77-0.78,1.77-1.75V1.75C24,0.78,23.21,0,22.23,0z'
                                            },
                                            { 
                                                name: 'whatsapp',
                                                path: 'M17.5,14.4c-0.2-0.1-1.2-0.6-1.4-0.6c-0.2,0-0.4,0.1-0.5,0.3c-0.1,0.2-0.4,0.6-0.5,0.7c-0.1,0.1-0.2,0.1-0.4,0c-0.2-0.1-0.7-0.3-1.4-0.9c-0.5-0.5-0.9-1-1-1.2c-0.1-0.2,0-0.3,0.1-0.4c0.1-0.1,0.2-0.2,0.3-0.3c0.1-0.1,0.2-0.2,0.3-0.3c0.1-0.1,0.1-0.2,0.2-0.3c0.1-0.1,0-0.3,0-0.3c0-0.1-0.5-1.3-0.7-1.8c-0.2-0.5-0.4-0.4-0.5-0.4c-0.1,0-0.3,0-0.5,0c-0.2,0-0.5,0.1-0.8,0.3c-0.3,0.2-1,1-1,2.4c0,1.3,1,2.8,1.1,3c0.1,0.2,1.8,2.7,4.4,3.8c0.6,0.3,1.1,0.5,1.5,0.6c0.6,0.2,1.2,0.2,1.6,0.1c0.5-0.1,1.4-0.6,1.6-1.1c0.2-0.5,0.2-1,0.1-1.1C17.8,14.5,17.7,14.4,17.5,14.4z M12,0C5.4,0,0,5.4,0,12s5.4,12,12,12s12-5.4,12-12S18.6,0,12,0z M12,22.5c-5.8,0-10.5-4.7-10.5-10.5S6.2,1.5,12,1.5S22.5,6.2,22.5,12S17.8,22.5,12,22.5z'
                                            },
                                            {
                                                name: 'copy',
                                                path: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                                            }
                                        ].map(({ name, path }) => (
                                            <button
                                                key={name}
                                                onClick={() => handleShare(name)}
                                                className="w-9 h-9 rounded-full bg-slate-700/50 hover:bg-slate-700/80 flex items-center justify-center transition-colors"
                                                aria-label={`Share on ${name === 'copy' ? 'Copy link' : name}`}
                                                title={name === 'copy' ? 'Copy link to clipboard' : `Share on ${name}`}
                                            >
                                                <span className="sr-only">{name === 'copy' ? 'Copy link' : `Share on ${name}`}</span>
                                                <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d={path} />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </article>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Related News */}
                            {relatedNews.length > 0 && (
                                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6 shadow-xl">
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-4 sm:mb-6 pb-2 sm:pb-3 border-b border-slate-700/50 flex items-center">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                        </svg>
                                        Related News
                                    </h3>
                                    <div className="space-y-5 sm:space-y-6">
                                        {relatedNews.slice(0, isMobile ? 3 : 4).map((article) => (
                                            <div key={article.id} className="group">
                                                <Link
                                                    href={route('news.show', article.slug)}
                                                    className="block hover:bg-slate-700/40 p-4 sm:p-5 rounded-2xl transition-all duration-300 hover:shadow-xl border border-slate-700/50 hover:border-slate-600/50"
                                                >
                                                    <div className="flex items-start space-x-5">
                                                        <div className="flex-shrink-0 w-32 h-28 sm:w-36 sm:h-32 overflow-hidden rounded-xl shadow-lg">
                                                            <img
                                                                src={`/storage/${article.image}`}
                                                                alt={article.title}
                                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0 pt-1">
                                                            <h4 className="text-base sm:text-lg lg:text-xl font-medium text-slate-100 group-hover:text-blue-300 line-clamp-3 transition-colors mb-2">
                                                                {article.title}
                                                            </h4>
                                                            <div className="flex items-center text-sm sm:text-base text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full w-fit">
                                                                <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                <span>{new Date(article.date).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
