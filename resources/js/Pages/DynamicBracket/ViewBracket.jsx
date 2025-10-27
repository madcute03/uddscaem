import React, { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function ViewBracket({ event }) {
    const [generatedBracket, setGeneratedBracket] = useState(null);
    const [tournamentName, setTournamentName] = useState('');
    const [bracketType, setBracketType] = useState('');
    const [eventId, setEventId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Load bracket data from session storage
    useEffect(() => {
        const storedData = sessionStorage.getItem('generatedBracket');
        if (storedData) {
            const data = JSON.parse(storedData);
            setGeneratedBracket(data.bracket);
            setTournamentName(data.tournamentName);
            setBracketType(data.bracketType);
            setEventId(data.eventId);
        } else {
            // If no data, redirect back
            router.visit(route('events.dynamicBracket', { event: event.id }));
        }
    }, []);

    // Save bracket to database
    const saveBracket = async () => {
        if (!generatedBracket) {
            alert('No bracket data to save.');
            return;
        }

        if (!tournamentName.trim()) {
            alert('Please provide a tournament name.');
            return;
        }

        setIsSaving(true);

        try {
            const response = await axios.post('/api/bracket/store', {
                event_id: eventId,
                tournament_name: tournamentName,
                bracket_type: bracketType,
                teams: generatedBracket.teams,
                matches: generatedBracket.matches,
                total_rounds: generatedBracket.total_rounds
            });

            if (response.data.success) {
                setShowSuccess(true);
                // Clear session storage
                sessionStorage.removeItem('generatedBracket');
            }
        } catch (error) {
            console.error('Error saving bracket:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            alert('Failed to save bracket: ' + errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    if (!generatedBracket) {
        return (
            <AuthenticatedLayout>
                <Head title="Loading..." />
                <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
                    <div className="text-white">Loading bracket...</div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Bracket Preview - ${event?.title}`} />
            
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link 
                            href={route('events.dynamicBracket', { event: event.id })}
                            className="inline-flex items-center text-slate-300 hover:text-white mb-4 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Team Setup
                        </Link>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Bracket Preview</h1>
                                <p className="text-gray-400">{event?.title}</p>
                            </div>
                            
                            {!showSuccess && (
                                <button
                                    onClick={saveBracket}
                                    disabled={isSaving}
                                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center font-semibold"
                                >
                                    {isSaving ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                            </svg>
                                            Save Bracket
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Success Message */}
                    {showSuccess && (
                        <div className="mb-6 bg-green-900/50 border border-green-700 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <svg className="w-8 h-8 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h3 className="text-green-100 font-semibold text-lg">Bracket Saved Successfully!</h3>
                                    <p className="text-green-200 text-sm">Your tournament bracket has been saved to the database.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Link
                                    href={route('events.manageBracket', event.id)}
                                    className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-semibold"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Manage Bracket & Scoring
                                </Link>
                                <Link
                                    href={route('events.show', event.id)}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                >
                                    View Event Page
                                </Link>
                                <Link
                                    href={route('bracket')}
                                    className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                >
                                    Back to Bracket Management
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Bracket Display */}
                    <div className="space-y-6">
                        {/* Tournament Info */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <h3 className="text-white font-semibold text-lg mb-4">Tournament Information</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400">Tournament Name</p>
                                    <p className="text-white font-medium">{tournamentName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Type</p>
                                    <p className="text-white font-medium capitalize">{bracketType === 'single' ? 'Single Elimination' : bracketType === 'double' ? 'Double Elimination' : 'Round Robin'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Teams</p>
                                    <p className="text-white font-medium">{generatedBracket.teams?.length || 0}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Total Matches</p>
                                    <p className="text-white font-medium">{generatedBracket.matches?.length || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Competing Teams */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <h3 className="text-white font-semibold text-lg mb-4">Competing Teams</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {generatedBracket.teams?.map((team, idx) => (
                                    <div key={idx} className="bg-gray-700/50 rounded-lg px-4 py-3 border border-gray-600">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white font-medium">{team.name}</span>
                                            {team.seed && <span className="text-gray-400 text-sm">#{team.seed}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Visual Bracket Structure */}
                        {bracketType !== 'round-robin' && generatedBracket.matches && (
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                <h3 className="text-white font-semibold text-lg mb-4">Bracket Structure</h3>
                                <div className="overflow-x-auto pb-4">
                                    <div className="flex gap-12 min-w-max">
                                        {Array.from(new Set(generatedBracket.matches.map(m => m.round))).map(round => (
                                            <div key={round} className="flex flex-col justify-around min-h-[400px]">
                                                <div className="text-sm text-gray-300 font-semibold mb-4 text-center bg-gray-700/50 rounded-lg py-2 px-4">
                                                    {round === generatedBracket.total_rounds ? '🏆 Final' : `Round ${round}`}
                                                </div>
                                                <div className="space-y-6">
                                                    {generatedBracket.matches
                                                        .filter(m => m.round === round)
                                                        .map((match, idx) => (
                                                            <div key={idx} className="bg-gray-700/50 rounded-lg p-3 w-48 border border-gray-600 hover:border-blue-500 transition-colors">
                                                                <div className="text-xs text-gray-400 mb-2 font-medium">Match {match.match_number}</div>
                                                                <div className="space-y-2">
                                                                    <div className="px-3 py-2 rounded text-sm font-medium bg-gray-800 text-white border border-gray-600">
                                                                        {match.team1_name || 'TBD'}
                                                                    </div>
                                                                    <div className="text-center text-gray-500 text-xs">vs</div>
                                                                    <div className="px-3 py-2 rounded text-sm font-medium bg-gray-800 text-white border border-gray-600">
                                                                        {match.team2_name || 'TBD'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Round Robin Matches */}
                        {bracketType === 'round-robin' && generatedBracket.matches && (
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                                <h3 className="text-white font-semibold text-lg mb-4">All Matches</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {generatedBracket.matches.map((match, idx) => (
                                        <div key={idx} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                                            <div className="text-xs text-gray-400 mb-2">Match {idx + 1}</div>
                                            <div className="flex items-center justify-between text-white">
                                                <span className="font-medium">{match.team1_name}</span>
                                                <span className="text-gray-500 mx-3">vs</span>
                                                <span className="font-medium">{match.team2_name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
