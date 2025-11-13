import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function RequirementsIndex({ requirements }) {
    return (
        <PublicLayout>
            <Head title="Requirements" />
            
            <div className="max-w-5xl mx-auto py-12 px-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-xl p-6">
                    <h1 className="text-3xl font-bold mb-6 text-white">Event Requirements</h1>
                    <p className="text-slate-300 mb-8">
                        Download the required documents for event registration and participation.
                    </p>

                    {requirements.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-slate-400">No requirements available at the moment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {requirements.map((requirement) => (
                                <div
                                    key={requirement.id}
                                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0">
                                            <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-white mb-2">
                                                {requirement.title}
                                            </h3>
                                            {requirement.description && (
                                                <p className="text-sm text-slate-400 mb-4">
                                                    {requirement.description}
                                                </p>
                                            )}
                                            <a
                                                href={`/storage/${requirement.file_path}`}
                                                download
                                                className="w-[131px] h-[40px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
