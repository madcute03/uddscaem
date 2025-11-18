import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ChallongeBracket from '@/Components/TournamentBracket/ChallongeBracket';
import axios from 'axios';

export default function BracketTest({ auth }) {
    const [selectedTeamSize, setSelectedTeamSize] = useState(26);
    const [bracketData, setBracketData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Available team sizes to test
    const teamSizes = [25, 26, 27, 28, 29, 30, 31, 32];
    
    // Load bracket data for the selected team size
    const loadBracketData = async (teamSize) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/api/challonge-de/demo/${teamSize}`);
            if (response.data) {
                setBracketData(response.data);
            }
        } catch (error) {
            console.error('Error loading bracket:', error);
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
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Bracket Visualization Test</h2>}
        >
            <Head title="Bracket Test" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-2xl font-bold mb-4">Double Elimination Bracket Test</h1>
                            
                            {/* Team size selector */}
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold mb-2">Select Team Size:</h2>
                                <div className="flex flex-wrap gap-2">
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
                            </div>
                            
                            {/* Display bracket status */}
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <p className="text-lg">Loading bracket data...</p>
                                </div>
                            ) : bracketData ? (
                                <div>
                                    <div className="mb-4 p-4 bg-gray-100 rounded">
                                        <h3 className="text-lg font-semibold">Bracket Statistics:</h3>
                                        <p>Total Matches: {bracketData.matches?.length || 0}</p>
                                        <p>Winners Matches: {bracketData.matches?.filter(m => m.bracket === 'winners').length || 0}</p>
                                        <p>Losers Matches: {bracketData.matches?.filter(m => m.bracket === 'losers').length || 0}</p>
                                        <p>Winners Rounds: {bracketData.winners_rounds}</p>
                                        <p>Losers Rounds: {bracketData.losers_rounds}</p>
                                    </div>
                                    
                                    {/* Display the bracket with our fixed visualization */}
                                    <div className="bg-gray-900 rounded-lg p-4">
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
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
