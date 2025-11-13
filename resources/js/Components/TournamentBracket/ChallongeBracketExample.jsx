import React from 'react';
import ChallongeBracket from './ChallongeBracket';

/**
 * Example usage of ChallongeBracket component
 * Shows sample data for 4, 8, and 16 team tournaments
 */
const ChallongeBracketExample = () => {
    
    // Example 1: 8-team tournament
    const eightTeamMatches = [
        // Round 1 (Quarterfinals)
        { id: 1, round: 1, slot1: "Seed 1", slot2: "Seed 8", winner_to: 5, team1_score: 3, team2_score: 1, winner_slot: 1 },
        { id: 2, round: 1, slot1: "Seed 4", slot2: "Seed 5", winner_to: 5, team1_score: 2, team2_score: 1, winner_slot: 1 },
        { id: 3, round: 1, slot1: "Seed 2", slot2: "Seed 7", winner_to: 6, team1_score: 3, team2_score: 0, winner_slot: 1 },
        { id: 4, round: 1, slot1: "Seed 3", slot2: "Seed 6", winner_to: 6, team1_score: 2, team2_score: 3, winner_slot: 2 },
        
        // Round 2 (Semifinals)
        { id: 5, round: 2, slot1: "Winner of 1", slot2: "Winner of 2", winner_to: 7, team1_score: 3, team2_score: 2, winner_slot: 1 },
        { id: 6, round: 2, slot1: "Winner of 3", slot2: "Winner of 4", winner_to: 7, team1_score: 1, team2_score: 2, winner_slot: 2 },
        
        // Round 3 (Finals)
        { id: 7, round: 3, slot1: "Winner of 5", slot2: "Winner of 6", winner_to: null },
    ];

    // Example 2: 4-team tournament
    const fourTeamMatches = [
        // Round 1 (Semifinals)
        { id: 1, round: 1, slot1: "Team A", slot2: "Team D", winner_to: 3 },
        { id: 2, round: 1, slot1: "Team B", slot2: "Team C", winner_to: 3 },
        
        // Round 2 (Finals)
        { id: 3, round: 2, slot1: "Winner of 1", slot2: "Winner of 2", winner_to: null },
    ];

    // Example 3: 16-team tournament
    const sixteenTeamMatches = [
        // Round 1
        { id: 1, round: 1, slot1: "Seed 1", slot2: "Seed 16", winner_to: 9 },
        { id: 2, round: 1, slot1: "Seed 8", slot2: "Seed 9", winner_to: 9 },
        { id: 3, round: 1, slot1: "Seed 4", slot2: "Seed 13", winner_to: 10 },
        { id: 4, round: 1, slot1: "Seed 5", slot2: "Seed 12", winner_to: 10 },
        { id: 5, round: 1, slot1: "Seed 2", slot2: "Seed 15", winner_to: 11 },
        { id: 6, round: 1, slot1: "Seed 7", slot2: "Seed 10", winner_to: 11 },
        { id: 7, round: 1, slot1: "Seed 3", slot2: "Seed 14", winner_to: 12 },
        { id: 8, round: 1, slot1: "Seed 6", slot2: "Seed 11", winner_to: 12 },
        
        // Round 2
        { id: 9, round: 2, slot1: "Winner of 1", slot2: "Winner of 2", winner_to: 13 },
        { id: 10, round: 2, slot1: "Winner of 3", slot2: "Winner of 4", winner_to: 13 },
        { id: 11, round: 2, slot1: "Winner of 5", slot2: "Winner of 6", winner_to: 14 },
        { id: 12, round: 2, slot1: "Winner of 7", slot2: "Winner of 8", winner_to: 14 },
        
        // Round 3 (Semifinals)
        { id: 13, round: 3, slot1: "Winner of 9", slot2: "Winner of 10", winner_to: 15 },
        { id: 14, round: 3, slot1: "Winner of 11", slot2: "Winner of 12", winner_to: 15 },
        
        // Round 4 (Finals)
        { id: 15, round: 4, slot1: "Winner of 13", slot2: "Winner of 14", winner_to: null },
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Challonge-Style Tournament Bracket
                    </h1>
                    <p className="text-gray-600">
                        React + Tailwind component with horizontal rounds and dynamic spacing
                    </p>
                </div>

                {/* Example 1: 8-team tournament */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        8-Team Tournament
                    </h2>
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <ChallongeBracket matches={eightTeamMatches} />
                    </div>
                </div>

                {/* Example 2: 4-team tournament */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        4-Team Tournament
                    </h2>
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <ChallongeBracket matches={fourTeamMatches} />
                    </div>
                </div>

                {/* Example 3: 16-team tournament */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        16-Team Tournament
                    </h2>
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <ChallongeBracket matches={sixteenTeamMatches} />
                    </div>
                </div>

                {/* Documentation */}
                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                    <h3 className="text-xl font-bold text-blue-900 mb-3">
                        📚 Component Props
                    </h3>
                    <div className="space-y-2 text-sm text-blue-800">
                        <p><strong>matches:</strong> Array of match objects</p>
                        <div className="ml-4 bg-white p-3 rounded border border-blue-200 font-mono text-xs overflow-x-auto">
                            <pre>{`{
  id: number,              // Unique match ID
  round: number,           // Round number (1, 2, 3, ...)
  slot1: string,           // Team 1 name or seed
  slot2: string,           // Team 2 name or seed
  winner_to: number|null,  // Next match ID for winner
  team1_score?: number,    // Optional: Team 1 score
  team2_score?: number,    // Optional: Team 2 score
  winner_slot?: 1|2,       // Optional: Winning slot (1 or 2)
  winner_id?: number       // Optional: Winner team ID
}`}</pre>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                    <h3 className="text-xl font-bold text-green-900 mb-3">
                        ✨ Features
                    </h3>
                    <ul className="space-y-2 text-green-800">
                        <li>✅ Horizontal layout with vertical columns per round</li>
                        <li>✅ Dynamic exponential spacing (adapts to 4-64+ teams)</li>
                        <li>✅ Smooth SVG connecting lines between matches</li>
                        <li>✅ Rounded match cards with hover effects</li>
                        <li>✅ Responsive and scrollable container</li>
                        <li>✅ Winner highlighting with green background</li>
                        <li>✅ Match number badges</li>
                        <li>✅ Automatic round labels (Round 1, Quarterfinals, Semifinals, Finals)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ChallongeBracketExample;
