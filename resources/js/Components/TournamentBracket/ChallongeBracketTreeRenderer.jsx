/**
 * ChallongeBracketTreeRenderer.jsx
 * 
 * Complete Challonge-style tree bracket renderer based on research analysis
 * Implements exact positioning algorithms observed in Challonge brackets
 * 
 * This component replaces the old tree bracket structure with proper
 * binary tree positioning and L-shaped connections matching Challonge
 */

import React, { useMemo } from 'react';

const ChallongeBracketTreeRenderer = ({ 
    matches = [], 
    bracketType = 'single', 
    teams = [],
    containerWidth = 1200,
    containerHeight = 600 
}) => {
    
    // ========================================================================
    // CONFIGURATION (based on research analysis)
    // ========================================================================
    
    const CONFIG = {
        ROUND_WIDTH: 200,
        MATCH_WIDTH: 160,
        MATCH_HEIGHT: 60,
        CONNECTION_WIDTH: 40,
        MARGIN: 20,
        LOSERS_OFFSET: 400,
        
        COLORS: {
            MATCH_BG: '#374151',
            MATCH_BORDER: '#4B5563',
            MATCH_HOVER: '#4B5563', 
            CONNECTION: '#6B7280',
            TEXT: '#F9FAFB',
            MUTED: '#9CA3AF'
        }
    };
    
    // ========================================================================
    // DATA PROCESSING
    // ========================================================================
    
    const processedData = useMemo(() => {
        if (!matches.length) return { rounds: [], connections: [] };
        
        // Group matches by bracket and round
        const winnersByRound = {};
        const losersByRound = {};
        const grandFinals = [];
        
        matches.forEach(match => {
            if (match.bracket === 'winners') {
                const round = match.round || 1;
                if (!winnersByRound[round]) winnersByRound[round] = [];
                winnersByRound[round].push(match);
            } else if (match.bracket === 'losers') {
                const round = match.losers_round || match.round || 1;
                if (!losersByRound[round]) losersByRound[round] = [];
                losersByRound[round].push(match);
            } else if (match.bracket === 'grand_finals') {
                grandFinals.push(match);
            }
        });
        
        return {
            winnersByRound,
            losersByRound,
            grandFinals,
            totalWinnersRounds: Object.keys(winnersByRound).length,
            totalLosersRounds: Object.keys(losersByRound).length
        };
    }, [matches]);
    
    // ========================================================================
    // POSITIONING ALGORITHMS
    // ========================================================================
    
    const calculatePositions = (roundMatches, roundNumber, isLosers = false, totalRounds = 1) => {
        const positions = [];
        const matchCount = roundMatches.length;
        
        if (matchCount === 0) return positions;
        
        // Calculate vertical spacing
        const availableHeight = containerHeight - (isLosers ? CONFIG.LOSERS_OFFSET + 100 : 100);
        const spacing = availableHeight / (matchCount + 1);
        
        roundMatches.forEach((match, index) => {
            const yPosition = spacing * (index + 1) + (isLosers ? CONFIG.LOSERS_OFFSET : 0);
            const xPosition = CONFIG.MARGIN + (CONFIG.ROUND_WIDTH * (roundNumber - 1));
            
            positions.push({
                match,
                x: xPosition,
                y: yPosition,
                width: CONFIG.MATCH_WIDTH,
                height: CONFIG.MATCH_HEIGHT,
                roundNumber,
                isLosers
            });
        });
        
        return positions;
    };
    
    const calculateConnections = (allPositions) => {
        const connections = [];
        
        allPositions.forEach(pos => {
            const match = pos.match;
            
            // Find matches that feed into this match
            const sourceMatches = allPositions.filter(sourcePos => {
                const sourceMatch = sourcePos.match;
                return sourceMatch.winner_to === match.id || 
                       sourceMatch.loser_to === match.id ||
                       (match.previous_match_1 && sourceMatch.id === match.previous_match_1) ||
                       (match.previous_match_2 && sourceMatch.id === match.previous_match_2);
            });
            
            sourceMatches.forEach(sourcePos => {
                connections.push(createConnection(sourcePos, pos));
            });
        });
        
        return connections;
    };
    
    const createConnection = (from, to) => {
        const fromCenterX = from.x + from.width;
        const fromCenterY = from.y + (from.height / 2);
        const toCenterX = to.x;
        const toCenterY = to.y + (to.height / 2);
        
        // Create L-shaped connection
        const midX = fromCenterX + (CONFIG.CONNECTION_WIDTH / 2);
        
        return {
            id: `${from.match.id}-to-${to.match.id}`,
            path: `M${fromCenterX},${fromCenterY} L${midX},${fromCenterY} L${midX},${toCenterY} L${toCenterX},${toCenterY}`,
            fromMatch: from.match.id,
            toMatch: to.match.id
        };
    };
    
    // ========================================================================
    // RENDER CALCULATIONS
    // ========================================================================
    
    const renderData = useMemo(() => {
        const allPositions = [];
        
        // Calculate Winners Bracket positions
        Object.entries(processedData.winnersByRound).forEach(([round, roundMatches]) => {
            const positions = calculatePositions(roundMatches, parseInt(round), false, processedData.totalWinnersRounds);
            allPositions.push(...positions);
        });
        
        // Calculate Losers Bracket positions (if double elimination)
        if (bracketType === 'double') {
            Object.entries(processedData.losersByRound).forEach(([round, roundMatches]) => {
                const positions = calculatePositions(roundMatches, parseInt(round), true, processedData.totalLosersRounds);
                allPositions.push(...positions);
            });
        }
        
        // Calculate Grand Finals positions
        if (processedData.grandFinals.length > 0) {
            const finalRound = Math.max(processedData.totalWinnersRounds, processedData.totalLosersRounds) + 1;
            const gfPositions = calculatePositions(processedData.grandFinals, finalRound, false);
            allPositions.push(...gfPositions);
        }
        
        // Calculate connections
        const connections = calculateConnections(allPositions);
        
        // Calculate actual container dimensions needed
        const maxX = Math.max(...allPositions.map(p => p.x + p.width)) + CONFIG.MARGIN;
        const maxY = Math.max(...allPositions.map(p => p.y + p.height)) + 50;
        
        return {
            positions: allPositions,
            connections,
            containerWidth: Math.max(maxX, containerWidth),
            containerHeight: Math.max(maxY, containerHeight)
        };
    }, [processedData, bracketType, containerWidth, containerHeight]);
    
    // ========================================================================
    // MATCH RENDERING
    // ========================================================================
    
    const renderMatch = (position) => {
        const { match, x, y, width, height } = position;
        
        return (
            <g key={match.id} transform={`translate(${x}, ${y})`}>
                {/* Match Container */}
                <rect
                    width={width}
                    height={height}
                    fill={CONFIG.COLORS.MATCH_BG}
                    stroke={CONFIG.COLORS.MATCH_BORDER}
                    strokeWidth="1"
                    rx="8"
                    className="hover:fill-gray-600 transition-colors"
                />
                
                {/* Team 1 */}
                <text
                    x="8"
                    y="20"
                    fill={CONFIG.COLORS.TEXT}
                    fontSize="12"
                    fontWeight="500"
                >
                    {match.team1_name || 'TBD'}
                </text>
                
                {/* Team 2 */}
                <text
                    x="8"
                    y="40"
                    fill={CONFIG.COLORS.TEXT}
                    fontSize="12"
                    fontWeight="500"
                >
                    {match.team2_name || 'TBD'}
                </text>
                
                {/* Match ID */}
                <text
                    x={width - 8}
                    y="15"
                    fill={CONFIG.COLORS.MUTED}
                    fontSize="10"
                    textAnchor="end"
                >
                    #{match.match_number || match.id}
                </text>
                
                {/* Round Label */}
                <text
                    x="8"
                    y="55"
                    fill={CONFIG.COLORS.MUTED}
                    fontSize="10"
                >
                    {match.round_name || `Round ${match.round}`}
                </text>
            </g>
        );
    };
    
    // ========================================================================
    // CONNECTION RENDERING
    // ========================================================================
    
    const renderConnections = () => {
        return renderData.connections.map(connection => (
            <path
                key={connection.id}
                d={connection.path}
                stroke={CONFIG.COLORS.CONNECTION}
                strokeWidth="2"
                fill="none"
                opacity="0.7"
            />
        ));
    };
    
    // ========================================================================
    // MAIN RENDER
    // ========================================================================
    
    if (!matches.length) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                No bracket data available
            </div>
        );
    }
    
    return (
        <div className="bracket-tree-container bg-gray-900 rounded-lg p-4 overflow-auto">
            <svg 
                width={renderData.containerWidth} 
                height={renderData.containerHeight}
                className="w-full h-auto"
            >
                {/* Background */}
                <rect 
                    width="100%" 
                    height="100%" 
                    fill="transparent"
                />
                
                {/* Connection Lines */}
                <g className="connections">
                    {renderConnections()}
                </g>
                
                {/* Matches */}
                <g className="matches">
                    {renderData.positions.map(renderMatch)}
                </g>
                
                {/* Round Labels */}
                <g className="round-labels">
                    {/* Winners Bracket Labels */}
                    {Array.from({ length: processedData.totalWinnersRounds }, (_, i) => (
                        <text
                            key={`wr-${i + 1}`}
                            x={CONFIG.MARGIN + (CONFIG.ROUND_WIDTH * i) + (CONFIG.MATCH_WIDTH / 2)}
                            y="30"
                            fill={CONFIG.COLORS.TEXT}
                            fontSize="14"
                            fontWeight="600"
                            textAnchor="middle"
                        >
                            {i === processedData.totalWinnersRounds - 1 ? 'Finals' :
                             i === processedData.totalWinnersRounds - 2 ? 'Semifinals' :
                             `Round ${i + 1}`}
                        </text>
                    ))}
                    
                    {/* Losers Bracket Labels */}
                    {bracketType === 'double' && Array.from({ length: processedData.totalLosersRounds }, (_, i) => (
                        <text
                            key={`lr-${i + 1}`}
                            x={CONFIG.MARGIN + (CONFIG.ROUND_WIDTH * i) + (CONFIG.MATCH_WIDTH / 2)}
                            y={CONFIG.LOSERS_OFFSET - 20}
                            fill={CONFIG.COLORS.TEXT}
                            fontSize="14"
                            fontWeight="600"
                            textAnchor="middle"
                        >
                            Losers Round {i + 1}
                        </text>
                    ))}
                </g>
            </svg>
        </div>
    );
};

export default ChallongeBracketTreeRenderer;
