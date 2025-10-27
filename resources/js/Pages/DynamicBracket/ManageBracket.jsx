import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function ManageBracket({ event, tournament }) {
    const [matches, setMatches] = useState([]);
    const [champion, setChampion] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentMatch, setCurrentMatch] = useState(null);
    const [scoreInput, setScoreInput] = useState({ team1: "", team2: "" });
    const [showSavePopup, setShowSavePopup] = useState(false);
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

    // Open score reporting modal
    const openReportScore = (match) => {
        setCurrentMatch(match);
        setScoreInput({
            team1: match.team1_score || "",
            team2: match.team2_score || "",
        });
        setShowModal(true);
    };

    // Submit score and determine winner
    const submitScore = async () => {
        if (!currentMatch) return;

        const team1Score = parseInt(scoreInput.team1) || 0;
        const team2Score = parseInt(scoreInput.team2) || 0;

        if (team1Score === team2Score) {
            alert("Scores cannot be tied. Please enter different scores.");
            return;
        }

        const winnerId = team1Score > team2Score ? currentMatch.team1_id : currentMatch.team2_id;
        const winnerName = team1Score > team2Score ? currentMatch.team1?.name : currentMatch.team2?.name;

        try {
            const response = await axios.put(route('api.bracket.updateMatch', { matchId: currentMatch.id }), {
                winner_id: winnerId,
                team1_score: team1Score,
                team2_score: team2Score,
            });

            if (response.data.success) {
                // Reload tournament data to get updated matches
                try {
                    const tournamentResponse = await axios.get(route('api.bracket.get', { eventId: event.id }));
                    if (tournamentResponse.data.success && tournamentResponse.data.tournament) {
                        setMatches(tournamentResponse.data.tournament.matches);
                        
                        // Check if this was the final match (last round of tournament)
                        if (!currentMatch.next_match_id && currentMatch.round === tournament.total_rounds) {
                            setChampion(winnerName);
                        }
                    }
                } catch (reloadError) {
                    console.error('Error reloading tournament:', reloadError);
                    // Fallback to local update if reload fails
                    const updatedMatches = matches.map(m => {
                        if (m.id === currentMatch.id) {
                            return {
                                ...m,
                                team1_score: team1Score,
                                team2_score: team2Score,
                                winner_id: winnerId,
                                winner: { id: winnerId, name: winnerName },
                                status: 'completed'
                            };
                        }
                        // Update next match with winner
                        if (m.id === currentMatch.next_match_id) {
                            if (!m.team1_id) {
                                return { ...m, team1_id: winnerId, team1: { id: winnerId, name: winnerName } };
                            } else if (!m.team2_id) {
                                return { ...m, team2_id: winnerId, team2: { id: winnerId, name: winnerName } };
                            }
                        }
                        return m;
                    });
                    setMatches(updatedMatches);
                }

                setShowModal(false);
                setShowSavePopup(true);
                setTimeout(() => setShowSavePopup(false), 2000);
            }
        } catch (error) {
            console.error('Error updating match:', error);
            alert('Failed to update match. Please try again.');
        }
    };

    // Render match box
    const renderMatch = (match, label) => {
        if (!match) return null;

        const team1 = match.team1 || { name: 'TBD' };
        const team2 = match.team2 || { name: 'TBD' };
        // Only highlight winner if it's not TBD
        const isTeam1Winner = match.winner_id === match.team1_id && team1.name !== 'TBD';
        const isTeam2Winner = match.winner_id === match.team2_id && team2.name !== 'TBD';
        
        // Check if both teams are assigned (not null and not TBD)
        const hasBothTeams = match.team1_id && match.team2_id;
        const hasWinner = match.winner_id !== null && match.winner_id !== undefined;

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

                {/* Report Score Button - Show if both teams exist and no winner yet */}
                {hasBothTeams && !hasWinner && (
                    <button
                        onClick={() => openReportScore(match)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded font-medium text-xs w-full mt-1 transition-colors"
                    >
                        Report Score
                    </button>
                )}

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
        <AuthenticatedLayout>
            <Head title={`Manage Bracket - ${event?.title}`} />

            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href={route('dashboard')}
                            className="inline-flex items-center text-slate-300 hover:text-white mb-4 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Event
                        </Link>

                        <h1 className="text-3xl font-bold text-white mb-2">Manage Tournament Bracket</h1>
                        <p className="text-gray-400">{tournament?.name}</p>
                        <p className="text-gray-500 text-sm capitalize">{tournament?.bracket_type} Elimination</p>
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
                </div>
            </div>

            {/* Save Success Popup */}
            {showSavePopup && (
                <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-green-600 px-6 py-3 rounded-lg shadow-lg text-white font-semibold">
                    Match Updated Successfully!
                </div>
            )}

            {/* Score Report Modal */}
            {showModal && currentMatch && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md border border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-white">
                            Report Score - Match {currentMatch.match_number}
                        </h2>
                        <div className="space-y-4">
                            {/* Team 1 Score */}
                            <div>
                                <label className="block text-sm mb-2 text-gray-300">
                                    {currentMatch.team1?.name || 'Team 1'}
                                </label>
                                <input
                                    type="number"
                                    value={scoreInput.team1}
                                    onChange={e => setScoreInput({ ...scoreInput, team1: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Score"
                                    min="0"
                                />
                            </div>

                            {/* Team 2 Score */}
                            <div>
                                <label className="block text-sm mb-2 text-gray-300">
                                    {currentMatch.team2?.name || 'Team 2'}
                                </label>
                                <input
                                    type="number"
                                    value={scoreInput.team2}
                                    onChange={e => setScoreInput({ ...scoreInput, team2: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Score"
                                    min="0"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitScore}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
                                >
                                    Submit Score
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
