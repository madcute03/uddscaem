import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChallongeBracket from '@/Components/TournamentBracket/ChallongeBracket';
import axios from 'axios';

export default function DoubleElimTest({ auth }) {
    const [selectedTeamSize, setSelectedTeamSize] = useState(8);
    const [bracketData, setBracketData] = useState(null);
    const [simulationLog, setSimulationLog] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    
    // Available team sizes to test
    const teamSizes = [4, 8, 16, 26, 32];
    
    // Load bracket data for the selected team size
    const loadBracketData = async (teamSize) => {
        setIsLoading(true);
        setSimulationLog([]);
        try {
            const response = await axios.get(`/api/challonge-de/demo/${teamSize}`);
            if (response.data) {
                // Transform data to ensure team names are numeric for easier tracking
                const transformedData = {
                    ...response.data,
                    matches: response.data.matches.map(match => ({
                        ...match,
                        team1: match.team1 ? `Team ${match.team1_seed || '?'}` : 'TBD',
                        team2: match.team2 ? `Team ${match.team2_seed || '?'}` : 'TBD',
                    }))
                };
                
                setBracketData(transformedData);
                addToLog(`Loaded ${teamSize} team bracket with ${transformedData.matches.length} matches`);
                addToLog(`Winners Bracket: ${transformedData.matches.filter(m => m.bracket === 'winners').length} matches`);
                addToLog(`Losers Bracket: ${transformedData.matches.filter(m => m.bracket === 'losers').length} matches`);
                addToLog(`Grand Finals: ${transformedData.matches.filter(m => m.bracket === 'grand_finals').length} matches`);
            }
        } catch (error) {
            console.error('Error loading bracket:', error);
            addToLog(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Load initial data
    useEffect(() => {
        loadBracketData(selectedTeamSize);
    }, []);
    
    // Handle team size change
    const handleTeamSizeChange = (size) => {
        setSelectedTeamSize(size);
        loadBracketData(size);
    };
    
    // Log helper function
    const addToLog = (message) => {
        setSimulationLog(prev => [
            ...prev, 
            { id: Date.now(), text: message }
        ]);
    };
    
    // Simulate the tournament to verify double elimination logic
    const runSimulation = async () => {
        if (!bracketData || !bracketData.matches || isSimulating) return;
        
        setIsSimulating(true);
        addToLog('Starting tournament simulation...');
        
        // Create a copy of the matches to manipulate
        const matches = JSON.parse(JSON.stringify(bracketData.matches));
        
        // Track team losses
        const teamLosses = {};
        const eliminatedTeams = new Set();
        const advancingTeams = new Set();
        
        // Set initial team losses to 0
        matches.forEach(match => {
            if (match.team1 && match.team1 !== 'TBD' && !teamLosses[match.team1]) {
                teamLosses[match.team1] = 0;
            }
            if (match.team2 && match.team2 !== 'TBD' && !teamLosses[match.team2]) {
                teamLosses[match.team2] = 0;
            }
        });
        
        // Helper to find the next match by ID
        const findMatchById = (matchId) => {
            return matches.find(m => m.id === matchId);
        };
        
        // Process the matches in order (round by round)
        // Start with winners bracket, then losers, then grand finals
        const winnerMatches = matches.filter(m => m.bracket === 'winners')
            .sort((a, b) => a.round - b.round || a.match_number - b.match_number);
            
        const loserMatches = matches.filter(m => m.bracket === 'losers')
            .sort((a, b) => {
                const aRound = a.losers_round || a.round;
                const bRound = b.losers_round || b.round;
                return aRound - bRound || a.match_number - b.match_number;
            });
            
        const grandFinalsMatches = matches.filter(m => m.bracket === 'grand_finals');
        
        // Process winners bracket
        addToLog('Processing Winners Bracket...');
        for (const match of winnerMatches) {
            if (match.team1 === 'TBD' || match.team2 === 'TBD') {
                addToLog(`Skipping match #${match.match_number} - not all teams determined yet`);
                continue;
            }
            
            // Randomly determine winner (for simulation purposes)
            const winnerIndex = Math.random() > 0.5 ? 1 : 2;
            const winner = winnerIndex === 1 ? match.team1 : match.team2;
            const loser = winnerIndex === 1 ? match.team2 : match.team1;
            
            addToLog(`Match #${match.match_number}: ${match.team1} vs ${match.team2} -> ${winner} wins`);
            
            // Record the loss
            teamLosses[loser] = (teamLosses[loser] || 0) + 1;
            addToLog(`  ${loser} now has ${teamLosses[loser]} loss(es)`);
            
            // Process winner advancing to next match
            if (match.winner_to) {
                const nextMatch = findMatchById(match.winner_to);
                if (nextMatch) {
                    if (!nextMatch.team1) {
                        nextMatch.team1 = winner;
                        addToLog(`  ${winner} advances to match #${nextMatch.match_number} as team1`);
                    } else if (!nextMatch.team2) {
                        nextMatch.team2 = winner;
                        addToLog(`  ${winner} advances to match #${nextMatch.match_number} as team2`);
                    } else {
                        addToLog(`  Error: Next match #${nextMatch.match_number} already has both teams assigned`);
                    }
                }
            } else {
                advancingTeams.add(winner);
                addToLog(`  ${winner} advances to grand finals`);
            }
            
            // Process loser going to losers bracket
            if (match.loser_to) {
                const nextLosersMatch = findMatchById(match.loser_to);
                if (nextLosersMatch) {
                    if (!nextLosersMatch.team1) {
                        nextLosersMatch.team1 = loser;
                        addToLog(`  ${loser} goes to losers match #${nextLosersMatch.match_number} as team1`);
                    } else if (!nextLosersMatch.team2) {
                        nextLosersMatch.team2 = loser;
                        addToLog(`  ${loser} goes to losers match #${nextLosersMatch.match_number} as team2`);
                    } else {
                        addToLog(`  Error: Losers match #${nextLosersMatch.match_number} already has both teams assigned`);
                    }
                }
            }
        }
        
        // Process losers bracket
        addToLog('Processing Losers Bracket...');
        for (const match of loserMatches) {
            if (match.team1 === 'TBD' || match.team2 === 'TBD') {
                addToLog(`Skipping losers match #${match.match_number} - not all teams determined yet`);
                continue;
            }
            
            // Randomly determine winner (for simulation purposes)
            const winnerIndex = Math.random() > 0.5 ? 1 : 2;
            const winner = winnerIndex === 1 ? match.team1 : match.team2;
            const loser = winnerIndex === 1 ? match.team2 : match.team1;
            
            addToLog(`Losers Match #${match.match_number}: ${match.team1} vs ${match.team2} -> ${winner} wins`);
            
            // Record the loss and check for elimination
            teamLosses[loser] = (teamLosses[loser] || 0) + 1;
            
            if (teamLosses[loser] >= 2) {
                eliminatedTeams.add(loser);
                addToLog(`  ${loser} now has ${teamLosses[loser]} losses and is ELIMINATED!`);
            } else {
                addToLog(`  ${loser} now has ${teamLosses[loser]} loss(es)`);
            }
            
            // Process winner advancing to next match
            if (match.winner_to) {
                const nextMatch = findMatchById(match.winner_to);
                if (nextMatch) {
                    if (!nextMatch.team1) {
                        nextMatch.team1 = winner;
                        addToLog(`  ${winner} advances to match #${nextMatch.match_number} as team1`);
                    } else if (!nextMatch.team2) {
                        nextMatch.team2 = winner;
                        addToLog(`  ${winner} advances to match #${nextMatch.match_number} as team2`);
                    } else {
                        addToLog(`  Error: Next match #${nextMatch.match_number} already has both teams assigned`);
                    }
                }
            } else {
                advancingTeams.add(winner);
                addToLog(`  ${winner} advances to grand finals`);
            }
        }
        
        // Process grand finals
        if (grandFinalsMatches.length > 0) {
            addToLog('Processing Grand Finals...');
            
            // Update team assignments for grand finals
            const gfMatch = grandFinalsMatches[0];
            const advancingTeamsArray = Array.from(advancingTeams);
            
            if (advancingTeamsArray.length >= 1) {
                gfMatch.team1 = advancingTeamsArray[0];
            }
            if (advancingTeamsArray.length >= 2) {
                gfMatch.team2 = advancingTeamsArray[1];
            }
            
            if (gfMatch.team1 && gfMatch.team2) {
                // Randomly determine winner
                const winnerIndex = Math.random() > 0.5 ? 1 : 2;
                const winner = winnerIndex === 1 ? gfMatch.team1 : gfMatch.team2;
                const loser = winnerIndex === 1 ? gfMatch.team2 : gfMatch.team1;
                
                addToLog(`Grand Finals: ${gfMatch.team1} vs ${gfMatch.team2} -> ${winner} wins!`);
                
                // Record the loss and check for elimination
                teamLosses[loser] = (teamLosses[loser] || 0) + 1;
                if (teamLosses[loser] >= 2) {
                    eliminatedTeams.add(loser);
                    addToLog(`  ${loser} now has ${teamLosses[loser]} losses and is ELIMINATED!`);
                } else {
                    addToLog(`  ${loser} now has ${teamLosses[loser]} loss(es)`);
                }
                
                addToLog(`TOURNAMENT CHAMPION: ${winner}!`);
            } else {
                addToLog('Grand Finals not fully populated with teams');
            }
        }
        
        // Summarize team losses
        addToLog('FINAL SUMMARY:');
        Object.entries(teamLosses).forEach(([team, losses]) => {
            addToLog(`${team}: ${losses} loss(es) ${losses >= 2 ? '- ELIMINATED' : ''}`);
        });
        
        // Verify all teams eliminated had exactly 2 losses
        const invalidEliminations = Array.from(eliminatedTeams).filter(team => teamLosses[team] !== 2);
        if (invalidEliminations.length > 0) {
            addToLog(`ERROR: Found ${invalidEliminations.length} teams eliminated with incorrect loss count!`);
            invalidEliminations.forEach(team => {
                addToLog(`  ${team} eliminated with ${teamLosses[team]} loss(es) instead of 2`);
            });
        } else {
            addToLog('SUCCESS: All eliminated teams had exactly 2 losses!');
        }
        
        // Ensure we didn't miss any double-losers
        const missedEliminations = Object.entries(teamLosses)
            .filter(([team, losses]) => losses >= 2 && !eliminatedTeams.has(team))
            .map(([team]) => team);
            
        if (missedEliminations.length > 0) {
            addToLog(`ERROR: Found ${missedEliminations.length} teams with 2+ losses that weren't eliminated!`);
            missedEliminations.forEach(team => {
                addToLog(`  ${team} has ${teamLosses[team]} losses but wasn't eliminated`);
            });
        }
        
        setIsSimulating(false);
    };
    
    // Transform backend data to ChallongeBracket format
    const transformMatchesForBracket = (data) => {
        if (!data || !data.matches) return [];
        
        return data.matches.map(match => ({
            id: match.id,
            match_number: match.match_number,
            round: match.round,
            bracket: match.bracket,
            losers_round: match.losers_round,
            slot1: match.team1 || 'TBD',
            slot2: match.team2 || 'TBD',
            winner_to: match.winner_to,
            loser_to: match.loser_to,
            previous_match_1: match.previous_match_1,
            previous_match_2: match.previous_match_2,
            previous_match_loser_1: match.previous_match_loser_1,
            previous_match_loser_2: match.previous_match_loser_2
        }));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Double Elimination Test</h2>}
        >
            <Head title="Double Elimination Test" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-2xl font-bold mb-4">Double Elimination Logic Test</h1>
                            <p className="mb-4 text-gray-600">This page simulates a double elimination tournament to verify that each team must lose twice before being eliminated.</p>
                            
                            {/* Team size selector */}
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold mb-2">Select Team Size:</h2>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {teamSizes.map(size => (
                                        <button
                                            key={size}
                                            onClick={() => handleTeamSizeChange(size)}
                                            className={`px-4 py-2 rounded ${
                                                selectedTeamSize === size
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-200 hover:bg-gray-300'
                                            }`}
                                        >
                                            {size} Teams
                                        </button>
                                    ))}
                                </div>
                                
                                <button
                                    onClick={runSimulation}
                                    disabled={isLoading || isSimulating || !bracketData}
                                    className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                                >
                                    {isSimulating ? 'Simulating...' : 'Run Simulation'}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Display bracket */}
                                <div className="bg-gray-100 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold mb-2">Tournament Bracket</h3>
                                    {isLoading ? (
                                        <div className="text-center py-8">
                                            <p className="text-lg">Loading bracket data...</p>
                                        </div>
                                    ) : bracketData ? (
                                        <div>
                                            <div className="mb-4 p-4 bg-gray-50 rounded">
                                                <h4 className="text-md font-semibold">Bracket Statistics:</h4>
                                                <p>Total Matches: {bracketData.matches?.length || 0}</p>
                                                <p>Winners Matches: {bracketData.matches?.filter(m => m.bracket === 'winners').length || 0}</p>
                                                <p>Losers Matches: {bracketData.matches?.filter(m => m.bracket === 'losers').length || 0}</p>
                                                <p>Grand Finals: {bracketData.matches?.filter(m => m.bracket === 'grand_finals').length || 0}</p>
                                            </div>
                                            
                                            <div className="h-96 overflow-auto bg-gray-900 rounded-lg">
                                                <ChallongeBracket 
                                                    matches={transformMatchesForBracket(bracketData)} 
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-lg">No bracket data available.</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Simulation log */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Simulation Log</h3>
                                    <div className="bg-gray-100 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs">
                                        {simulationLog.length > 0 ? (
                                            <div>
                                                {simulationLog.map(entry => (
                                                    <div key={entry.id} className="mb-1">
                                                        {entry.text.startsWith('ERROR') ? (
                                                            <span className="text-red-600 font-bold">{entry.text}</span>
                                                        ) : entry.text.startsWith('SUCCESS') ? (
                                                            <span className="text-green-600 font-bold">{entry.text}</span>
                                                        ) : entry.text.includes('ELIMINATED') ? (
                                                            <span className="text-orange-600">{entry.text}</span>
                                                        ) : entry.text.includes('CHAMPION') ? (
                                                            <span className="text-blue-600 font-bold">{entry.text}</span>
                                                        ) : (
                                                            <span>{entry.text}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">Run the simulation to see results here...</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
