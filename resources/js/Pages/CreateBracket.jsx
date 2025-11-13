import React from "react";
import { Link, Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function CreateBracket({ events = [] }) {

    // Only show events that allow bracketing
    const visibleEvents = (events || []).filter((e) => e?.allow_bracketing);

    return (
        <AuthenticatedLayout>
            <Head title="Bracket Management" />
            <div className="py-12 px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Link 
                        href={route('dashboard')}
                        className="inline-flex items-center text-slate-300 hover:text-white mb-6 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Events
                    </Link>
                    
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Tournament Bracket Management</h1>
                        <p className="text-gray-400">Select an event to create or manage brackets</p>
                    </div>

                    {visibleEvents.length === 0 ? (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
                            <div className="text-gray-400 mb-4">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-white">No events available</h3>
                            <p className="mt-2 text-sm text-gray-400">
                                There are currently no events that allow bracket creation.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {visibleEvents.map((event) => (
                                <div key={event.id} className="bg-gray-800/50 border border-gray-700/70 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                                    <div className="flex items-center justify-center mb-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-white">{event.title}</h3>
                                    </div>
                                    <div className="flex flex-col space-y-3">
                                        {/* Manage Bracket Button (if tournament exists) */}
                                        {event.tournaments && event.tournaments.length > 0 ? (
                                            <Link
                                                href={route('events.manageBracket', { event: event.id })}
                                                className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200 font-medium"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Manage Bracket
                                            </Link>
                                        ) : (
                                            <Link
                                                href={route('events.dynamicBracket', { event: event.id })}
                                                className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 font-medium"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                Dynamic Bracketing
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
