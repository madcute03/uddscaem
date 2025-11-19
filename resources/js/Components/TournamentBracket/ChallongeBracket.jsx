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
const ChallongeBracket = ({ 
    matches: rawMatches = [], 
    onReportScore = null, 
    showScoreButton = true,
    enableDragDrop = false,
    onSwapTeams = null
}) => {
    const containerRef = useRef(null);
    const matchRefs = useRef({});
    const [connections, setConnections] = useState([]);
    const [matchPositions, setMatchPositions] = useState({});
    const [containerSize, setContainerSize] = useState({ width: 400, height: 400 });
    const [draggedTeam, setDraggedTeam] = useState(null); // { matchId, slot, teamName }
    const [dragOverTeam, setDragOverTeam] = useState(null); // { matchId, slot }
    
    // Normalize matches: ensure every match has an 'id' field (use temp_id as fallback)
    // Use useMemo to prevent infinite re-render loop
    const matches = React.useMemo(() => {
        return rawMatches.map(m => ({
            ...m,
            id: m.id || m.temp_id
        }));
    }, [rawMatches]);

    // Constants for layout
    const MATCH_WIDTH = 170;
    const MATCH_HEIGHT = 45;
    const ROUND_SPACING = 210; // Horizontal spacing between rounds
    const BASE_VERTICAL_GAP = 12; // Base vertical gap between matches

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
    
    // Create losers rounds grouping at component level so it's accessible across hooks
    const losersRounds = {};
    const losersRoundNumbers = losers.length > 0 ? 
        Array.from(new Set(losers.map(match => {
            // Use losers_round if available, otherwise calculate from round
            if (match.losers_round !== undefined && match.losers_round !== null) {
                return match.losers_round;
            }
            // Fallback: if round is provided, extract losers round from it
            return match.round;
        }))).sort((a, b) => a - b) : 
        [];
    
    // Organize matches by losers round
    if (losers.length > 0) {
        losersRoundNumbers.forEach(lr => {
            losersRounds[lr] = losers.filter(match => {
                const matchLR = match.losers_round !== undefined && match.losers_round !== null 
                    ? match.losers_round 
                    : match.round;
                return matchLR === lr;
            });
        });
    }
    
    console.log('Losers rounds detected:', losersRoundNumbers);
    console.log('Losers matches per round:', Object.entries(losersRounds).map(([lr, matches]) => `LR${lr}: ${matches.length}`));
    
    // Helper function for Challonge-style alternating rounds
    // Used in both hooks for positioning and path drawing
    const isEvenCount = roundIndex => roundIndex % 2 === 0;
    
    /**
     * Check if this is a double elimination bracket
     */
    const isDoubleElimination = matches.some(m => 
        m.bracket === 'losers' || m.bracket === 'winners' || m.bracket === 'grand_finals'
    );
    
    /**
     * Count teams to adapt layout for larger brackets
     */
    const teamCount = React.useMemo(() => {
        // Count unique team names across all matches
        const uniqueTeams = new Set();
        matches.forEach(match => {
            if (match.slot1 && match.slot1 !== 'TBD') uniqueTeams.add(match.slot1);
            if (match.slot2 && match.slot2 !== 'TBD') uniqueTeams.add(match.slot2);
        });
        return uniqueTeams.size;
    }, [matches]);
    
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
        
        console.log('Losers matches with rounds:', losers.map(m => ({ 
            id: m.id, 
            round: m.round, 
            losers_round: m.losers_round,
            bracket: m.bracket
        })));
        console.log('Losers round numbers:', losersRoundNumbers);
        console.log('Losers rounds object keys:', Object.keys(losersRounds));
        Object.entries(losersRounds).forEach(([lr, matches]) => {
            console.log(`  LR${lr}: ${matches.length} matches -`, matches.map(m => m.id));
        });
        
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
            
            // Step 1: For rounds 2+, calculate positions based on parent-child relationships
            // This ensures parents are centered between their children
            const winnerPositions = {};
            
            // Start from the final round (1 match) and work backwards
            // This ensures each parent is properly centered between its children
            [...winnersRoundNumbers].reverse().forEach(round => {
                const roundMatches = winnersRounds[round];
                const roundIndex = winnersRoundNumbers.indexOf(round);
                const x = roundIndex * ROUND_SPACING;
                
                roundMatches.forEach((match, matchIndex) => {
                    if (round === winnersRoundNumbers[winnersRoundNumbers.length - 1]) {
                        // Final round - position in center
                        winnerPositions[match.id] = { x, y: 0, round, matchIndex };
                    } else {
                        // Find children of this match (matches that have this match's ID as winner_to)
                        const children = winners.filter(m => m.winner_to === match.id);
                        
                        if (children.length > 0 && children.every(child => winnerPositions[child.id])) {
                            // Calculate the average Y position of the children
                            const avgY = children.reduce((sum, child) => sum + winnerPositions[child.id].y, 0) / children.length;
                            winnerPositions[match.id] = { x, y: avgY, round, matchIndex };
                        } else {
                            // Fallback if no children or children not positioned yet
                            const spacing = calculateRoundSpacing(roundIndex, roundMatches.length, 'winners');
                            const totalHeight = roundMatches.length > 1 ? (roundMatches.length - 1) * spacing : 0;
                            const startY = -totalHeight / 2;
                            winnerPositions[match.id] = { x, y: startY + (matchIndex * spacing), round, matchIndex };
                        }
                    }
                    
                    // Track min/max Y for later losers bracket positioning
                    const y = winnerPositions[match.id].y;
                    winnersMinY = Math.min(winnersMinY, y - MATCH_HEIGHT / 2);
                    winnersMaxY = Math.max(winnersMaxY, y + MATCH_HEIGHT / 2);
                });
            });
            
            // Add all winner positions to the main positions object
            Object.keys(winnerPositions).forEach(id => {
                const pos = winnerPositions[id];
                positions[id] = { ...pos, bracket: 'winners' };
            });
            
            // For first round with no children, position them at equal distances
            // relative to their parents to maintain the centered parent rule
            winnersRounds[1]?.forEach(match => {
                if (!positions[match.id]) {
                    // This is likely a first-round match with no children
                    const parentId = match.winner_to;
                    const parentPos = positions[parentId];
                    const siblingMatches = winners.filter(m => m.winner_to === parentId);
                    const matchIndex = siblingMatches.findIndex(m => m.id === match.id);
                    
                    if (parentPos && siblingMatches.length > 0) {
                        const spacing = calculateRoundSpacing(0, siblingMatches.length, 'winners');
                        const totalHeight = siblingMatches.length > 1 ? (siblingMatches.length - 1) * spacing : 0;
                        const startY = parentPos.y - (totalHeight / 2);
                        const y = startY + (matchIndex * spacing);
                        
                        positions[match.id] = { 
                            x: 0, 
                            y, 
                            round: 1, 
                            matchIndex, 
                            bracket: 'winners' 
                        };
                        
                        // Update min/max Y
                        winnersMinY = Math.min(winnersMinY, y - MATCH_HEIGHT / 2);
                        winnersMaxY = Math.max(winnersMaxY, y + MATCH_HEIGHT / 2);
                    }
                }
            });
            
            console.log('WR1 matches positioned with parent centering');

            // Position Losers Bracket - EXACT same algorithm as Winners Bracket
            let losersMinY = Infinity;
            let losersMaxY = -Infinity;
            const loserPositions = {};

            if (losersRoundNumbers.length > 0) {
                console.log('=== LOSERS BRACKET POSITIONING (Same as Winners) ===');
                console.log('Losers rounds:', losersRoundNumbers);
                
                // STEP 1: Backward pass - position parents at average of children
                // Same logic as winners bracket (lines 280-311)
                [...losersRoundNumbers].reverse().forEach(logicalRound => {
                    const roundMatches = losersRounds[logicalRound] || [];
                    const roundIndex = losersRoundNumbers.indexOf(logicalRound);
                    const x = roundIndex * ROUND_SPACING;
                    
                    roundMatches.forEach((match, matchIndex) => {
                        if (logicalRound === losersRoundNumbers[losersRoundNumbers.length - 1]) {
                            // Final round - position in center
                            loserPositions[match.id] = { x, y: 0, round: logicalRound, matchIndex };
                        } else {
                            // Find children of this match
                            const children = losers.filter(m => m.winner_to === match.id);
                            
                            if (children.length > 0 && children.every(child => loserPositions[child.id])) {
                                // Calculate the average Y position of the children
                                const avgY = children.reduce((sum, child) => sum + loserPositions[child.id].y, 0) / children.length;
                                loserPositions[match.id] = { x, y: avgY, round: logicalRound, matchIndex };
                            } else {
                                // Fallback: spacing based on match count (same count = same spacing)
                                // This ensures LR8 and LR9 have identical spacing since both have 4 matches
                                const matchCount = roundMatches.length;
                                let spacing;
                                if (matchCount >= 8) {
                                    spacing = 80; // 8+ matches: very compact
                                } else if (matchCount >= 4) {
                                    spacing = 130; // 4-7 matches: compact
                                } else if (matchCount >= 2) {
                                    spacing = 200; // 2-3 matches: medium
                                } else {
                                    spacing = 0; // 1 match: no spacing needed
                                }
                                const totalHeight = matchCount > 1 ? (matchCount - 1) * spacing : 0;
                                const startY = -totalHeight / 2;
                                loserPositions[match.id] = { x, y: startY + (matchIndex * spacing), round: logicalRound, matchIndex };
                            }
                        }
                        
                        const y = loserPositions[match.id].y;
                        losersMinY = Math.min(losersMinY, y - MATCH_HEIGHT / 2);
                        losersMaxY = Math.max(losersMaxY, y + MATCH_HEIGHT / 2);
                    });
                });
                
                // STEP 2: First round special handling - same as winners bracket (lines 321-348)
                // Position first round matches based on their parent positions
                const firstLosersRound = losersRoundNumbers[0];
                losersRounds[firstLosersRound]?.forEach(match => {
                    if (!loserPositions[match.id]) {
                        const parentId = match.winner_to;
                        const parentPos = loserPositions[parentId];
                        const siblingMatches = losers.filter(m => m.winner_to === parentId);
                        const matchIndex = siblingMatches.findIndex(m => m.id === match.id);
                        
                        if (parentPos && siblingMatches.length > 0) {
                            // Use same match-count-based spacing as fallback
                            const matchCount = siblingMatches.length;
                            let spacing;
                            if (matchCount >= 8) {
                                spacing = 80;
                            } else if (matchCount >= 4) {
                                spacing = 130;
                            } else if (matchCount >= 2) {
                                spacing = 200;
                            } else {
                                spacing = 0;
                            }
                            const totalHeight = matchCount > 1 ? (matchCount - 1) * spacing : 0;
                            const startY = parentPos.y - (totalHeight / 2);
                            const y = startY + (matchIndex * spacing);
                            
                            loserPositions[match.id] = { 
                                x: 0, 
                                y, 
                                round: firstLosersRound, 
                                matchIndex, 
                                bracket: 'losers' 
                            };
                            
                            losersMinY = Math.min(losersMinY, y - MATCH_HEIGHT / 2);
                            losersMaxY = Math.max(losersMaxY, y + MATCH_HEIGHT / 2);
                        }
                    }
                });
                
                console.log('Losers bracket positioned with parent-child centering (same as winners)');
                
                // PASS 2: Tighten child pairs and ensure perfect parent centering
                // Group all losers matches by their parent
                const grouped = {};
                losers.forEach(match => {
                    const parentId = match.winner_to;
                    if (parentId && loserPositions[parentId]) {
                        if (!grouped[parentId]) grouped[parentId] = [];
                        grouped[parentId].push(match.id);
                    }
                });
                
                // For each parent with 2 children, enforce tight 60px spacing
                Object.keys(grouped).forEach(parentId => {
                    const childIds = grouped[parentId];
                    const parentPos = loserPositions[parentId];
                    
                    if (childIds.length === 2 && parentPos) {
                        const PAIR_GAP = MATCH_HEIGHT + 13; // 60px - tight spacing for pairs
                        
                        // Sort children by current Y position
                        const sortedIds = childIds.sort((a, b) => 
                            loserPositions[a].y - loserPositions[b].y
                        );
                        
                        // Position children symmetrically around parent
                        loserPositions[sortedIds[0]].y = parentPos.y - PAIR_GAP / 2;
                        loserPositions[sortedIds[1]].y = parentPos.y + PAIR_GAP / 2;
                    } else if (childIds.length === 1 && parentPos) {
                        // Single child aligns exactly with parent
                        loserPositions[childIds[0]].y = parentPos.y;
                    }
                });
                
                console.log('PASS 2: Child pairs tightened to 60px spacing');
                
                // Add all loser positions to main positions
                Object.keys(loserPositions).forEach(id => {
                    positions[id] = { ...loserPositions[id], bracket: 'losers' };
                });
                
                console.log('Losers positions added to main positions map - ready to render');
                
                // STEP 3: Shift losers bracket below winners bracket
                const MIN_BRACKET_GAP = teamCount > 25 ? 250 : 200;
                const desiredTop = winnersMaxY + MIN_BRACKET_GAP;
                const verticalShift = desiredTop - losersMinY;
                
                // Apply shift to all losers matches
                losers.forEach(match => {
                    if (positions[match.id]) {
                        positions[match.id].y += verticalShift;
                    }
                });
                
                // Update bounds
                losersMinY += verticalShift;
                losersMaxY += verticalShift;
                
                console.log('Losers bracket shifted below winners. Range:', losersMinY.toFixed(1), 'to', losersMaxY.toFixed(1));
            }
            
            // Position Grand Finals with clean alignment
            if (grandFinals.length > 0) {
                // Position right after winners bracket
                const winnersX = winnersRoundNumbers.length * ROUND_SPACING;
                grandFinals.forEach((match, index) => {
                    const x = winnersX;
                    // Position near the center of winners bracket vertically for cleaner look
                    const winnersCenter = (winnersMinY + winnersMaxY) / 2;
                    const y = winnersCenter + (index * (MATCH_HEIGHT + 40));
                    positions[match.id] = { 
                        x, 
                        y, 
                        round: match.round, 
                        matchIndex: index, 
                        bracket: 'grand_finals' 
                    };
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
                    
                    positions[match.id] = { 
                        x, 
                        y, 
                        round, 
                        matchIndex 
                    };
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
                        const gap = MATCH_HEIGHT + 13;
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
        
        // Verify total positions created:
        console.log('Total positions created:', Object.keys(positions).length);
        console.log('Position keys:', Object.keys(positions).slice(0, 10)); // Show first 10 IDs
        
        // Find missing positions
        const missingPositions = matches.filter(m => !positions[m.id]);
        console.log('Missing positions for matches:', missingPositions.map(m => ({ id: m.id, round: m.round, bracket: m.bracket })));
        
        // Handle missing positions (usually losers bracket with large team count)
        if (missingPositions.length > 0) {
            console.warn('⚠️ Found missing positions for matches:', missingPositions.length);
            
            // For any missing losers bracket positions, add them with default values
            missingPositions.forEach(match => {
                if (match.bracket === 'losers') {
                    const losersRound = match.losers_round || match.round;
                    const roundIndex = losersRoundNumbers.indexOf(losersRound);
                    
                    if (roundIndex !== -1) {
                        // Look for matches in same round to position close to them
                        const sameRoundMatches = losers.filter(m => 
                            (m.losers_round || m.round) === losersRound && 
                            positions[m.id] // Only consider matches that have positions
                        );
                        
                        let x = roundIndex * ROUND_SPACING;
                        let y;
                        
                        if (sameRoundMatches.length > 0) {
                            // Position relative to other matches in the same round
                            const avgY = sameRoundMatches.reduce(
                                (sum, m) => sum + positions[m.id].y, 0
                            ) / sameRoundMatches.length;
                            
                            // Use average position plus offset to avoid overlap
                            y = avgY + (120 * ((missingPositions.indexOf(match) % 4) - 1.5));
                        } else {
                            // Fallback positioning: place near the top of the losers block
                            const baseTop = Number.isFinite(losersMinY)
                                ? losersMinY
                                : (winnersMaxY + 300);
                            y = baseTop + (200 * (missingPositions.indexOf(match) % 4));
                        }
                        
                        positions[match.id] = {
                            x, 
                            y, 
                            round: losersRound, 
                            matchIndex: 0, 
                            bracket: 'losers'
                        };
                        
                        console.log(`Added missing position for ${match.id} at (${x}, ${y})`);
                    } else {
                        // If losersRound is not in losersRoundNumbers, add it
                        console.warn(`⚠️ Match ${match.id} has losers_round ${losersRound} which is not in losersRoundNumbers`);
                        const x = losersRoundNumbers.length * ROUND_SPACING;
                        const y = losersStartY + (losersRoundNumbers.length * 100);
                        
                        positions[match.id] = {
                            x, 
                            y, 
                            round: losersRound, 
                            matchIndex: 0, 
                            bracket: 'losers'
                        };
                        console.log(`Added position for out-of-sequence round match ${match.id}`);
                    }
                } else if (match.bracket === 'grand_finals') {
                    // Handle missing grand finals match
                    const winnersX = winnersRoundNumbers.length * ROUND_SPACING;
                    const winnersCenter = (winnersMinY + winnersMaxY) / 2;
                    positions[match.id] = { 
                        x: winnersX, 
                        y: winnersCenter, 
                        round: match.round, 
                        matchIndex: 0, 
                        bracket: 'grand_finals' 
                    };
                    console.log(`Added missing position for grand finals ${match.id}`);
                }
            });
            
            // Check if we still have missing positions and warn about them
            const stillMissing = matches.filter(m => !positions[m.id]);
            if (stillMissing.length > 0) {
                console.error('❌ Still missing positions after fix attempt:', stillMissing.map(m => ({ id: m.id })));
            }
        }
        
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
                        
                        // Create clean right-angled paths like in winners bracket
                        const midX = x1 + (x2 - x1) / 2;
                        
                        // Use the same clean right-angled paths for all matches
                        // This is key to achieving the consistent winners bracket look
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
                        
                        // Create clean right-angled paths like in winners bracket
                        const midX = x1 + (x2 - x1) / 2;
                        
                        // Use the same clean right-angled paths for ALL connections
                        // This consistency is what makes the winners bracket look so clean
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
            setContainerSize({ width: 800, height: teamCount > 25 ? 1200 : 600 });
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
        
        const paddingX = 100; // Horizontal padding
        const paddingTop = 100; // Top padding
        const paddingBottom = 50; // Reduced bottom padding
        const width = maxX - minX + paddingX * 2;
        const height = maxY - minY + paddingTop + paddingBottom;
        
        console.log('Container size calculated:', { width, height, minY, maxY });
        
        setContainerSize({ width, height, offsetX: -minX + paddingX, offsetY: -minY + paddingTop });
    }, [matchPositions]);

    /**
     * Drag and drop handlers for individual teams
     */
    const handleTeamDragStart = (e, match, slot, teamName) => {
        if (!enableDragDrop || match.bracket === 'losers' || match.bracket === 'grand_finals' || teamName === 'TBD') {
            e.preventDefault();
            return;
        }
        setDraggedTeam({ matchId: match.id, slot, teamName });
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();
    };

    const handleTeamDragOver = (e, match, slot) => {
        if (!enableDragDrop || !draggedTeam || match.bracket === 'losers' || match.bracket === 'grand_finals') {
            return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverTeam({ matchId: match.id, slot });
        e.stopPropagation();
    };

    const handleTeamDragLeave = () => {
        setDragOverTeam(null);
    };

    const handleTeamDrop = (e, targetMatch, targetSlot) => {
        e.preventDefault();
        e.stopPropagation();
        if (!enableDragDrop || !draggedTeam || !onSwapTeams) return;
        
        if (targetMatch.bracket !== 'losers' && targetMatch.bracket !== 'grand_finals') {
            // Don't swap if it's the same team
            if (draggedTeam.matchId !== targetMatch.id || draggedTeam.slot !== targetSlot) {
                onSwapTeams(draggedTeam.matchId, draggedTeam.slot, targetMatch.id, targetSlot);
            }
        }
        
        setDraggedTeam(null);
        setDragOverTeam(null);
    };

    const handleTeamDragEnd = () => {
        setDraggedTeam(null);
        setDragOverTeam(null);
    };

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
        const isTeam1Draggable = enableDragDrop && match.bracket !== 'losers' && match.bracket !== 'grand_finals' && team1 !== 'TBD';
        const isTeam2Draggable = enableDragDrop && match.bracket !== 'losers' && match.bracket !== 'grand_finals' && team2 !== 'TBD';
        const isTeam1DraggedOver = dragOverTeam?.matchId === match.id && dragOverTeam?.slot === 1;
        const isTeam2DraggedOver = dragOverTeam?.matchId === match.id && dragOverTeam?.slot === 2;
        const isTeam1BeingDragged = draggedTeam?.matchId === match.id && draggedTeam?.slot === 1;
        const isTeam2BeingDragged = draggedTeam?.matchId === match.id && draggedTeam?.slot === 2;

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
                className={`absolute bg-gray-800 border ${borderColor} rounded shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200`}
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
                        className={`absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-md ${
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
                    <div className="flex-1 flex flex-col justify-center pl-4 pr-1.5 py-0.5">
                        {/* Team 1 */}
                        <div 
                            draggable={isTeam1Draggable}
                            onDragStart={(e) => handleTeamDragStart(e, match, 1, team1)}
                            onDragOver={(e) => handleTeamDragOver(e, match, 1)}
                            onDragLeave={handleTeamDragLeave}
                            onDrop={(e) => handleTeamDrop(e, match, 1)}
                            onDragEnd={handleTeamDragEnd}
                            className={`flex items-center justify-between text-[11px] font-semibold mt-0.5 px-0.5 py-0.5 rounded-sm transition-all ${
                                hasWinner && match.winner_slot === 1 
                                    ? 'bg-green-600 text-white' 
                                    : 'text-gray-300'
                            } ${
                                isTeam1Draggable ? 'cursor-move hover:bg-gray-700' : ''
                            } ${
                                isTeam1BeingDragged ? 'opacity-30' : ''
                            } ${
                                isTeam1DraggedOver ? 'ring-2 ring-blue-400 bg-blue-900/30' : ''
                            }`}
                            title={isTeam1Draggable ? 'Drag to swap this team' : ''}
                        >
                            <span className="truncate flex-1">{team1}</span>
                            {match.team1_score !== undefined && (
                                <span className="ml-2 font-bold">{match.team1_score}</span>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-600 my-0.5"></div>

                        {/* Team 2 */}
                        <div 
                            draggable={isTeam2Draggable}
                            onDragStart={(e) => handleTeamDragStart(e, match, 2, team2)}
                            onDragOver={(e) => handleTeamDragOver(e, match, 2)}
                            onDragLeave={handleTeamDragLeave}
                            onDrop={(e) => handleTeamDrop(e, match, 2)}
                            onDragEnd={handleTeamDragEnd}
                            className={`flex items-center justify-between text-[11px] font-semibold px-0.5 py-0.5 rounded-sm transition-all ${
                                hasWinner && match.winner_slot === 2 
                                    ? 'bg-green-600 text-white' 
                                    : 'text-gray-300'
                            } ${
                                isTeam2Draggable ? 'cursor-move hover:bg-gray-700' : ''
                            } ${
                                isTeam2BeingDragged ? 'opacity-30' : ''
                            } ${
                                isTeam2DraggedOver ? 'ring-2 ring-blue-400 bg-blue-900/30' : ''
                            }`}
                            title={isTeam2Draggable ? 'Drag to swap this team' : ''}
                        >
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
                            className="mr-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded p-1 flex items-center justify-center shadow transition-all duration-200"
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
                                className="w-3 h-3"
                            >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Match number badge */}
                <div className="absolute -top-1 -left-1 bg-blue-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
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
                                strokeWidth="2"
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
