import React, { useState, useEffect, useMemo, useRef } from "react";
import { Head, Link } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";
import ChallongeBracket from "@/Components/TournamentBracket/ChallongeBracket";
import RoundRobin from "@/Components/TournamentBracket/RoundRobin";

export default function PublicViewBracket({ event, tournament }) {
    const [matches, setMatches] = useState([]);
    const [champion, setChampion] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(0.6);
    const bracketContainerRef = useRef(null);

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
            // Keep original data
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

    const isRoundRobin = tournament?.bracket_type === 'round-robin';

    return (
        <PublicLayout>
            <Head title={`Tournament Bracket - ${event?.title}`} />

            <div className="py-12">
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
                            <p className="capitalize">
                                {tournament?.bracket_type === 'round-robin' ? 'Round Robin' : `${tournament?.bracket_type} Elimination`}
                            </p>
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
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">
                                {isRoundRobin ? 'Tournament Matches & Standings' : 'Tournament Bracket'}
                            </h2>
                            {!isRoundRobin && (
                                <div className="flex flex-wrap items-center gap-4 text-sm justify-end">
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
                                showScoreButton={false}
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
                                        showScoreButton={false}
                                    />
                                </div>
                            </div>
                        )}
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
