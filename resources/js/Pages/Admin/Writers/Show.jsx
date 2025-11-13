import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';

export default function ShowWriter({ writer }) {
    return (
        <AuthenticatedLayout>
            <Head title={`Writer: ${writer.name}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                    <div className="flex justify-between items-center">
                        <Link
                            href={route('admin.writers.index')}
                            className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Writers
                        </Link>
                        <Link
                            href={route('admin.writers.edit', writer.id)}
                            className="w-[141px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                        >
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Writer
                        </Link>
                    </div>
                </div>
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-slate-900 overflow-hidden shadow-sm sm:rounded-lg border border-slate-700">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Left Column - Profile Info */}
                                <div className="md:col-span-1">
                                    <div className="flex flex-col items-center">
                                        <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-4">
                                            <span className="text-4xl text-slate-400">
                                                {writer.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-white">{writer.name}</h3>
                                        <p className="text-slate-400">{writer.email}</p>
                                        
                                        <div className="mt-4 w-full">
                                            <div className="flex items-center justify-between py-2 border-b border-slate-700">
                                                <span className="text-slate-400">Articles:</span>
                                                <span className="text-white">{writer.news_count || 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-slate-400">Member Since:</span>
                                                <span className="text-white">
                                                    {new Date(writer.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Bio and Specialization */}
                                <div className="md:col-span-2">
                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium text-white mb-2">About</h3>
                                        <div className="bg-slate-800 p-4 rounded-lg">
                                            {writer.writer_profile?.bio ? (
                                                <p className="text-slate-300 whitespace-pre-line">{writer.writer_profile.bio}</p>
                                            ) : (
                                                <p className="text-slate-500 italic">No bio available</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium text-white mb-2">Specialization</h3>
                                        <div className="bg-slate-800 p-4 rounded-lg">
                                            {writer.writer_profile?.specialization ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {writer.writer_profile.specialization.split(',').map((item, index) => (
                                                        <span 
                                                            key={index}
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                        >
                                                            {item.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-slate-500 italic">No specialization specified</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium text-white mb-2">Contact Information</h3>
                                        <div className="bg-slate-800 p-4 rounded-lg">
                                            <div className="space-y-2">
                                                <div className="flex items-center">
                                                    <svg className="h-5 w-5 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-slate-300">{writer.email}</span>
                                                </div>
                                                {writer.writer_profile?.phone && (
                                                    <div className="flex items-center">
                                                        <svg className="h-5 w-5 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        <span className="text-slate-300">{writer.writer_profile.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Articles Section */}
                            {writer.news && writer.news.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-lg font-medium text-white mb-4">Recent Articles</h3>
                                    <div className="bg-slate-800 rounded-lg p-4">
                                        <div className="space-y-4">
                                            {writer.news.slice(0, 5).map((article) => (
                                                <div key={article.id} className="border-b border-slate-700 pb-4 last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-medium text-blue-400 hover:text-blue-300">
                                                                <Link href={route('admin.news.edit', article.id)}>
                                                                    {article.title}
                                                                </Link>
                                                            </h4>
                                                            <p className="text-sm text-slate-400 mt-1">
                                                                {new Date(article.published_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            article.status === 'published' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {article.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {writer.news_count > 5 && (
                                            <div className="mt-4 text-center">
                                                <Link 
                                                    href={route('admin.news.index', { writer: writer.id })}
                                                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                                >
                                                    View all articles by {writer.name.split(' ')[0]} →
                                                </Link>
                                            </div>
                                        )}
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
