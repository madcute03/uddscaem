import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function PublicViewBracket({ event, tournament }) {
    const [matches, setMatches] = useState([]);
    const [champion, setChampion] = useState(null);
    const boxRefs = useRef({});
    const [lines, setLines] = useState([]);

    // Load tournament matches
    useEffect(() => {
        if (tournament && tournament.matches) {
            setMatches(tournament.matches);
            if (tournament.winner) {
                setChampion(tournament.winner.name);
            }
        }
    }, [tournament]);

    // Render match box (view-only, no buttons)
    const renderMatch = (match, label) => {
        if (!match) return null;

        const team1 = match.team1 || { name: 'TBD' };
        const team2 = match.team2 || { name: 'TBD' };
        // Only highlight winner if it's not TBD
        const isTeam1Winner = match.winner_id === match.team1_id && team1.name !== 'TBD';
        const isTeam2Winner = match.winner_id === match.team2_id && team2.name !== 'TBD';

        return (
            <div
                id={`match-${match.id}`}
                ref={el => (boxRefs.current[`match-${match.id}`] = el)}
                className="p-2 border rounded-lg bg-gray-800 text-white mb-2 w-44 relative"
            >
                <p className="font-bold mb-1 text-xs">{label}</p>
                
                {/* Team 1 */}
                <div className={`flex justify-between items-center mb-1 text-xs px-2 py-1 rounded ${
                    isTeam1Winner ? "bg-green-600" : "bg-gray-700"
                }`}>
                    <span className="truncate">{team1.name}</span>
                    <span className="ml-2">{match.team1_score ?? "-"}</span>
                </div>

                {/* Team 2 */}
                <div className={`flex justify-between items-center mb-1 text-xs px-2 py-1 rounded ${
                    isTeam2Winner ? "bg-green-600" : "bg-gray-700"
                }`}>
                    <span className="truncate">{team2.name}</span>
                    <span className="ml-2">{match.team2_score ?? "-"}</span>
                </div>

                {/* Winner Display */}
                {match.winner && (
                    <p className="text-green-400 text-xs mt-1">🏆 {match.winner.name}</p>
                )}
            </div>
        );
    };

    // Draw connecting lines
    useLayoutEffect(() => {
        const container = document.getElementById("bracket-container");
        if (!container || matches.length === 0) return;

        const connections = [];
        matches.forEach(match => {
            if (match.next_match_id) {
                connections.push([`match-${match.id}`, `match-${match.next_match_id}`]);
            }
        });

        const newLines = connections.map(([fromId, toId]) => {
            const from = boxRefs.current[fromId];
            const to = boxRefs.current[toId];
            if (!from || !to) return null;

            const f = from.getBoundingClientRect();
            const t = to.getBoundingClientRect();
            const c = container.getBoundingClientRect();

            const startX = f.right - c.left;
            const startY = f.top + f.height / 2 - c.top;
            const endX = t.left - c.left;
            const endY = t.top + t.height / 2 - c.top;
            const midX = startX + 30;

            return `M${startX},${startY} H${midX} V${endY} H${endX}`;
        }).filter(Boolean);

        setLines(newLines);
    }, [matches]);

    // Group matches by round
    const matchesByRound = {};
    matches.forEach(match => {
        if (!matchesByRound[match.round]) {
            matchesByRound[match.round] = [];
        }
        matchesByRound[match.round].push(match);
    });

    const rounds = Object.keys(matchesByRound).sort((a, b) => a - b);

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
                        <p className="text-gray-500 text-sm capitalize">{tournament?.bracket_type} Elimination</p>
                        
                        {/* Live Updates Badge */}
                        <div className="mt-3 inline-flex items-center px-3 py-1 bg-green-900/30 border border-green-700 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            <span className="text-green-400 text-sm font-medium">Live Updates</span>
                        </div>
                    </div>

                    {/* Bracket Display */}
                    <div id="bracket-container" className="relative bg-gray-800/30 border border-gray-700 rounded-xl p-6 overflow-x-auto">
                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                            {lines.map((d, i) => (
                                <path key={i} d={d} stroke="white" strokeWidth="2" fill="none" />
                            ))}
                        </svg>

                        <div className="flex gap-20 min-w-max">
                            {rounds.map(round => (
                                <div key={round} className="mb-8">
                                    <h2 className="font-bold text-sm mb-4 text-center text-gray-300">
                                        {round == tournament.total_rounds ? '🏆 Finals' : `Round ${round}`}
                                    </h2>
                                    <div className="space-y-8">
                                        {matchesByRound[round].map((match, idx) => (
                                            <div key={match.id}>
                                                {renderMatch(match, `Match ${match.match_number}`)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
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
                    </div>

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
