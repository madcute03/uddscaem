import React, { useState, useRef, useLayoutEffect, useMemo } from "react";

const TreeBracket = ({ matches = [], tournament = {}, onReportScore }) => {
    const [lines, setLines] = useState([]);
    const boxRefs = useRef({});
    const containerRef = useRef(null);

    // Calculate tree positioning for matches
    const calculateTreeLayout = () => {
        if (!matches.length) return {};

        const matchesByRound = {};
        const winnerMatches = matches.filter(m => m.bracket === 'winners' || !m.bracket);
        const loserMatches = matches.filter(m => m.bracket === 'losers');
        const grandFinalsMatches = matches.filter(m => m.bracket === 'grand_finals');

        // Group matches by round
        [...winnerMatches, ...loserMatches, ...grandFinalsMatches].forEach(match => {
            const key = `${match.bracket || 'winners'}-${match.round}`;
            if (!matchesByRound[key]) {
                matchesByRound[key] = [];
            }
            matchesByRound[key].push(match);
        });

        return {
            winners: winnerMatches,
            losers: loserMatches,
            grandFinals: grandFinalsMatches,
            byRound: matchesByRound
        };
    };

    const layout = calculateTreeLayout();
    
    // Determine tournament type first
    const isDoubleElim = tournament?.bracket_type === 'double';

    // Calculate dynamic top offset to ensure all matches are visible
    const firstRoundMatches = matches.filter(m => m.round === 1).length;
    const matchSpacing = 160;
    
    // Find the maximum number of matches in any round to calculate proper centering
    const matchCountsByRound = Array.from(new Set(matches.map(m => m.round))).map(round => 
        matches.filter(m => m.round === round).length
    );
    const maxMatchesInAnyRound = Math.max(...matchCountsByRound, 1);
    
    // For double elimination, calculate based on winners bracket first round
    const winnersFirstRound = isDoubleElim 
        ? matches.filter(m => m.round === 1 && (m.bracket === 'winners' || !m.bracket)).length
        : maxMatchesInAnyRound;
    
    // Calculate the offset needed to center the bracket
    const maxNegativeY = maxMatchesInAnyRound > 1 ? -((maxMatchesInAnyRound - 1) * matchSpacing / 2) : 0;
    const winnersMaxNegativeY = winnersFirstRound > 1 ? -((winnersFirstRound - 1) * matchSpacing / 2) : 0;
    
    // Layout offsets to control spacing between brackets
    const WINNERS_SECTION_TOP = isDoubleElim ? Math.abs(winnersMaxNegativeY) + 500 : 360;
    const LOSERS_SECTION_TOP = WINNERS_SECTION_TOP + 1000; // Increased spacing between winners and losers brackets
    const GRAND_FINALS_TOP = Math.round((WINNERS_SECTION_TOP + LOSERS_SECTION_TOP) / 2);
    const SINGLE_ELIM_TOP = Math.abs(maxNegativeY) + 150; // Add buffer to prevent cutoff
    
    // Debug logging (remove in production)
    // console.log('TreeBracket Debug:', { totalMatches: matches.length, layout });

    // Calculate positions for tree layout using tournament tree algorithm
    const getMatchPosition = (match, matchIndex, roundMatches, bracket = 'winners') => {
        const totalMatches = roundMatches.length;
        const roundSpacing = 300; // Horizontal spacing between rounds
        const baseSpacing = 80; // Base vertical spacing between matches

        // For tree layout, position matches based on their hierarchical relationship
        const round = match.round;
        
        // Calculate vertical spacing that creates a tree effect
        let y;
        if (totalMatches === 1) {
            y = 0; // Center single matches
        } else {
            // Use simple linear spacing for better visibility
            const totalHeight = (totalMatches - 1) * baseSpacing;
            const startY = -totalHeight / 2;
            y = startY + matchIndex * baseSpacing;
        }

        // Calculate horizontal position - early rounds on left, later rounds on right
        const x = (round - 1) * roundSpacing;

        return { x, y };
    };

    // Draw connecting lines with tree-style curves
    const drawTreeLines = () => {
        if (!containerRef.current || matches.length === 0) return;

        const container = containerRef.current;
        const newLines = [];

        // Group matches by parent-child relationships
        const connections = new Map();
        
        matches.forEach(match => {
            if (match.next_match_id) {
                const nextMatch = matches.find(m => m.id === match.next_match_id);
                if (nextMatch) {
                    if (!connections.has(match.next_match_id)) {
                        connections.set(match.next_match_id, []);
                    }
                    connections.get(match.next_match_id).push(match.id);
                }
            }
        });

        // Draw lines for each parent-child relationship
        connections.forEach((childIds, parentId) => {
            const parentEl = boxRefs.current[`match-${parentId}`];
            if (!parentEl) return;

            const parentRect = parentEl.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            const parentX = parentRect.left + parentRect.width / 2 - containerRect.left;
            const parentY = parentRect.top + parentRect.height / 2 - containerRect.top;
            const childPoints = [];
            childIds.forEach(childId => {
                const childEl = boxRefs.current[`match-${childId}`];
                if (!childEl) return;

                const childRect = childEl.getBoundingClientRect();
                childPoints.push({
                    id: childId,
                    x: childRect.right - containerRect.left,
                    y: childRect.top + childRect.height / 2 - containerRect.top
                });
            });

            if (childPoints.length === 0) {
                return;
            }

            if (childPoints.length === 1) {
                const point = childPoints[0];
                const midX = point.x + (parentX - point.x) / 2;
                const path = `M${point.x},${point.y} L${midX},${point.y} L${midX},${parentY} L${parentX},${parentY}`;
                newLines.push({
                    path,
                    bracket: matches.find(m => m.id === point.id)?.bracket || 'winners'
                });
                return;
            }

            const parentMatch = matches.find(m => m.id === parentId);
            const parentBracket = parentMatch?.bracket || 'winners';

            const minChildX = Math.min(...childPoints.map(p => p.x));
            const maxChildX = Math.max(...childPoints.map(p => p.x));
            let joinX = minChildX + (parentX - minChildX) / 2;
            if (parentBracket === 'grand_finals') {
                const safeBuffer = 60;
                joinX = Math.min(parentX - safeBuffer, maxChildX + safeBuffer);
            }
            const topY = Math.min(...childPoints.map(p => p.y));
            const bottomY = Math.max(...childPoints.map(p => p.y));
            const meetingY = (topY + bottomY) / 2;
            const bracketType = matches.find(m => m.id === childPoints[0].id)?.bracket || 'winners';

            childPoints.forEach(point => {
                const path = `M${point.x},${point.y} L${joinX},${point.y}`;
                newLines.push({ path, bracket: bracketType });
            });

            // Vertical merge line between children
            newLines.push({
                path: `M${joinX},${topY} L${joinX},${bottomY}`,
                bracket: bracketType
            });

            // Connection from merge point to parent
            newLines.push({
                path: `M${joinX},${meetingY} L${parentX},${parentY}`,
                bracket: bracketType
            });
        });

        setLines(newLines);
    };

    useLayoutEffect(() => {
        const timer = setTimeout(drawTreeLines, 100);
        return () => clearTimeout(timer);
    }, [matches]);

    // Render match component
    const renderMatch = (match, position) => {
        if (!match) return null;

        const team1 = match.team1 || { name: 'TBD' };
        const team2 = match.team2 || { name: 'TBD' };
        const isTeam1Winner = match.winner_id === match.team1_id && team1.name !== 'TBD';
        const isTeam2Winner = match.winner_id === match.team2_id && team2.name !== 'TBD';
        
        const hasBothTeams = match.team1_id && match.team2_id;
        const hasWinner = match.winner_id !== null && match.winner_id !== undefined;
        const isGrandFinal = match.bracket === 'grand_finals';
        const isFinalRound = match.round === tournament?.total_rounds;

        const style = {
            position: 'absolute',
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -50%)'
        };

        return (
            <div
                key={match.id}
                id={`match-${match.id}`}
                ref={el => (boxRefs.current[`match-${match.id}`] = el)}
                className={`p-3 border-2 rounded-lg text-white transition-all duration-200 hover:scale-105 ${
                    isGrandFinal ? 'bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-400 w-56 shadow-lg shadow-yellow-500/20' :
                    isFinalRound && !isGrandFinal ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-400 w-52 shadow-lg shadow-blue-500/20' :
                    match.bracket === 'winners' ? 'bg-gray-800 border-green-500 w-48' :
                    match.bracket === 'losers' ? 'bg-gray-800 border-red-500 w-48' :
                    'bg-gray-800 border-gray-500 w-48'
                }`}
                style={style}
            >
                <div className="text-center mb-2">
                    <p className={`font-bold text-xs ${
                        isGrandFinal ? 'text-yellow-400' :
                        isFinalRound ? 'text-blue-400' :
                        'text-gray-300'
                    }`}>
                        {isGrandFinal ? '🏆 GRAND FINAL' : 
                         isFinalRound ? 'FINAL' : 
                         `Match ${match.match_number}`}
                    </p>
                    {isGrandFinal && (
                        <div className="text-[10px] text-yellow-300 opacity-75">
                            Winner Takes All
                        </div>
                    )}
                </div>
                
                {/* Team 1 */}
                <div className={`flex justify-between items-center mb-1 text-xs px-2 py-1 rounded ${
                    isTeam1Winner ? "bg-green-600" : "bg-gray-700"
                }`}>
                    <span className="truncate">{team1.name}</span>
                    <span className="ml-2">{match.team1_score ?? "-"}</span>
                </div>

                {/* Team 2 */}
                <div className={`flex justify-between items-center mb-2 text-xs px-2 py-1 rounded ${
                    isTeam2Winner ? "bg-green-600" : "bg-gray-700"
                }`}>
                    <span className="truncate">{team2.name}</span>
                    <span className="ml-2">{match.team2_score ?? "-"}</span>
                </div>

                {/* Report Score Button */}
                {hasBothTeams && !hasWinner && (
                    <button
                        onClick={() => onReportScore(match)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded font-medium text-xs w-full transition-colors"
                    >
                        Report Score
                    </button>
                )}

                {/* Winner Display */}
                {match.winner && (
                    <div className="text-center mt-2">
                        <p className={`text-xs font-semibold ${
                            isGrandFinal ? 'text-yellow-300' : 'text-green-400'
                        }`}>
                            {isGrandFinal ? '👑 CHAMPION' : '🏆 Winner'}
                        </p>
                        <p className={`text-xs font-bold ${
                            isGrandFinal ? 'text-yellow-100' : 'text-green-200'
                        }`}>
                            {match.winner.name}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // Calculate container dimensions based on tournament structure
    const winnersRounds = (layout.winners && layout.winners.length > 0) ? 
        Array.from(new Set(layout.winners.map(m => m.round))).length : 1;
    const losersRounds = (layout.losers && layout.losers.length > 0) ? 
        Array.from(new Set(layout.losers.map(m => m.round))).length : 0;
    const maxRounds = Math.max(winnersRounds, losersRounds, 1);
    
    // Calculate height based on the maximum vertical spread across all rounds (reuse variables from above)
    const matchHeight = 120; // Approximate height of a match card
    const totalVerticalSpan = (maxMatchesInAnyRound - 1) * matchSpacing + matchHeight;
    const singleElimHeight = Math.max(totalVerticalSpan + 400, 1250); // Extra padding top and bottom
    
    const containerWidth = Math.max((maxRounds * 420) + 800, 2400); // Increased width for better spacing and more rounds
    const containerHeight = isDoubleElim ? 2200 : singleElimHeight; // Extra space for separated brackets
    
    // Check if there are any matches to display
    if (!matches || matches.length === 0) {
        return (
            <div className="relative overflow-auto">
                <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-700 text-center">
                    <div className="text-gray-400 text-lg">
                        <div className="mb-4">🏆</div>
                        <p>No tournament matches available</p>
                        <p className="text-sm mt-2">Generate a bracket to view the tournament tree</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-auto">
            <div 
                ref={containerRef}
                className="relative bg-gray-900/50 rounded-xl p-8 border border-gray-700"
                style={{ 
                    width: `${containerWidth}px`, 
                    height: `${containerHeight}px`,
                    minWidth: '100%'
                }}
            >
                {/* SVG for connecting lines */}
                <svg 
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 1 }}
                >
                    {lines.map((line, i) => {
                        const strokeColor = 
                            line.bracket === 'winners' ? 'rgba(34, 197, 94, 0.7)' :
                            line.bracket === 'losers' ? 'rgba(239, 68, 68, 0.7)' :
                            line.bracket === 'grand_finals' ? 'rgba(251, 191, 36, 0.7)' :
                            'rgba(156, 163, 175, 0.7)';
                        
                        return (
                            <path 
                                key={i} 
                                d={line.path} 
                                stroke={strokeColor}
                                strokeWidth="3" 
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        );
                    })}
                </svg>

                {/* Tree Layout */}
                <div style={{ position: 'relative', zIndex: 2 }}>
                    {isDoubleElim ? (
                        // Double Elimination Tree Layout
                        <>
                            {/* Winners Bracket */}
                            <div className="absolute" style={{ top: `${WINNERS_SECTION_TOP}px`, left: '100px' }}>
                                
                                
                                {/* Winners matches positioned under the label */}
                                <div style={{ position: 'relative', top: '50px' }}>
                                    {layout.winners && Array.from(new Set(layout.winners.map(m => m.round))).sort((a, b) => a - b).map((round, roundIndex) => {
                                        const roundMatches = layout.winners.filter(m => m.round === round);
                                        const winnersRound = roundIndex + 1; // Convert to Winners R1, R2, R3
                                        
                                        return (
                                            <div key={`winners-round-${round}`}>
                                                {/* Round Label */}
                                                {/* Matches for this round */}
                                                {roundMatches.map((match, matchIndex) => {
                                                    const x = roundIndex * 380;
                                                    const totalMatches = roundMatches.length;
                                                    // Dynamic spacing: increases with each round for better tree structure
                                                    const baseSpacing = 160;
                                                    const spacing = roundIndex === 0 ? baseSpacing : baseSpacing * (1 + roundIndex * 0.8);
                                                    const startY = totalMatches > 1 ? -(totalMatches - 1) * spacing / 2 : 0;
                                                    const y = startY + matchIndex * spacing;
                                                    
                                                    return (
                                                        <div key={match.id} style={{
                                                            position: 'absolute',
                                                            left: `${x}px`,
                                                            top: `${y}px`
                                                        }}>
                                                            {renderMatch(match, { x: 0, y: 0 })}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            

                            {/* Losers Bracket */}
                            <div className="absolute" style={{ top: `${LOSERS_SECTION_TOP}px`, left: '100px' }}>
                                
                                
                                {/* Losers matches positioned under the label */}
                                <div style={{ position: 'relative', top: '30px' }}>
                                    {layout.losers && Array.from(new Set(layout.losers.map(m => m.round))).sort((a, b) => a - b).map((round, roundIndex) => {
                                        let roundMatches = layout.losers.filter(m => m.round === round);
                                        if (isDoubleElim) {
                                            const hasDisplayOrder = roundMatches.every(m => m.display_order !== undefined && m.display_order !== null);
                                            if (hasDisplayOrder) {
                                                // Sort by display_order when all matches have it
                                                roundMatches = roundMatches.slice().sort((a, b) => a.display_order - b.display_order);
                                            } else {
                                                const matchNumbersDesc = roundMatches.slice().sort((a, b) => b.match_number - a.match_number);
                                                const matchNumbersSet = new Set(roundMatches.map(m => m.match_number));
                                                
                                                // Special handling for specific rounds and team counts
                                                const isLR1_14teams = (roundIndex === 0 && matches.length === 26 && matchNumbersSet.has(7) && matchNumbersSet.has(8));
                                                const isLR3_14teams = (roundIndex === 2 && matches.length === 26 && matchNumbersSet.has(17) && matchNumbersSet.has(18));
                                                
                                                // For LR3 14-teams: keep descending (M18 on top, M17 below)
                                                if (isLR3_14teams) {
                                                    roundMatches = matchNumbersDesc; // Keep descending: [18, 17]
                                                } else {
                                                    const shouldForceAscending = (roundIndex > 2)
                                                        || isLR1_14teams  // LR1 for 14 teams: M7 then M8
                                                        || (roundIndex === 2 && (
                                                            (matches.length === 22 && matchNumbersSet.has(17) && matchNumbersSet.has(18)) || // 11 teams
                                                            (matches.length === 20 && matchNumbersSet.has(15) && matchNumbersSet.has(16))    // 12 teams
                                                        ));
                                                    if (shouldForceAscending) {
                                                        roundMatches = matchNumbersDesc.slice().reverse();
                                                    } else {
                                                        roundMatches = matchNumbersDesc;
                                                    }
                                                }
                                            }
                                        }
                                        const winnersRounds = layout.winners ? Array.from(new Set(layout.winners.map(m => m.round))).length : 0;
                                        const losersRound = roundIndex + 1; // Convert to Losers R1, R2, etc
                                        
                                        return (
                                            <div key={`losers-round-${round}`}>
                                                {/* Round Label */}
                                                
                                                
                                                {/* Matches for this round */}
                                                {roundMatches.map((match, matchIndex) => {
                                                    const x = roundIndex * 380;
                                                    const totalMatches = roundMatches.length;
                                                    const spacing = 160; // Increased spacing for better visibility
                                                    const startY = totalMatches > 1 ? -(totalMatches - 1) * spacing / 2 : 0;
                                                    const y = startY + matchIndex * spacing;
                                                    
                                                    return (
                                                        <div key={match.id} style={{
                                                            position: 'absolute',
                                                            left: `${x}px`,
                                                            top: `${y}px`
                                                        }}>
                                                            {renderMatch(match, { x: 0, y: 0 })}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            

                            {/* Grand Finals */}
                            {layout.grandFinals && layout.grandFinals.length > 0 && (
                                <div className="absolute" style={{ top: `${GRAND_FINALS_TOP}px`, right: '500px' }}>
                                    
                                    {layout.grandFinals.map((match, index) => {
                                        return (
                                            <div key={match.id} style={{
                                                position: 'relative',
                                                marginBottom: index < layout.grandFinals.length - 1 ? '40px' : '0'
                                            }}>
                                                {renderMatch(match, { x: 0, y: 0 })}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        // Single Elimination Tree Layout (using same positioning as double elim)
                        <>
                            {/* Single Elimination Bracket - Centered Layout */}
                            <div className="absolute" style={{ top: `${SINGLE_ELIM_TOP}px`, left: '100px' }}>
                                <div style={{ position: 'relative', top: '50px' }}>
                                    {Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b).map((round, roundIndex) => {
                                        const roundMatches = matches.filter(m => m.round === round);
                                        
                                        return (
                                            <div key={`round-${round}`}>
                                                {/* Matches for this round - using tree positioning */}
                                                {roundMatches.map((match, matchIndex) => {
                                                    const x = roundIndex * 380;
                                                    const totalMatches = roundMatches.length;
                                                    // Dynamic spacing: increases with each round for better tree structure
                                                    const baseSpacing = 160;
                                                    const spacing = roundIndex === 0 ? baseSpacing : baseSpacing * (1 + roundIndex * 0.8);
                                                    const startY = totalMatches > 1 ? -(totalMatches - 1) * spacing / 2 : 0;
                                                    const y = startY + matchIndex * spacing;
                                                    
                                                    return (
                                                        <div key={match.id} style={{
                                                            position: 'absolute',
                                                            left: `${x}px`,
                                                            top: `${y}px`
                                                        }}>
                                                            {renderMatch(match, { x: 0, y: 0 })}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Round Labels */}
                <div className="absolute top-4 left-0 right-0" style={{ zIndex: 3 }}>
                    {Array.from({ length: maxRounds }, (_, i) => (
                        <div
                            key={i}
                            className="absolute text-gray-300 font-semibold text-sm"
                            style={{ 
                                left: `${70 + (i * 400)}px`,
                                transform: 'translateX(-50%)'
                            }}
                        >
                            {i + 1 === maxRounds ? '🏆 Finals' : `Round ${i + 1}`}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TreeBracket;
