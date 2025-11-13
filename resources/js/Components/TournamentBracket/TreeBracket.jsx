import React, { useState, useRef, useLayoutEffect, useMemo } from "react";

const TreeBracket = ({ matches = [], tournament = {}, onReportScore, zoomLevel = 0.6, customSpacing = null }) => {
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

    // Use custom spacing if provided (for ManageBracket with Report Score buttons), otherwise use default
    const baseMatchSpacing = customSpacing?.matchSpacing ?? 120;
    const baseMatchHeight = customSpacing?.matchHeight ?? 120;
    const baseLosersSpacing = customSpacing?.losersSpacing ?? 180;
    
    const matchSpacing = baseMatchSpacing; // Vertical spacing for winners bracket matches
    const matchHeight = baseMatchHeight; // Approximate height of a match card
    const LOSERS_VERTICAL_SPACING = baseLosersSpacing; // Vertical spacing for losers bracket matches
    const WINNERS_SECTION_PADDING = 120; // Extra breathing room around winners bracket
    const LOSERS_SECTION_PADDING = 160; // Extra breathing room around losers bracket
    const WINNERS_CONTENT_OFFSET = 50; // Matches are rendered 50px below winners container top
    const LOSERS_CONTENT_OFFSET = 30; // Matches are rendered 30px below losers container top
    const SINGLE_ELIM_BASE_SPACING = 160; // Base spacing for single elimination rounds
    const COLUMN_SPACING = 380; // Horizontal spacing between rounds for tree layout
    const MATCH_CARD_WIDTH = 240; // Approximate width of a match card
    const teamCount = tournament?.team_count;
    const isTwentyOneTeamSingleElim = !isDoubleElim && (teamCount === 21 || matches.length === 20);

    const computeRoundSpacing = (roundIndex, totalMatches, baseSpacing = matchSpacing, isForSingleElim = false, totalRoundsInBracket = 0) => {
        // Expanding tree for single elimination: spacing increases with each round
        if (isForSingleElim) {
            const isSemifinalsRound = totalRoundsInBracket > 0 && roundIndex === totalRoundsInBracket - 2;
            
            if (roundIndex === 0) {
                // R1: Tight spacing but enough to prevent overlap (dependent on R2)
                return baseSpacing * 0.85;
            } else if (roundIndex === 1) {
                // R2: Reduced spacing with minimum guarantees to prevent overlaps
                if (isSemifinalsRound) {
                    // Semifinals: spacing adapts based on how many matches (2-8 typical)
                    const semiMultiplier = 2 + (totalMatches * 0.5); // 3x for 2 matches, 6x for 8 matches
                    return baseSpacing * semiMultiplier;
                }
                // Round before Semifinals: adaptive spacing based on match count
                const isBeforeSemifinals = totalRoundsInBracket > 0 && roundIndex === totalRoundsInBracket - 3;
                if (isBeforeSemifinals) {
                    const multiplier = 1.1 + (totalMatches * 0.06); // Further reduced multiplier
                    return baseSpacing * multiplier;
                }
                // Minimum spacing to accommodate R1 pairs
                const minRequiredSpacing = 370; // Increased by 10px more to prevent R1 overlap
                const calculatedSpacing = baseSpacing * (1.5 + (totalMatches * 0.05));
                return Math.max(minRequiredSpacing, calculatedSpacing);
            } else if (roundIndex === 2) {
                // R3: Bigger gaps or adaptive Semifinals
                if (isSemifinalsRound) {
                    const semiMultiplier = 2.5 + (totalMatches * 0.5);
                    return baseSpacing * semiMultiplier;
                }
                // Round before Semifinals: adaptive spacing
                const isBeforeSemifinals = totalRoundsInBracket > 0 && roundIndex === totalRoundsInBracket - 3;
                if (isBeforeSemifinals) {
                    const multiplier = 1.8 + (totalMatches * 0.1);
                    return baseSpacing * multiplier;
                }
                return baseSpacing * 2.2;
            } else if (roundIndex === 3) {
                // R4: Even bigger gaps or adaptive Semifinals
                if (isSemifinalsRound) {
                    const semiMultiplier = 3 + (totalMatches * 0.5);
                    return baseSpacing * semiMultiplier;
                }
                // Round before Semifinals: adaptive spacing
                const isBeforeSemifinals = totalRoundsInBracket > 0 && roundIndex === totalRoundsInBracket - 3;
                if (isBeforeSemifinals) {
                    const multiplier = 2.5 + (totalMatches * 0.1);
                    return baseSpacing * multiplier;
                }
                return baseSpacing * 3;
            } else {
                // R5+: Largest gaps or adaptive Semifinals
                if (isSemifinalsRound) {
                    const semiMultiplier = 3.5 + (totalMatches * 0.5);
                    return baseSpacing * semiMultiplier;
                }
                // Round before Semifinals: adaptive spacing
                const isBeforeSemifinals = totalRoundsInBracket > 0 && roundIndex === totalRoundsInBracket - 3;
                if (isBeforeSemifinals) {
                    const multiplier = 3 + (totalMatches * 0.1);
                    return baseSpacing * multiplier;
                }
                return baseSpacing * 4;
            }
        }

        // Double elimination: use similar adaptive logic with minimum spacing guarantees
        if (roundIndex === 0) {
            return baseSpacing * 0.85;
        } else if (roundIndex === 1) {
            // R2: Increased spacing to prevent R1 overlaps
            // Each R2 match needs to accommodate 2 R1 pairs (4 matches total)
            // Minimum spacing = (2 pairs * pair_gap) + pair_height + extra buffer
            const minRequiredSpacing = 370; // Increased by 10px more to prevent R1 overlap
            const calculatedSpacing = baseSpacing * (1.5 + (totalMatches * 0.05));
            return Math.max(minRequiredSpacing, calculatedSpacing);
        } else if (roundIndex === 2) {
            const multiplier = 1.6 + (totalMatches * 0.06);
            return baseSpacing * multiplier;
        } else {
            // R3+: Progressive spacing
            const multiplier = 2.0 + (roundIndex - 2) * 0.4;
            return baseSpacing * multiplier;
        }
    };

    const singleElimMetrics = useMemo(() => {
        if (isDoubleElim || matches.length === 0) return null;

        const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);
        if (rounds.length === 0) return null;

        let minY = Infinity;
        let maxY = -Infinity;
        const roundConfigs = new Map();

        rounds.forEach((round, roundIndex) => {
            const roundMatches = matches.filter(m => m.round === round);
            if (roundMatches.length === 0) return;

            let spacing, startY, roundMin, roundMax;
            const totalMatches = roundMatches.length;

            if (roundIndex === 0) {
                // R1: Calculate based on paired positioning
                const pairGap = SINGLE_ELIM_BASE_SPACING;
                const withinPairGap = 120; // Gap between R1 pairs
                const totalPairs = Math.ceil(totalMatches / 2);
                const totalPairHeight = (totalPairs - 1) * pairGap;
                startY = -(totalPairHeight / 2);
                spacing = pairGap; // Store pair gap as spacing for reference
                
                // Calculate min/max considering paired layout
                roundMin = startY - matchHeight / 2;
                roundMax = startY + totalPairHeight + withinPairGap + matchHeight / 2;
            } else {
                // R2+: Use progressive spacing
                spacing = computeRoundSpacing(roundIndex, totalMatches, SINGLE_ELIM_BASE_SPACING, true, rounds.length);
                const totalHeight = totalMatches > 1 ? (totalMatches - 1) * spacing : 0;
                startY = totalMatches > 1 ? -(totalHeight / 2) : 0;
                roundMin = startY - matchHeight / 2;
                roundMax = startY + totalHeight + matchHeight / 2;
            }

            roundConfigs.set(round, { spacing, startY });

            minY = Math.min(minY, roundMin);
            maxY = Math.max(maxY, roundMax);
        });

        if (minY === Infinity) {
            minY = -matchHeight / 2;
            maxY = matchHeight / 2;
        }

        const verticalSpan = maxY - minY;

        return { roundConfigs, minY, maxY, verticalSpan };
    }, [isDoubleElim, matches, matchSpacing, matchHeight, isTwentyOneTeamSingleElim]);

    // Calculate dynamic top offset to ensure all matches are visible
    const firstRoundMatches = matches.filter(m => m.round === 1).length;
    
    // Find the maximum number of matches in any round to calculate proper centering
    const matchCountsByRound = Array.from(new Set(matches.map(m => m.round))).map(round => 
        matches.filter(m => m.round === round).length
    );
    const maxMatchesInAnyRound = Math.max(...matchCountsByRound, 1);

    const loserRoundsArray = layout.losers && layout.losers.length > 0
        ? Array.from(new Set(layout.losers.map(m => m.round)))
        : [];
    const maxLosersMatchesInRound = loserRoundsArray.length
        ? Math.max(...loserRoundsArray.map(round =>
            layout.losers.filter(m => m.round === round).length
        ))
        : 0;
    const estimatedLosersSpan = maxLosersMatchesInRound > 0
        ? ((maxLosersMatchesInRound - 1) * LOSERS_VERTICAL_SPACING) + matchHeight
        : matchHeight;
    
    // For double elimination, calculate based on winners bracket first round
    const winnersFirstRound = isDoubleElim 
        ? matches.filter(m => m.round === 1 && (m.bracket === 'winners' || !m.bracket)).length
        : maxMatchesInAnyRound;
    
    // Calculate the offset needed to center the bracket
    const maxNegativeY = maxMatchesInAnyRound > 1 ? -((maxMatchesInAnyRound - 1) * matchSpacing / 2) : 0;
    const winnersMaxNegativeY = winnersFirstRound > 1 ? -((winnersFirstRound - 1) * matchSpacing / 2) : 0;
    
    // Layout offsets - Challonge-style vertical stacking with FIXED gaps
    // Calculate actual winners bracket vertical span
    let winnersMinY = Infinity;
    let winnersMaxY = -Infinity;
    if (layout.winners && layout.winners.length > 0) {
        const winnerRoundsList = Array.from(new Set(layout.winners.map(m => m.round))).sort((a, b) => a - b);
        winnerRoundsList.forEach((round, roundIndex) => {
            const roundMatches = layout.winners.filter(m => m.round === round);
            const totalMatches = roundMatches.length;
            const spacing = computeRoundSpacing(roundIndex, totalMatches);
            const startY = totalMatches > 1 ? -(totalMatches - 1) * spacing / 2 : 0;
            roundMatches.forEach((match, matchIndex) => {
                const centerY = startY + matchIndex * spacing;
                const top = centerY - matchHeight / 2;
                const bottom = centerY + matchHeight / 2;
                winnersMinY = Math.min(winnersMinY, top);
                winnersMaxY = Math.max(winnersMaxY, bottom);
            });
        });
    }

    if (winnersMinY === Infinity) {
        winnersMinY = -matchHeight / 2;
        winnersMaxY = matchHeight / 2;
    }

    const winnersPaddingTop = WINNERS_SECTION_PADDING / 2;
    const winnersPaddingBottom = WINNERS_SECTION_PADDING / 2;
    const winnersSectionTop = winnersMinY - winnersPaddingTop;
    const winnersSectionBottom = winnersMaxY + winnersPaddingBottom;
    const winnersSectionHeight = winnersSectionBottom - winnersSectionTop;
    
    // Fixed positioning - Challonge style
    const ROUND_LABEL_HEIGHT = 30; // Approximate label height
    const ROUND_LABEL_TO_WINNERS_GAP = 192; // 2 inches @ 96px per inch
    const BASE_WINNERS_TOP = ROUND_LABEL_HEIGHT + ROUND_LABEL_TO_WINNERS_GAP; // Labels + desired gap
    const WINNERS_TOP = Math.max(BASE_WINNERS_TOP - (WINNERS_CONTENT_OFFSET + winnersMinY), 0);

    // Calculate losers bracket bounds (relative to their internal coordinate system)
    let losersMinY = Infinity;
    let losersMaxY = -Infinity;
    if (layout.losers && layout.losers.length > 0) {
        const loserRoundsList = Array.from(new Set(layout.losers.map(m => m.round))).sort((a, b) => a - b);
        loserRoundsList.forEach((round, roundIndex) => {
            const roundMatches = layout.losers.filter(m => m.round === round);
            const totalMatches = roundMatches.length;
            const spacing = LOSERS_VERTICAL_SPACING;
            const startY = totalMatches > 1 ? -(totalMatches - 1) * spacing / 2 : 0;
            roundMatches.forEach((match, matchIndex) => {
                const centerY = startY + matchIndex * spacing;
                const top = centerY - matchHeight / 2;
                const bottom = centerY + matchHeight / 2;
                losersMinY = Math.min(losersMinY, top);
                losersMaxY = Math.max(losersMaxY, bottom);
            });
        });
    }

    if (losersMinY === Infinity) {
        losersMinY = -matchHeight / 2;
        losersMaxY = matchHeight / 2;
    }

    const actualWinnersBottom = WINNERS_TOP + WINNERS_CONTENT_OFFSET + winnersMaxY;
    const desiredActualLosersTop = actualWinnersBottom + 192; // 2 inches @ 96px per inch
    const LOSERS_TOP = desiredActualLosersTop - LOSERS_CONTENT_OFFSET - losersMinY; // Align losers bracket top to maintain exact gap
    
    // Horizontal positioning (all brackets start at same X)
    const BRACKET_LEFT = 100;
    
    // Grand Finals positioned vertically between Winners and Losers, horizontally to the right
    const winnersRounds = layout.winners ? Array.from(new Set(layout.winners.map(m => m.round))).length : 1;
    const losersRounds = layout.losers ? Array.from(new Set(layout.losers.map(m => m.round))).length : 0;
    const maxRoundsWidth = Math.max(winnersRounds, losersRounds) * COLUMN_SPACING;
    const FINALS_LEFT = BRACKET_LEFT + maxRoundsWidth + 400; // Finals to the right
    const GRAND_FINALS_TOP = Math.round((WINNERS_TOP + LOSERS_TOP) / 2); // Centered between Winners and Losers
    
    const SINGLE_ELIM_VERTICAL_PADDING = 200;
    const SINGLE_ELIM_BASE_TOP = ROUND_LABEL_HEIGHT + ROUND_LABEL_TO_WINNERS_GAP;
    const SINGLE_ELIM_TOP = !isDoubleElim && singleElimMetrics
        ? Math.max(SINGLE_ELIM_BASE_TOP - (WINNERS_CONTENT_OFFSET + singleElimMetrics.minY), 0)
        : Math.max(SINGLE_ELIM_BASE_TOP - (WINNERS_CONTENT_OFFSET + maxNegativeY), 0);
    
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
        const scale = zoomLevel || 1;

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
            
            const parentX = (parentRect.left + parentRect.width / 2 - containerRect.left) / scale;
            const parentY = (parentRect.top + parentRect.height / 2 - containerRect.top) / scale;
            const childPoints = [];
            childIds.forEach(childId => {
                const childEl = boxRefs.current[`match-${childId}`];
                if (!childEl) return;

                const childRect = childEl.getBoundingClientRect();
                childPoints.push({
                    id: childId,
                    x: (childRect.right - containerRect.left) / scale,
                    y: (childRect.top + childRect.height / 2 - containerRect.top) / scale
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
        if (!matches.length) {
            setLines([]);
            return;
        }

        const rafId = requestAnimationFrame(drawTreeLines);
        const timeoutId = setTimeout(drawTreeLines, 240); // ensure redraw after zoom transition
        const spacingTimeoutId = setTimeout(drawTreeLines, 100); // redraw after spacing changes

        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(timeoutId);
            clearTimeout(spacingTimeoutId);
        };
    }, [matches, zoomLevel, matchSpacing, matchHeight, LOSERS_VERTICAL_SPACING]);

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
                {onReportScore && hasBothTeams && !hasWinner && (
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
    const maxRounds = Math.max(winnersRounds, losersRounds, 1);
    
    // Calculate height based on the maximum vertical spread across all rounds
    const totalVerticalSpan = (maxMatchesInAnyRound - 1) * matchSpacing + matchHeight;
    const singleElimHeight = !isDoubleElim && singleElimMetrics
        ? Math.max(
            singleElimMetrics.verticalSpan + SINGLE_ELIM_VERTICAL_PADDING * 2,
            SINGLE_ELIM_TOP + WINNERS_CONTENT_OFFSET + singleElimMetrics.maxY + SINGLE_ELIM_VERTICAL_PADDING,
            1250
        )
        : Math.max(totalVerticalSpan + 400, 1250);
    
    // Dynamic width calculation: Challonge-style vertical stacking
    // Total width = Bracket left + max rounds width + Finals gap + Finals width + right padding
    const singleElimRoundsCount = Array.from(new Set(matches.map(m => m.round))).length || 1;
    const singleElimWidth = BRACKET_LEFT + (singleElimRoundsCount - 1) * COLUMN_SPACING + MATCH_CARD_WIDTH + 400;
    const containerWidth = isDoubleElim
        ? FINALS_LEFT + MATCH_CARD_WIDTH + 500
        : Math.max(singleElimWidth, 1200);
    
    // Dynamic height calculation for double elimination
    // Calculate actual winners bracket height
    
// Calculate actual losers bracket height
const losersMaxMatches = layout.losers && layout.losers.length > 0
    ? Math.max(...Array.from(new Set(layout.losers.map(m => m.round))).map(round =>
        layout.losers.filter(m => m.round === round).length
    ))
    : 1;
const losersVerticalSpan = (losersMaxMatches - 1) * LOSERS_VERTICAL_SPACING + matchHeight;
const losersSectionHeight = losersVerticalSpan + LOSERS_SECTION_PADDING;

    const paddedWinnersBottom = WINNERS_TOP + WINNERS_CONTENT_OFFSET + winnersMaxY + WINNERS_SECTION_PADDING / 2;
    const paddedLosersBottom = layout.losers && layout.losers.length > 0
        ? LOSERS_TOP + LOSERS_CONTENT_OFFSET + losersMaxY + LOSERS_SECTION_PADDING / 2
        : 0;
    const grandFinalsBottom = layout.grandFinals && layout.grandFinals.length > 0
        ? GRAND_FINALS_TOP + (matchHeight / 2) + (layout.grandFinals.length - 1) * (matchHeight + 40)
        : 0;
    const doubleElimContentBottom = Math.max(paddedWinnersBottom, paddedLosersBottom, grandFinalsBottom);

    const containerHeight = isDoubleElim
        ? Math.max(doubleElimContentBottom + 200, 1250)
        : singleElimHeight;

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
        <div className="relative overflow-auto w-full h-full">
            <div 
                ref={containerRef}
                className="relative bg-gray-900/50 rounded-xl p-8 border border-gray-700"
                style={{ 
                    width: `${containerWidth}px`, 
                    height: `${containerHeight}px`
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
                            <div className="absolute" style={{ top: `${WINNERS_TOP}px`, left: `${BRACKET_LEFT}px` }}>
                                
                                
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
                                                    const x = roundIndex * COLUMN_SPACING;
                                                    const totalMatches = roundMatches.length;
                                                    
                                                    let y;
                                                    if (roundIndex === 0) {
                                                        // WR1: Position based on parent WR2 match position
                                                        const nextMatch = matches.find(m => m.id === match.next_match_id);
                                                        if (nextMatch && nextMatch.bracket === 'winners') {
                                                            // Find WR2 matches and their positions
                                                            const wr2Matches = layout.winners.filter(m => m.round === round + 1);
                                                            const wr2Index = wr2Matches.findIndex(m => m.id === nextMatch.id);
                                                            
                                                            if (wr2Index !== -1) {
                                                                // Calculate WR2 position using updated spacing logic
                                                                const allWinnersRoundsCount = Array.from(new Set(layout.winners.map(m => m.round))).length;
                                                                const wr2TotalMatches = wr2Matches.length;
                                                                const wr2Spacing = computeRoundSpacing(1, wr2TotalMatches, matchSpacing, false, allWinnersRoundsCount);
                                                                const wr2StartY = wr2TotalMatches > 1 ? -(wr2TotalMatches - 1) * wr2Spacing / 2 : 0;
                                                                const wr2Y = wr2StartY + wr2Index * wr2Spacing;
                                                                
                                                                // Position WR1 matches around their WR2 parent
                                                                const wr2Children = layout.winners.filter(m => m.next_match_id === nextMatch.id && m.round === round);
                                                                const childIndex = wr2Children.findIndex(m => m.id === match.id);
                                                                const withinPairGap = 120; // Gap between R1 pairs
                                                                const pairOffset = (withinPairGap / 2);
                                                                
                                                                // Center the pair around WR2 position
                                                                if (childIndex === 0) {
                                                                    y = wr2Y - pairOffset;
                                                                } else {
                                                                    y = wr2Y + pairOffset;
                                                                }
                                                            } else {
                                                                // Fallback
                                                                const spacing = computeRoundSpacing(roundIndex, totalMatches);
                                                                const startY = totalMatches > 1 ? -(totalMatches - 1) * spacing / 2 : 0;
                                                                y = startY + matchIndex * spacing;
                                                            }
                                                        } else {
                                                            // Fallback
                                                            const spacing = computeRoundSpacing(roundIndex, totalMatches);
                                                            const startY = totalMatches > 1 ? -(totalMatches - 1) * spacing / 2 : 0;
                                                            y = startY + matchIndex * spacing;
                                                        }
                                                    } else {
                                                        // WR2+: Use progressive spacing
                                                        const roundConfig = singleElimMetrics?.roundConfigs.get(round);
                                                        const spacing = roundConfig
                                                            ? roundConfig.spacing
                                                            : computeRoundSpacing(roundIndex, totalMatches);
                                                        
                                                        const startY = roundConfig
                                                            ? roundConfig.startY
                                                            : (totalMatches > 1 ? -(totalMatches - 1) * spacing / 2 : 0);
                                                        y = startY + matchIndex * spacing;
                                                    }
                                                    
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
                            <div className="absolute" style={{ top: `${LOSERS_TOP}px`, left: `${BRACKET_LEFT}px` }}>
                                
                                
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
                                                const isLR1_15teams = (roundIndex === 0 && matches.length === 28 && matchNumbersSet.has(8) && matchNumbersSet.has(9) && matchNumbersSet.has(10));
                                                const isLR3_14teams = (roundIndex === 2 && matches.length === 26 && matchNumbersSet.has(17) && matchNumbersSet.has(18));
                                                const isLR4_17teams = (roundIndex === 3 && matches.length === 32 && matchNumbersSet.has(23) && matchNumbersSet.has(24));
                                                
                                                // For LR3 14-teams and LR4 17-teams: keep descending order
                                                if (isLR3_14teams || isLR4_17teams) {
                                                    roundMatches = matchNumbersDesc; // Keep descending
                                                } else {
                                                    const shouldForceAscending = (roundIndex > 2)
                                                        || isLR1_14teams  // LR1 for 14 teams: M7 then M8
                                                        || isLR1_15teams  // LR1 for 15 teams: M8, M9, M10
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
                                                    const x = roundIndex * COLUMN_SPACING;
                                                    const totalMatches = roundMatches.length;
                                                    
                                                    let y;
                                                    if (roundIndex === 0) {
                                                        // LR1: Position based on parent LR2 match position (if applicable)
                                                        const nextMatch = matches.find(m => m.id === match.next_match_id);
                                                        if (nextMatch && nextMatch.bracket === 'losers') {
                                                            // Find LR2 matches and their positions
                                                            const lr2Matches = layout.losers.filter(m => m.round === round + 1);
                                                            const lr2Index = lr2Matches.findIndex(m => m.id === nextMatch.id);
                                                            
                                                            if (lr2Index !== -1) {
                                                                // Calculate LR2 position
                                                                const lr2TotalMatches = lr2Matches.length;
                                                                const lr2Spacing = LOSERS_VERTICAL_SPACING;
                                                                const lr2StartY = lr2TotalMatches > 1 ? -(lr2TotalMatches - 1) * lr2Spacing / 2 : 0;
                                                                const lr2Y = lr2StartY + lr2Index * lr2Spacing;
                                                                
                                                                // Position LR1 matches around their LR2 parent
                                                                const lr2Children = layout.losers.filter(m => m.next_match_id === nextMatch.id && m.round === round);
                                                                const childIndex = lr2Children.findIndex(m => m.id === match.id);
                                                                const withinPairGap = 120; // Gap between R1 pairs
                                                                const pairOffset = (withinPairGap / 2);
                                                                
                                                                // Center the pair around LR2 position
                                                                if (childIndex === 0) {
                                                                    y = lr2Y - pairOffset;
                                                                } else {
                                                                    y = lr2Y + pairOffset;
                                                                }
                                                            } else {
                                                                // Fallback
                                                                const spacing = LOSERS_VERTICAL_SPACING;
                                                                const startY = totalMatches > 1 ? -(totalMatches - 1) * spacing / 2 : 0;
                                                                y = startY + matchIndex * spacing;
                                                            }
                                                        } else {
                                                            // Fallback
                                                            const spacing = LOSERS_VERTICAL_SPACING;
                                                            const startY = totalMatches > 1 ? -(totalMatches - 1) * spacing / 2 : 0;
                                                            y = startY + matchIndex * spacing;
                                                        }
                                                    } else {
                                                        // LR2+: Use standard losers spacing
                                                        const spacing = LOSERS_VERTICAL_SPACING;
                                                        const startY = totalMatches > 1 ? -(totalMatches - 1) * spacing / 2 : 0;
                                                        y = startY + matchIndex * spacing;
                                                    }
                                                    
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
                                <div className="absolute" style={{ top: `${GRAND_FINALS_TOP}px`, left: `${FINALS_LEFT}px` }}>
                                    
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
                                                    const x = roundIndex * COLUMN_SPACING;
                                                    const totalMatches = roundMatches.length;
                                                    
                                                    let y;
                                                    if (roundIndex === 0) {
                                                        // R1: Position based on parent R2 match position
                                                        // Find the next match (R2 parent)
                                                        const nextMatch = matches.find(m => m.id === match.next_match_id);
                                                        if (nextMatch) {
                                                            // Find R2 matches and their positions
                                                            const r2Matches = matches.filter(m => m.round === 2);
                                                            const r2Index = r2Matches.findIndex(m => m.id === nextMatch.id);
                                                            
                                                            if (r2Index !== -1) {
                                                                // Calculate R2 position using updated spacing logic
                                                                const allRoundsCount = Array.from(new Set(matches.map(m => m.round))).length;
                                                                const r2TotalMatches = r2Matches.length;
                                                                const r2Spacing = computeRoundSpacing(1, r2TotalMatches, SINGLE_ELIM_BASE_SPACING, true, allRoundsCount);
                                                                const r2StartY = r2TotalMatches > 1 ? -(r2TotalMatches - 1) * r2Spacing / 2 : 0;
                                                                const r2Y = r2StartY + r2Index * r2Spacing;
                                                                
                                                                // Position R1 matches around their R2 parent
                                                                // Find which child this is (0 or 1)
                                                                const r2Children = matches.filter(m => m.next_match_id === nextMatch.id && m.round === 1);
                                                                const childIndex = r2Children.findIndex(m => m.id === match.id);
                                                                const withinPairGap = 120; // Gap between R1 pairs
                                                                const pairOffset = (withinPairGap / 2);
                                                                
                                                                // Center the pair around R2 position
                                                                if (childIndex === 0) {
                                                                    y = r2Y - pairOffset;
                                                                } else {
                                                                    y = r2Y + pairOffset;
                                                                }
                                                            } else {
                                                                // Fallback to old logic
                                                                const pairIndex = Math.floor(matchIndex / 2);
                                                                const withinPairIndex = matchIndex % 2;
                                                                const pairGap = SINGLE_ELIM_BASE_SPACING;
                                                                const withinPairGap = matchHeight + 60; // Increased gap to prevent overlap
                                                                const totalPairs = Math.ceil(totalMatches / 2);
                                                                const totalPairHeight = (totalPairs - 1) * pairGap;
                                                                const startY = -(totalPairHeight / 2);
                                                                y = startY + (pairIndex * pairGap) + (withinPairIndex * withinPairGap);
                                                            }
                                                        } else {
                                                            // Fallback for matches without next_match_id
                                                            const pairIndex = Math.floor(matchIndex / 2);
                                                            const withinPairIndex = matchIndex % 2;
                                                            const pairGap = SINGLE_ELIM_BASE_SPACING;
                                                            const withinPairGap = matchHeight + 20;
                                                            const totalPairs = Math.ceil(totalMatches / 2);
                                                            const totalPairHeight = (totalPairs - 1) * pairGap;
                                                            const startY = -(totalPairHeight / 2);
                                                            y = startY + (pairIndex * pairGap) + (withinPairIndex * withinPairGap);
                                                        }
                                                    } else {
                                                        // R2+: Use progressive spacing
                                                        const allRounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);
                                                        const roundConfig = singleElimMetrics?.roundConfigs.get(round);
                                                        const spacing = roundConfig
                                                            ? roundConfig.spacing
                                                            : computeRoundSpacing(roundIndex, totalMatches, SINGLE_ELIM_BASE_SPACING, true, allRounds.length);
                                                        
                                                        const startY = roundConfig
                                                            ? roundConfig.startY
                                                            : (totalMatches > 1 ? -(totalMatches - 1) * spacing / 2 : 0);
                                                        y = startY + matchIndex * spacing;
                                                    }
                                                    
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
                    {Array.from({ length: maxRounds }, (_, i) => {
                        const roundNumber = i + 1;
                        let label;
                        
                        if (roundNumber === maxRounds) {
                            label = '🏆 Finals';
                        } else if (roundNumber === maxRounds - 1) {
                            label = 'Semifinals';
                        } else {
                            label = `Round ${roundNumber}`;
                        }
                        
                        return (
                            <div
                                key={i}
                                className="absolute text-gray-300 font-semibold text-sm"
                                style={{ 
                                    left: `${70 + (i * 400)}px`,
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                {label}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TreeBracket;
