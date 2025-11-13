import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Challonge-style Single Elimination Tournament Bracket
 * 
 * Features:
 * - Horizontal layout with vertical columns for each round
 * - Matches displayed as cards with smooth connecting lines
 * - Dynamic spacing that adapts to team count (4-64+)
 * - Centered positioning with exponential vertical spacing
 * - SVG lines connecting parent matches to child matches
 */
const ChallongeBracket = ({ matches: rawMatches = [], onReportScore = null, showScoreButton = true }) => {
    const containerRef = useRef(null);
    const matchRefs = useRef({});
    const [connections, setConnections] = useState([]);
    const [matchPositions, setMatchPositions] = useState({});
    const [containerSize, setContainerSize] = useState({ width: 400, height: 400 });
    
    // Normalize matches: ensure every match has an 'id' field (use temp_id as fallback)
    // Use useMemo to prevent infinite re-render loop
    const matches = React.useMemo(() => {
        return rawMatches.map(m => ({
            ...m,
            id: m.id || m.temp_id
        }));
    }, [rawMatches]);

    // Constants for layout
    const MATCH_WIDTH = 210;
    const MATCH_HEIGHT = 60;
    const ROUND_SPACING = 280; // Horizontal spacing between rounds
    const BASE_VERTICAL_GAP = 20; // Base vertical gap between matches

    /**
     * Get proper round name for single elimination brackets
     */
    const getSingleEliminationRoundName = (round, totalRounds) => {
        if (round === totalRounds) {
            return 'Finals';
        } else if (round === totalRounds - 1) {
            return 'Semifinals';
        } else if (round === totalRounds - 2 && totalRounds > 3) {
            return 'Quarterfinals';
        } else {
            return `Round ${round}`;
        }
    };

    /**
     * Get proper round name for winners bracket (simplified - no "Winners" prefix)
     */
    const getWinnersRoundName = (round, totalWinnersRounds) => {
        if (round === totalWinnersRounds) {
            return 'Semifinals';
        } else if (round === totalWinnersRounds - 1) {
            return 'Quarterfinals';
        } else {
            return `Round ${round}`;
        }
    };

    /**
     * Get proper round name for losers bracket (simplified - no "Losers" prefix)
     */
    const getLosersRoundName = (round, totalLosersRounds) => {
        if (round === totalLosersRounds) {
            return 'Finals';
        } else if (round === totalLosersRounds - 1) {
            return 'Semifinals';
        } else {
            return `Round ${round}`;
        }
    };

    /**
     * Separate matches by bracket type for double elimination
     */
    const separateMatchesByBracket = () => {
        const winners = [];
        const losers = [];
        const grandFinals = [];
        
        matches.forEach(match => {
            if (match.bracket === 'winners') {
                winners.push(match);
            } else if (match.bracket === 'losers') {
                losers.push(match);
            } else if (match.bracket === 'grand_finals') {
                grandFinals.push(match);
            } else {
                // Default to winners for single elimination
                winners.push(match);
            }
        });
        
        return { winners, losers, grandFinals };
    };

    /**
     * Group matches by round
     */
    const groupMatchesByRound = (matchList = matches) => {
        const grouped = {};
        matchList.forEach(match => {
            if (!grouped[match.round]) {
                grouped[match.round] = [];
            }
            grouped[match.round].push(match);
        });
        return grouped;
    };

    const { winners, losers, grandFinals } = separateMatchesByBracket();
    const matchesByRound = groupMatchesByRound();
    const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
    
    /**
     * Check if this is a double elimination bracket
     */
    const isDoubleElimination = matches.some(m => 
        m.bracket === 'losers' || m.bracket === 'winners' || m.bracket === 'grand_finals'
    );
    
    /**
     * Detect A/B phases for losers bracket
     * A phase: Losers from WB play each other (pairing round)
     * B phase: Previous LB winners face new WB losers (drop-in round)
     */
    const detectLoserPhases = () => {
        const phases = {};
        
        // Track which matches receive fresh losers from WB
        const dropInTargets = new Set();
        winners.forEach(wMatch => {
            if (wMatch.loser_to) {
                dropInTargets.add(wMatch.loser_to);
            }
        });
        
        // Classify losers matches
        losers.forEach(lMatch => {
            // Count how many of its inputs are from WB (via loser_to)
            let wbInputCount = 0;
            winners.forEach(w => {
                if (w.loser_to === lMatch.id) wbInputCount++;
            });
            
            // A phase: internal LB matches (no fresh WB losers)
            // B phase: receives WB losers
            if (wbInputCount >= 1) {
                phases[lMatch.id] = 'B';
            } else {
                phases[lMatch.id] = 'A';
            }
        });
        
        return phases;
    };
    
    const loserPhases = isDoubleElimination ? detectLoserPhases() : {};

    /**
     * Calculate vertical spacing between matches in a round
     * Used for winners bracket and single elimination
     */
    const calculateRoundSpacing = (roundIndex, matchCount, bracket) => {
        if (matchCount === 1) return 0;
        
        // For double elimination winners bracket and single elimination
        // Use exponential spacing
        const multiplier = Math.pow(2, roundIndex);
        return (MATCH_HEIGHT + BASE_VERTICAL_GAP) * multiplier;
    };

    /**
     * Calculate positions for all matches with double elimination support
     */
    useEffect(() => {
        const positions = {};
        
        console.log('=== POSITIONING DEBUG ===');
        console.log('Total matches to position:', matches.length);
        console.log('Is double elim:', isDoubleElimination);
        console.log('Winners:', winners.length, 'Losers:', losers.length, 'GF:', grandFinals.length);
        
        if (winners.length === 0 && losers.length === 0) {
            console.warn('⚠️ NO BRACKETS DETECTED! All matches:', matches.map(m => ({ id: m.id, bracket: m.bracket })));
        }
        
        if (winners.length > 0 && losers.length === 0 && isDoubleElimination) {
            console.error('❌ MISSING LOSERS BRACKET! Only winners detected.');
        }
        
        console.log('Losers matches with rounds:', losers.map(m => ({ id: m.id, round: m.round })));
        
        if (isDoubleElimination) {
            console.log('=== PHASE DETECTION ===');
            const phasesByRound = {};
            losers.forEach(m => {
                const round = m.round;
                if (!phasesByRound[round]) phasesByRound[round] = { A: [], B: [] };
                const phase = loserPhases[m.id];
                if (phase) phasesByRound[round][phase].push(m.id);
            });
            console.log('Phases by round:', phasesByRound);
        }
        
        // For double elimination, position winners and losers separately
        if (isDoubleElimination) {
            // Position Winners Bracket
            const winnersRounds = groupMatchesByRound(winners);
            const winnersRoundNumbers = Object.keys(winnersRounds).map(Number).sort((a, b) => a - b);
            
            // Calculate actual top and bottom of winners bracket
            let winnersMinY = Infinity;
            let winnersMaxY = -Infinity;
            
            // FIRST PASS: Calculate positions for winners bracket
            const winnersTempPositions = {};
            winnersRoundNumbers.forEach((round, roundIndex) => {
                const roundMatches = winnersRounds[round];
                const matchCount = roundMatches.length;
                const spacing = calculateRoundSpacing(roundIndex, matchCount, 'winners');
                const totalHeight = matchCount > 1 ? (matchCount - 1) * spacing : 0;
                const startY = -totalHeight / 2;
                
                roundMatches.forEach((match, matchIndex) => {
                    const y = startY + (matchIndex * spacing);
                    winnersTempPositions[match.id] = y;
                    winnersMinY = Math.min(winnersMinY, y - MATCH_HEIGHT / 2);
                    winnersMaxY = Math.max(winnersMaxY, y + MATCH_HEIGHT / 2);
                });
            });
            
            // Position winners bracket
            winnersRoundNumbers.forEach((round, roundIndex) => {
                const roundMatches = winnersRounds[round];
                const matchCount = roundMatches.length;
                const spacing = calculateRoundSpacing(roundIndex, matchCount, 'winners');
                const totalHeight = matchCount > 1 ? (matchCount - 1) * spacing : 0;
                const startY = -totalHeight / 2;
                
                if (round === 1) {
                    console.log('WR1 matches in positioning:', roundMatches.map(m => m.id));
                    console.log('WR1 spacing:', spacing, 'startY:', startY, 'matchCount:', matchCount);
                }
                
                roundMatches.forEach((match, matchIndex) => {
                    const x = roundIndex * ROUND_SPACING;
                    const y = startY + (matchIndex * spacing);
                    if (round === 1) {
                        console.log(`Positioning ${match.id} at index ${matchIndex}: y = ${startY} + (${matchIndex} * ${spacing}) = ${y}`);
                    }
                    positions[match.id] = { x, y, round, matchIndex, bracket: 'winners' };
                });
            });
            
            // Position Losers Bracket - Diamond/Hourglass shape
            const losersRoundNumbers = Array.from(
                new Set(losers.map(match => match.losers_round || match.round))
            ).sort((a, b) => a - b);

            if (losersRoundNumbers.length > 0) {
                const losersRounds = {};
                losersRoundNumbers.forEach(lr => {
                    losersRounds[lr] = losers.filter(match => (match.losers_round || match.round) === lr);
                });

                // Calculate minimum gap needed to prevent overlap
                const MIN_BRACKET_GAP = 300;
                const losersStartY = winnersMaxY + MIN_BRACKET_GAP;

                console.log('Winners bracket Y range:', winnersMinY, 'to', winnersMaxY);
                console.log('Losers bracket starts at:', losersStartY);
                console.log('Losers rounds:', losersRoundNumbers);
                console.log('Losers matches per round:', losersRoundNumbers.map(r => `LR${r}: ${losersRounds[r].length} matches`));

                // Track top/bottom of losers bracket
                let losersMinY = Infinity;
                let losersMaxY = -Infinity;

                // Calculate center point for entire losers bracket
                const losersCenterY = losersStartY + 300;
                
                // Total number of losers rounds
                const totalLosersRounds = losersRoundNumbers.length;
                
                // Find the middle round index for diamond peak
                const middleRoundIndex = Math.floor(totalLosersRounds / 2);

                // Position each losers round using same exponential spacing as winners bracket
                losersRoundNumbers.forEach((logicalRound, roundIndex) => {
                    const roundMatches = losersRounds[logicalRound];
                    const matchCount = roundMatches.length;
                    const x = roundIndex * ROUND_SPACING;

                    // Use moderate linear spacing progression for losers bracket
                    // Similar to winners but not exponential to prevent extreme spreading
                    const baseSpacing = MATCH_HEIGHT + BASE_VERTICAL_GAP; // 80px
                    const spacing = matchCount > 1 ? baseSpacing * (1 + roundIndex * 0.5) : 0; // Linear: 80px, 120px, 160px, 200px...
                    const totalHeight = matchCount > 1 ? (matchCount - 1) * spacing : 0;
                    
                    // Center each round around the losers bracket centerline
                    const startY = losersCenterY - (totalHeight / 2);

                    roundMatches.forEach((match, matchIndex) => {
                        const y = startY + (matchIndex * spacing);

                        losersMinY = Math.min(losersMinY, y - MATCH_HEIGHT / 2);
                        losersMaxY = Math.max(losersMaxY, y + MATCH_HEIGHT / 2);

                        positions[match.id] = {
                            x,
                            y,
                            round: logicalRound,
                            matchIndex,
                            bracket: 'losers',
                            phase: loserPhases[match.id] || 'unknown'
                        };

                        console.log(`  LR${logicalRound} Match ${match.id} at (${x}, ${y.toFixed(1)}), spacing: ${spacing.toFixed(1)}, roundIndex: ${roundIndex}`);
                    });
                });

                console.log('Losers bracket positioning complete (DIAMOND SHAPE). Range:', losersMinY.toFixed(1), 'to', losersMaxY.toFixed(1));
            }
            
            // Position Grand Finals (close to winners bracket, not accounting for losers)
            if (grandFinals.length > 0) {
                // Position right after winners bracket instead of accounting for losers
                const winnersX = winnersRoundNumbers.length * ROUND_SPACING;
                grandFinals.forEach((match, index) => {
                    const x = winnersX;
                    // Position near the center of winners bracket vertically
                    const winnersCenter = (winnersMinY + winnersMaxY) / 2;
                    const y = winnersCenter + (index * (MATCH_HEIGHT + 40));
                    positions[match.id] = { x, y, round: match.round, matchIndex: index, bracket: 'grand_finals' };
                });
            }
        } else {
            // Single elimination - original logic
            // PASS 1: Position later rounds (Round 2+) normally with exponential spacing
            rounds.forEach((round, roundIndex) => {
                if (roundIndex === 0) return; // Skip Round 1 for now
                
                const roundMatches = matchesByRound[round];
                const matchCount = roundMatches.length;
                const spacing = calculateRoundSpacing(roundIndex, matchCount);
                
                // Calculate total height for this round
                const totalHeight = matchCount > 1 ? (matchCount - 1) * spacing : 0;
                
                // Center the round vertically
                const startY = -totalHeight / 2;
                
                roundMatches.forEach((match, matchIndex) => {
                    const x = roundIndex * ROUND_SPACING;
                    const y = startY + (matchIndex * spacing);
                    
                    positions[match.id] = { x, y, round, matchIndex };
                });
            });
        }
        
        // PASS 2: Position Round 1 matches based on their parent in Round 2
        // For single elimination: all Round 1 matches
        // For double elimination: only Winners Round 1 matches
        if (isDoubleElimination) {
            // Apply tree positioning to Winners Round 1 only
            const winnersR1 = winners.filter(m => m.round === 1);
            console.log('PASS 2 for Double Elim - WR1 matches:', winnersR1.length, winnersR1.map(m => m.id));
            
            if (winnersR1.length > 0) {
                const x = 0;
                
                // Group by parent
                const grouped = {};
                winnersR1.forEach(match => {
                    const parent = match.winner_to;
                    if (!grouped[parent]) grouped[parent] = [];
                    grouped[parent].push(match);
                });
                
                console.log('Grouped by parent:', Object.keys(grouped).length, 'groups');
                
                // Reposition based on parent
                Object.keys(grouped).forEach(parentId => {
                    const group = grouped[parentId];
                    const parentPos = positions[parentId];
                    
                    console.log(`Group for parent ${parentId}:`, group.length, 'matches, parent pos:', parentPos);
                    
                    if (parentPos && group.length === 2) {
                        const gap = MATCH_HEIGHT + 20;
                        const oldY0 = positions[group[0].id]?.y;
                        const oldY1 = positions[group[1].id]?.y;
                        const newY0 = parentPos.y - gap / 2;
                        const newY1 = parentPos.y + gap / 2;
                        
                        console.log(`Repositioning ${group[0].id}: ${oldY0} -> ${newY0}`);
                        console.log(`Repositioning ${group[1].id}: ${oldY1} -> ${newY1}`);
                        
                        positions[group[0].id] = { x, y: newY0, round: 1, matchIndex: 0, bracket: 'winners' };
                        positions[group[1].id] = { x, y: newY1, round: 1, matchIndex: 1, bracket: 'winners' };
                    } else if (parentPos && group.length === 1) {
                        positions[group[0].id] = { x, y: parentPos.y, round: 1, matchIndex: 0, bracket: 'winners' };
                    }
                });
            }
        } else if (rounds.length > 0 && matchesByRound[rounds[0]]) {
            // Single elimination: original PASS 2 logic
            const round1Matches = matchesByRound[rounds[0]];
            const x = 0;
            
            const grouped = {};
            round1Matches.forEach(match => {
                const parent = match.winner_to;
                if (!grouped[parent]) grouped[parent] = [];
                grouped[parent].push(match);
            });
            
            Object.keys(grouped).forEach(parentId => {
                const group = grouped[parentId];
                const parentPos = positions[parentId];
                
                if (parentPos && group.length === 2) {
                    const gap = MATCH_HEIGHT + 20;
                    positions[group[0].id] = { x, y: parentPos.y - gap / 2, round: rounds[0], matchIndex: 0 };
                    positions[group[1].id] = { x, y: parentPos.y + gap / 2, round: rounds[0], matchIndex: 1 };
                } else if (parentPos && group.length === 1) {
                    positions[group[0].id] = { x, y: parentPos.y, round: rounds[0], matchIndex: 0 };
                } else {
                    const spacing = MATCH_HEIGHT + BASE_VERTICAL_GAP;
                    group.forEach((match, idx) => {
                        positions[match.id] = { x, y: idx * spacing, round: rounds[0], matchIndex: idx };
                    });
                }
            });
        }
        
        console.log('Total positions created:', Object.keys(positions).length);
        console.log('Position keys:', Object.keys(positions).slice(0, 10)); // Show first 10 IDs
        console.log('Missing positions for matches:', matches.filter(m => !positions[m.id]).map(m => ({ id: m.id, round: m.round, bracket: m.bracket })));
        
        setMatchPositions(positions);
    }, [matches]);

    /**
     * Calculate SVG connection lines between matches
     */
    useLayoutEffect(() => {
        if (matches.length === 0 || Object.keys(matchPositions).length === 0) return;
        
        const lines = [];
        const offsetX = containerSize.offsetX || 50;
        const offsetY = containerSize.offsetY || 50;
        
        matches.forEach(match => {
            // Draw winner connections
            if (match.winner_to) {
                const targetMatch = matches.find(m => m.id === match.winner_to);
                const targetBracket = targetMatch?.bracket || '';
                const isLoserToGrandFinals = match.bracket === 'losers' && ['grand_finals', 'grand_finals_reset'].includes(targetBracket);

                if (!isLoserToGrandFinals) {
                    const sourcePos = matchPositions[match.id];
                    const targetPos = matchPositions[match.winner_to];
                    
                    if (sourcePos && targetPos) {
                        // Calculate line coordinates with offset
                        const x1 = sourcePos.x + MATCH_WIDTH + offsetX;
                        const y1 = sourcePos.y + offsetY;
                        const x2 = targetPos.x + offsetX;
                        const y2 = targetPos.y + offsetY;
                        
                        // Create right-angled path: horizontal -> vertical -> horizontal
                        const midX = x1 + (x2 - x1) / 2;
                        const path = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
                        
                        lines.push({
                            id: `winner-${match.id}-${match.winner_to}`,
                            path,
                            sourceMatch: match.id,
                            targetMatch: match.winner_to,
                            bracket: match.bracket || 'winners',
                            lineType: 'winner'
                        });
                    }
                }
            }
            
            // Draw loser connections (for double elimination)
            // Skip connections from losers bracket to grand finals
            if (match.loser_to) {
                const targetMatch = matches.find(m => m.id === match.loser_to);
                const targetBracket = targetMatch?.bracket || '';
                const isTargetGrandFinals = ['grand_finals', 'grand_finals_reset'].includes(targetBracket);

                // Skip drawing lines to any grand finals match from losers bracket
                if (!isTargetGrandFinals) {
                    const sourcePos = matchPositions[match.id];
                    const targetPos = matchPositions[match.loser_to];
                    
                    if (sourcePos && targetPos) {
                        // Calculate line coordinates with offset
                        const x1 = sourcePos.x + MATCH_WIDTH + offsetX;
                        const y1 = sourcePos.y + offsetY;
                        const x2 = targetPos.x + offsetX;
                        const y2 = targetPos.y + offsetY;
                        
                        // Create right-angled path
                        const midX = x1 + (x2 - x1) / 2;
                        const path = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
                        
                        lines.push({
                            id: `loser-${match.id}-${match.loser_to}`,
                            path,
                            sourceMatch: match.id,
                            targetMatch: match.loser_to,
                            bracket: 'losers',
                            lineType: 'loser'
                        });
                    }
                }
            }
        });
        
        setConnections(lines);
    }, [matches, matchPositions, containerSize]);


    /**
     * Calculate container dimensions based on actual match positions
     */
    useEffect(() => {
        if (Object.keys(matchPositions).length === 0) {
            setContainerSize({ width: 800, height: 600 });
            return;
        }
        
        // Calculate bounds from actual match positions
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        Object.values(matchPositions).forEach(pos => {
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x + MATCH_WIDTH);
            minY = Math.min(minY, pos.y - MATCH_HEIGHT / 2);
            maxY = Math.max(maxY, pos.y + MATCH_HEIGHT / 2);
        });
        
        const padding = 100;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        
        console.log('Container size calculated:', { width, height, minY, maxY });
        
        setContainerSize({ width, height, offsetX: -minX + padding, offsetY: -minY + padding });
    }, [matchPositions]);

    /**
     * Render individual match card
     */
    const renderMatch = (match) => {
        const position = matchPositions[match.id];
        if (!position) {
            console.warn('No position for match:', match.id, 'Match data:', { round: match.round, bracket: match.bracket });
            return null;
        }

        const team1 = match.slot1 || 'TBD';
        const team2 = match.slot2 || 'TBD';
        const hasWinner = match.winner_id !== null && match.winner_id !== undefined;

        // Determine border color based on bracket
        let borderColor = 'border-green-500'; // Default/Winners
        if (match.bracket === 'losers') {
            borderColor = 'border-red-500';
        } else if (match.bracket === 'grand_finals') {
            borderColor = 'border-yellow-500';
        }

        return (
            <div
                key={match.id}
                ref={el => matchRefs.current[match.id] = el}
                className={`absolute bg-gray-800 border-2 ${borderColor} rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer`}
                style={{
                    width: `${MATCH_WIDTH}px`,
                    height: `${MATCH_HEIGHT}px`,
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    transform: 'translate(0, -50%)'
                }}
            >
                {/* Phase badge for losers bracket */}
                {match.bracket === 'losers' && loserPhases[match.id] && (
                    <div 
                        className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md ${
                            loserPhases[match.id] === 'A' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-purple-500 text-white'
                        }`}
                        title={loserPhases[match.id] === 'A' ? 'Phase A: Internal' : 'Phase B: Drop-in'}
                    >
                        {loserPhases[match.id]}
                    </div>
                )}
                
                {/* Match content */}
                <div className="h-full flex items-center">
                    {/* Teams section */}
                    <div className="flex-1 flex flex-col justify-center px-3 py-2">
                        {/* Team 1 */}
                        <div className={`flex items-center justify-between text-sm font-semibold mb-1 px-2 py-0.5 rounded ${
                            hasWinner && match.winner_slot === 1 
                                ? 'bg-green-600 text-white' 
                                : 'text-gray-300'
                        }`}>
                            <span className="truncate flex-1">{team1}</span>
                            {match.team1_score !== undefined && (
                                <span className="ml-2 font-bold">{match.team1_score}</span>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-600 my-0.5"></div>

                        {/* Team 2 */}
                        <div className={`flex items-center justify-between text-sm font-semibold px-2 py-0.5 rounded ${
                            hasWinner && match.winner_slot === 2 
                                ? 'bg-green-600 text-white' 
                                : 'text-gray-300'
                        }`}>
                            <span className="truncate flex-1">{team2}</span>
                            {match.team2_score !== undefined && (
                                <span className="ml-2 font-bold">{match.team2_score}</span>
                            )}
                        </div>
                    </div>

                    {/* Report Score Button - Inside card on right */}
                    {showScoreButton && onReportScore && match.slot1 !== 'TBD' && match.slot2 !== 'TBD' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onReportScore(match);
                            }}
                            className="mr-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded p-1.5 flex items-center justify-center shadow transition-all duration-200"
                            title="Report Score"
                        >
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="w-4 h-4"
                            >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Match number badge */}
                <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
                    M{match.match_number || match.id}
                </div>
            </div>
        );
    };

    /**
     * Render round labels - Handle double elimination properly
     */
    const renderRoundLabels = () => {
        if (!isDoubleElimination) {
            // Single elimination - use proper round naming
            const totalRounds = Math.max(...rounds);
            return rounds.map((round, roundIndex) => {
                const x = roundIndex * ROUND_SPACING;
                const label = getSingleEliminationRoundName(round, totalRounds);

                return (
                    <div
                        key={`label-${round}`}
                        className="absolute text-center font-bold text-gray-300 text-base"
                        style={{
                            left: `${x}px`,
                            top: '0px',
                            width: `${MATCH_WIDTH}px`
                        }}
                    >
                        {label}
                    </div>
                );
            });
        }

        // Double elimination - position labels directly above their bracket columns
        const labels = [];

        // Winners bracket labels - positioned at same X as winners matches
        const winnersRounds = groupMatchesByRound(winners);
        const winnersRoundNumbers = Object.keys(winnersRounds).map(Number).sort((a, b) => a - b);
        const totalWinnersRounds = winnersRoundNumbers.length > 0 ? Math.max(...winnersRoundNumbers) : 0;
        
        winnersRoundNumbers.forEach((round, roundIndex) => {
            const firstMatch = winnersRounds[round][0];
            if (firstMatch) {
                const label = getWinnersRoundName(round, totalWinnersRounds);
                labels.push({
                    key: `winners-${round}`,
                    label: label,
                    x: roundIndex * ROUND_SPACING, // Position directly above winners bracket column
                    bracket: 'winners'
                });
            }
        });

        // Losers bracket labels removed for cleaner display

        // Grand Finals label - positioned right after winners bracket
        if (grandFinals.length > 0) {
            // Position right after winners bracket, same as the Grand Finals match
            const winnersX = winnersRoundNumbers.length * ROUND_SPACING;
            
            labels.push({
                key: 'grand-finals',
                label: 'Grand Finals',
                x: winnersX, // Same calculation as Grand Finals match position
                bracket: 'finals'
            });
        }

        return labels.map(labelInfo => (
            <div
                key={labelInfo.key}
                className="absolute text-center font-bold text-gray-300 text-base"
                style={{
                    left: `${labelInfo.x}px`,
                    top: '0px',
                    width: `${MATCH_WIDTH}px`
                }}
            >
                {labelInfo.label}
            </div>
        ));
    };

    // Handle empty state
    if (!matches || matches.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-900 rounded-xl border-2 border-dashed border-gray-700">
                <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">🏆</div>
                    <p className="text-lg font-semibold">No matches available</p>
                    <p className="text-sm">Tournament bracket will appear here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-auto bg-gray-900 rounded-xl p-8 border border-gray-700">
            <div
                ref={containerRef}
                className="relative mx-auto"
                style={{
                    width: `${containerSize.width}px`,
                    height: `${containerSize.height}px`,
                    minHeight: '400px'
                }}
            >
                {/* SVG Layer for connection lines */}
                <svg
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 1 }}
                >
                    {connections.map(conn => {
                        // Determine line color based on bracket and line type
                        let strokeColor = "rgba(34, 197, 94, 0.6)"; // Green for winners
                        let strokeDasharray = "none";
                        
                        if (conn.lineType === 'loser') {
                            // Loser paths are dashed and red
                            strokeColor = "rgba(239, 68, 68, 0.7)"; // Red for loser paths
                            strokeDasharray = "8,4"; // Dashed line
                        } else if (conn.bracket === 'losers') {
                            strokeColor = "rgba(239, 68, 68, 0.6)"; // Red for losers bracket
                        } else if (conn.bracket === 'grand_finals') {
                            strokeColor = "rgba(234, 179, 8, 0.6)"; // Yellow for grand finals
                        }
                        
                        return (
                            <path
                                key={conn.id}
                                d={conn.path}
                                stroke={strokeColor}
                                strokeWidth="3"
                                strokeDasharray={strokeDasharray}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-all duration-200"
                            />
                        );
                    })}
                </svg>

                {/* Round Labels - Fixed at top */}
                <div 
                    className="relative"
                    style={{ 
                        zIndex: 2,
                        transform: `translate(${containerSize.offsetX || 50}px, 40px)`
                    }}
                >
                    {renderRoundLabels()}
                </div>

                {/* Matches Layer */}
                <div 
                    className="relative"
                    style={{ 
                        zIndex: 2,
                        transform: `translate(${containerSize.offsetX || 50}px, ${containerSize.offsetY || 50}px)`
                    }}
                >
                    {matches.map((match, idx) => {
                        if (match.round === 1 && match.bracket === 'winners') {
                            const pos = matchPositions[match.id];
                            console.log('Rendering WR1 match:', match.id, 'Has position:', !!pos, 'Position:', pos ? `x:${pos.x} y:${pos.y}` : 'none', 'Map index:', idx);
                        }
                        return <React.Fragment key={match.id || `match-${idx}`}>{renderMatch(match)}</React.Fragment>;
                    })}
                </div>
            </div>
        </div>
    );
};

export default ChallongeBracket;
