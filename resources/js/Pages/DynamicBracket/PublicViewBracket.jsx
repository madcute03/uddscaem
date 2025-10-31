import React, { useState, useEffect, useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";
import TreeBracket from "@/Components/TournamentBracket/TreeBracket";

export default function PublicViewBracket({ event, tournament }) {
    const [matches, setMatches] = useState([]);
    const [champion, setChampion] = useState(null);

    // Load tournament matches
    useEffect(() => {
        if (tournament && tournament.matches) {
            setMatches(tournament.matches);
            if (tournament.winner) {
                setChampion(tournament.winner.name);
            }
        }
    }, [tournament]);

    const isDoubleElim = tournament?.bracket_type === 'double';
    const teamCount = useMemo(() => {
        const uniqueTeams = new Set();
        matches.forEach(match => {
            if (match?.team1?.name) {
                uniqueTeams.add(match.team1.name);
            }
            if (match?.team2?.name) {
                uniqueTeams.add(match.team2.name);
            }
        });
        return uniqueTeams.size;
    }, [matches]);

    return (
        <PublicLayout>
            <Head title={`Tournament Bracket - ${event?.title}`} />

            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href={route('events.show', event.id)}
                            className="inline-flex items-center text-slate-300 hover:text-white mb-4 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Event
                        </Link>

                        <h1 className="text-3xl font-bold text-white mb-2">Tournament Bracket</h1>
                        <p className="text-gray-400">{tournament?.name}</p>
                        <div className="flex flex-wrap gap-3 items-center text-gray-500 text-sm">
                            <p className="capitalize">{tournament?.bracket_type} Elimination</p>
                            {teamCount > 0 && (
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-600 text-gray-300">
                                    <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="font-medium text-white">{teamCount}</span>
                                    <span>teams in bracket</span>
                                </span>
                            )}
                        </div>
                        
                        {/* Live Updates Badge */}
                        <div className="mt-3 inline-flex items-center px-3 py-1 bg-green-900/30 border border-green-700 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            <span className="text-green-400 text-sm font-medium">Live Updates</span>
                        </div>
                    </div>

                    {/* Tournament Tree */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Tournament Bracket</h2>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 border-2 border-green-500 rounded"></div>
                                    <span className="text-gray-300">Winners</span>
                                </div>
                                {isDoubleElim && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border-2 border-red-500 rounded"></div>
                                            <span className="text-gray-300">Losers</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border-2 border-yellow-500 rounded"></div>
                                            <span className="text-gray-300">Finals</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <TreeBracket 
                            matches={matches}
                            tournament={tournament}
                            onReportScore={() => {}} // Read-only for public view
                        />
                    </div>

                    {/* Champion Display */}
                    {champion && (
                        <div className="mt-8 text-center">
                            <h2 className="text-3xl font-bold text-yellow-400">
                                🏆 {champion} 🏆
                            </h2>
                            <p className="text-gray-400 mt-2">Tournament Champion</p>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="mt-6 bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-blue-300 text-sm font-medium">This bracket updates automatically</p>
                                <p className="text-blue-200 text-xs mt-1">Scores and match results are updated in real-time by tournament organizers.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
