import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ChallongeBracket from "@/Components/TournamentBracket/ChallongeBracket";
import RoundRobin from "@/Components/TournamentBracket/RoundRobin";

export default function ManageBracket({ event, tournament }) {
    const [matches, setMatches] = useState([]);
    const [champion, setChampion] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentMatch, setCurrentMatch] = useState(null);
    const [scoreInput, setScoreInput] = useState({ team1: "", team2: "" });
    const [showSavePopup, setShowSavePopup] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(0.6);
    const bracketContainerRef = useRef(null);
    const boxRefs = useRef({});
    const [lines, setLines] = useState([]);

    // Transform backend data to ChallongeBracket format
    const transformMatchesForChallonge = (backendMatches) => {
        if (!backendMatches) return [];
        
        return backendMatches.map(match => ({
            id: match.id,
            round: match.round,
            match_number: match.match_number,
            bracket: match.bracket, // IMPORTANT: Preserve bracket field for double elim
            slot1: match.team1?.name || 'TBD',
            slot2: match.team2?.name || 'TBD',
            winner_to: match.next_match_id,
            team1_score: match.team1_score,
            team2_score: match.team2_score,
            winner_slot: match.winner_id === match.team1_id ? 1 : 
                         match.winner_id === match.team2_id ? 2 : null,
            winner_id: match.winner_id,
            // Keep original data for score reporting
            team1_id: match.team1_id,
            team2_id: match.team2_id,
            team1: match.team1,
            team2: match.team2
        }));
    };

    // Load tournament matches
    useEffect(() => {
        if (tournament && tournament.matches) {
            const transformedMatches = transformMatchesForChallonge(tournament.matches);
            setMatches(transformedMatches);
            if (tournament.winner) {
                setChampion(tournament.winner.name);
            }
        }
    }, [tournament]);

    useEffect(() => {
        if (typeof document === 'undefined') return;

        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = () => {
        if (typeof document === 'undefined') return;

        const element = bracketContainerRef.current;
        if (!element) return;

        if (!document.fullscreenElement) {
            element.requestFullscreen?.().catch(error => {
                console.error('Failed to enter fullscreen:', error);
            });
        } else {
            document.exitFullscreen?.().catch(error => {
                console.error('Failed to exit fullscreen:', error);
            });
        }
    };

    const MIN_ZOOM = 0.6;
    const MAX_ZOOM = 1.8;
    const ZOOM_STEP = 0.2;

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(MAX_ZOOM, Math.round((prev + ZOOM_STEP) * 100) / 100));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(MIN_ZOOM, Math.round((prev - ZOOM_STEP) * 100) / 100));
    };

    const handleZoomReset = () => setZoomLevel(0.6);

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
        if (!currentMatch || isSubmitting) return;

        const team1Score = parseInt(scoreInput.team1) || 0;
        const team2Score = parseInt(scoreInput.team2) || 0;

        // For elimination tournaments, ties are not allowed
        if (!isRoundRobin && team1Score === team2Score) {
            alert("Scores cannot be tied. Please enter different scores.");
            return;
        }

        const winnerId = team1Score > team2Score ? currentMatch.team1_id : currentMatch.team2_id;
        const winnerName = team1Score > team2Score ? currentMatch.team1?.name : currentMatch.team2?.name;

        setIsSubmitting(true);

        try {
            const requestData = {
                team1_score: team1Score,
                team2_score: team2Score,
            };
            
            // Only add winner_id for elimination tournaments
            if (!isRoundRobin) {
                requestData.winner_id = winnerId;
            }
            
            const response = await axios.put(route('api.bracket.updateMatch', { matchId: currentMatch.id }), requestData);

            if (response.data.success) {
                // Reload tournament data to get updated matches
                try {
                    const tournamentResponse = await axios.get(route('api.bracket.get', { eventId: event.id }));
                    if (tournamentResponse.data.success && tournamentResponse.data.tournament) {
                        const transformedMatches = transformMatchesForChallonge(tournamentResponse.data.tournament.matches);
                        setMatches(transformedMatches);
                        
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
                                winner_slot: team1Score > team2Score ? 1 : 2,
                                winner: { id: winnerId, name: winnerName },
                                status: 'completed'
                            };
                        }
                        // Update next match with winner
                        if (m.id === currentMatch.next_match_id) {
                            if (!m.team1_id || m.slot1 === 'TBD') {
                                return { 
                                    ...m, 
                                    team1_id: winnerId, 
                                    team1: { id: winnerId, name: winnerName },
                                    slot1: winnerName 
                                };
                            } else if (!m.team2_id || m.slot2 === 'TBD') {
                                return { 
                                    ...m, 
                                    team2_id: winnerId, 
                                    team2: { id: winnerId, name: winnerName },
                                    slot2: winnerName 
                                };
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
        } finally {
            setIsSubmitting(false);
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

    // Group matches by bracket and round
    const matchesByRound = {};
    const winnerMatches = matches.filter(m => m.bracket === 'winners' || !m.bracket);
    const loserMatches = matches.filter(m => m.bracket === 'losers');
    const grandFinalsMatches = matches.filter(m => m.bracket === 'grand_finals');
    
    matches.forEach(match => {
        if (!matchesByRound[match.round]) {
            matchesByRound[match.round] = [];
        }
        matchesByRound[match.round].push(match);
    });

    const rounds = Object.keys(matchesByRound).sort((a, b) => a - b);
    const isDoubleElim = tournament?.bracket_type === 'double';
    const isRoundRobin = tournament?.bracket_type === 'round-robin';

    return (
        <AuthenticatedLayout>
            <Head title={`Manage Bracket - ${event?.title}`} />

            <div className="py-12 px-8">
                <div className="mx-auto">
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
                        <p className="text-gray-500 text-sm capitalize">
                            {tournament?.bracket_type === 'round-robin' ? 'Round Robin' : `${tournament?.bracket_type} Elimination`}
                        </p>
                    </div>

                    {/* Bracket Display */}
                    <div className="mb-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">
                                {isRoundRobin ? 'Tournament Matches & Standings' : 'Tournament Tree'}
                            </h2>
                            {!isRoundRobin && (
                                <div className="flex flex-wrap items-center gap-4 text-sm justify-end">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border-2 border-green-500 rounded"></div>
                                        <span className="text-gray-300">Winners Bracket</span>
                                    </div>
                                    {isDoubleElim && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border-2 border-red-500 rounded"></div>
                                            <span className="text-gray-300">Losers Bracket</span>
                                        </div>
                                    )}
                                    {isDoubleElim && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border-2 border-yellow-500 rounded"></div>
                                            <span className="text-gray-300">Grand Finals</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/60 px-2 py-1 text-gray-200">
                                    <button
                                        type="button"
                                        onClick={handleZoomOut}
                                        disabled={zoomLevel <= MIN_ZOOM}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-600 bg-slate-900/60 text-base font-semibold transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                        title="Zoom out"
                                        aria-label="Zoom out"
                                    >
                                        −
                                    </button>
                                    <span className="text-xs font-semibold uppercase tracking-widest whitespace-nowrap">
                                        {Math.round(zoomLevel * 100)}%
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleZoomIn}
                                        disabled={zoomLevel >= MAX_ZOOM}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-600 bg-slate-900/60 text-base font-semibold transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                        title="Zoom in"
                                        aria-label="Zoom in"
                                    >
                                        +
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleZoomReset}
                                        disabled={zoomLevel === 0.6}
                                        className="ml-1 inline-flex items-center rounded-md border border-slate-600 bg-slate-900/60 px-2 py-1 text-[11px] font-medium uppercase tracking-wide transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Reset
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleFullscreen}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-200 transition hover:bg-slate-700"
                                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                        viewBox="0 0 24 24"
                                    >
                                        {isFullscreen ? (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9 9H5V5m10 10h4v4M9 15H5v4m10-10h4V5"
                                            />
                                        ) : (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8 3H5a2 2 0 00-2 2v3m14-5h3a2 2 0 012 2v3M3 16v3a2 2 0 002 2h3m9-5h3a2 2 0 002-2v-3"
                                            />
                                        )}
                                    </svg>
                                    <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                                </button>
                                </div>
                            )}
                        </div>

                        {isRoundRobin ? (
                            <RoundRobin 
                                matches={matches}
                                teams={tournament?.teams || []}
                                bracket={tournament?.bracket_data || {}}
                                showScoreButton={true}
                                onReportScore={openReportScore}
                            />
                        ) : (
                            <div
                                ref={bracketContainerRef}
                                className={`relative p-4 transition-[padding] overflow-auto ${isFullscreen ? 'min-h-screen' : ''}`}
                            >
                                <div
                                    className="inline-block rounded-xl border border-gray-700 bg-gray-800 p-4"
                                    style={{
                                        transform: `scale(${zoomLevel})`,
                                        transformOrigin: '0 0',
                                        transition: 'transform 0.2s ease-out'
                                    }}
                                >
                                    <ChallongeBracket 
                                        matches={matches}
                                        onReportScore={openReportScore}
                                        showScoreButton={true}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div id="bracket-container" className="relative bg-gray-800 border border-gray-700 rounded-xl p-6 overflow-x-auto" style={{ display: 'none' }}>
                        {isDoubleElim ? (
                            /* Double Elimination: Two Rows Layout */
                            <div>
                                {/* Winners Bracket Row */}
                                <div className="flex gap-20 min-w-max mb-12">
                                    {Array.from(new Set(winnerMatches.map(m => m.round))).sort((a, b) => a - b).map(round => (
                                        <div key={`w${round}`} className="flex flex-col">
                                            <div className="text-sm text-green-400 font-semibold mb-2 text-center">Winners Bracket</div>
                                            <h2 className="font-bold text-sm mb-4 text-center bg-green-900/30 border border-green-700 rounded-lg py-2 px-4 text-gray-300">
                                                Round {round}
                                            </h2>
                                            <div className="space-y-8">
                                                {winnerMatches.filter(m => m.round === round).map((match) => (
                                                    <div key={match.id} ref={el => boxRefs.current[match.id] = el}>
                                                        {renderMatch(match, `Match ${match.match_number}`)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Grand Finals Column */}
                                    {grandFinalsMatches.length > 0 && (
                                        <div className="flex flex-col">
                                            <div className="text-sm text-yellow-400 font-semibold mb-2 text-center">🏆 Grand Finals</div>
                                            <h2 className="font-bold text-sm mb-4 text-center bg-yellow-900/30 border border-yellow-700 rounded-lg py-2 px-4 text-gray-300">
                                                Finals
                                            </h2>
                                            <div className="space-y-8">
                                                {grandFinalsMatches.map((match) => (
                                                    <div key={match.id} ref={el => boxRefs.current[match.id] = el}>
                                                        {renderMatch(match, `Match ${match.match_number}`)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Losers Bracket Row */}
                                <div className="flex gap-20 min-w-max">
                                    {Array.from(new Set(loserMatches.map(m => m.round))).sort((a, b) => a - b).map(round => (
                                        <div key={`l${round}`} className="flex flex-col">
                                            <div className="text-sm text-red-400 font-semibold mb-2 text-center">Losers Bracket</div>
                                            <h2 className="font-bold text-sm mb-4 text-center bg-red-900/30 border border-red-700 rounded-lg py-2 px-4 text-gray-300">
                                                Losers R{round - (tournament.winners_rounds || 0)}
                                            </h2>
                                            <div className="space-y-8">
                                                {loserMatches.filter(m => m.round === round).map((match) => (
                                                    <div key={match.id} ref={el => boxRefs.current[match.id] = el}>
                                                        {renderMatch(match, `Match ${match.match_number}`)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Single Elimination Layout */
                            <>
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
                            </>
                        )}

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
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitScore}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Score'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
