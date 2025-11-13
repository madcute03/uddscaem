import React from 'react';

export default function RoundRobin({ matches = [], teams = [], bracket = {}, showScoreButton = false, onReportScore = null }) {

    // Calculate team standings
    const calculateStandings = () => {
        const standings = {};
        
        // Initialize all teams
        teams.forEach(team => {
            standings[team.name] = {
                name: team.name,
                played: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                points: 0, // 3 for win, 1 for draw, 0 for loss
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0
            };
        });

        // Process completed matches
        matches.forEach(match => {
            if (match.team1_score !== null && match.team2_score !== null) {
                const team1Name = match.team1_name || match.slot1;
                const team2Name = match.team2_name || match.slot2;
                
                if (standings[team1Name] && standings[team2Name]) {
                    standings[team1Name].played++;
                    standings[team2Name].played++;
                    
                    const score1 = parseInt(match.team1_score) || 0;
                    const score2 = parseInt(match.team2_score) || 0;
                    
                    standings[team1Name].goalsFor += score1;
                    standings[team1Name].goalsAgainst += score2;
                    standings[team2Name].goalsFor += score2;
                    standings[team2Name].goalsAgainst += score1;
                    
                    if (score1 > score2) {
                        standings[team1Name].wins++;
                        standings[team1Name].points += 3;
                        standings[team2Name].losses++;
                    } else if (score2 > score1) {
                        standings[team2Name].wins++;
                        standings[team2Name].points += 3;
                        standings[team1Name].losses++;
                    } else {
                        standings[team1Name].draws++;
                        standings[team2Name].draws++;
                        standings[team1Name].points += 1;
                        standings[team2Name].points += 1;
                    }
                }
            }
        });

        // Calculate goal difference
        Object.values(standings).forEach(team => {
            team.goalDifference = team.goalsFor - team.goalsAgainst;
        });

        // Sort by points, then goal difference, then goals for
        return Object.values(standings).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });
    };


    const standings = calculateStandings();
    const completedMatches = matches.filter(m => m.team1_score !== null && m.team2_score !== null).length;
    const totalMatches = bracket.total_matches || matches.length;
    const totalRounds = bracket.total_rounds || Math.max(...matches.map(m => m.round || 1));
    const matchesPerTeam = bracket.matches_per_team || (teams.length - 1);
    const hasByes = bracket.has_byes || false;

    return (
        <div className="space-y-6">
            {/* Tournament Progress */}
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-white font-semibold text-lg mb-4">Tournament Progress</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                        <p className="text-gray-400">Total Teams</p>
                        <p className="text-white font-medium text-xl">{teams.length}</p>
                    </div>
                    <div>
                        <p className="text-gray-400">Total Rounds</p>
                        <p className="text-white font-medium text-xl">{totalRounds}</p>
                    </div>
                    <div>
                        <p className="text-gray-400">Total Matches</p>
                        <p className="text-white font-medium text-xl">{totalMatches}</p>
                    </div>
                    <div>
                        <p className="text-gray-400">Completed</p>
                        <p className="text-white font-medium text-xl">{completedMatches}</p>
                    </div>
                    <div>
                        <p className="text-gray-400">Progress</p>
                        <p className="text-white font-medium text-xl">
                            {totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0}%
                        </p>
                    </div>
                </div>
                
                {/* Additional Info */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-700 rounded-full">
                        <span className="text-blue-400">Matches per team:</span>
                        <span className="text-white font-medium">{matchesPerTeam}</span>
                    </div>
                    {hasByes && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-900/30 border border-yellow-700 rounded-full">
                            <span className="text-yellow-400">⚠️ Has byes (odd teams)</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-700 rounded-full">
                        <span className="text-green-400">Format:</span>
                        <span className="text-white font-medium">Single Round Robin</span>
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Standings Table */}
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-white font-semibold text-lg mb-4">Current Standings</h3>
                {teams.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <p>No team data available. Please refresh the page.</p>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-600">
                                <th className="text-left py-3 px-4 text-gray-300 font-medium">Pos</th>
                                <th className="text-left py-3 px-4 text-gray-300 font-medium">Team</th>
                                <th className="text-center py-3 px-4 text-gray-300 font-medium">P</th>
                                <th className="text-center py-3 px-4 text-gray-300 font-medium">W</th>
                                <th className="text-center py-3 px-4 text-gray-300 font-medium">D</th>
                                <th className="text-center py-3 px-4 text-gray-300 font-medium">L</th>
                                <th className="text-center py-3 px-4 text-gray-300 font-medium">GD</th>
                                <th className="text-center py-3 px-4 text-gray-300 font-medium">Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map((team, index) => (
                                <tr key={team.name} className="border-b border-gray-700 hover:bg-gray-700/30">
                                    <td className="py-3 px-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                            index === 0 ? 'bg-yellow-500 text-black' :
                                            index === 1 ? 'bg-gray-400 text-black' :
                                            index === 2 ? 'bg-orange-600 text-white' :
                                            'bg-gray-600 text-white'
                                        }`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-white font-medium">{team.name}</td>
                                    <td className="py-3 px-4 text-center text-gray-300">{team.played}</td>
                                    <td className="py-3 px-4 text-center text-green-400">{team.wins}</td>
                                    <td className="py-3 px-4 text-center text-yellow-400">{team.draws}</td>
                                    <td className="py-3 px-4 text-center text-red-400">{team.losses}</td>
                                    <td className={`py-3 px-4 text-center font-medium ${
                                        team.goalDifference > 0 ? 'text-green-400' :
                                        team.goalDifference < 0 ? 'text-red-400' : 'text-gray-300'
                                    }`}>
                                        {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                                    </td>
                                    <td className="py-3 px-4 text-center text-white font-bold">{team.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Matches by Rounds */}
            <div className="space-y-6">
                {(() => {
                    // Use rounds_schedule if available, otherwise group matches by round
                    let roundsData = {};
                    
                    if (bracket.rounds_schedule) {
                        // Use the backend-generated schedule that includes byes
                        roundsData = bracket.rounds_schedule;
                    } else {
                        // Fallback: group matches by round
                        matches.forEach(match => {
                            const round = match.round || 1;
                            if (!roundsData[round]) {
                                roundsData[round] = [];
                            }
                            roundsData[round].push(match);
                        });
                    }

                    const rounds = Object.keys(roundsData).sort((a, b) => parseInt(a) - parseInt(b));

                    return rounds.map(round => {
                        const roundEntries = roundsData[round] || [];
                        const roundMatches = roundEntries.filter(entry => !entry.is_bye);
                        const roundByes = roundEntries.filter(entry => entry.is_bye);
                        const completedInRound = roundMatches.filter(m => m.team1_score !== null && m.team2_score !== null).length;
                        
                        return (
                            <div key={round} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-white font-semibold text-lg">Round {round}</h3>
                                        {roundByes.length > 0 && (
                                            <div className="flex items-center gap-2 px-2 py-1 bg-yellow-900/30 border border-yellow-700 rounded text-xs">
                                                <span className="text-yellow-400">👤</span>
                                                <span className="text-yellow-300">{roundByes[0].team1_name} has bye</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-gray-400">
                                            {completedInRound}/{roundMatches.length} completed
                                        </span>
                                        <div className="w-20 bg-gray-700 rounded-full h-2">
                                            <div 
                                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${roundMatches.length > 0 ? (completedInRound / roundMatches.length) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {roundMatches.map((match) => {
                                        const isCompleted = match.team1_score !== null && match.team2_score !== null;
                                        const team1Name = match.team1_name || match.slot1;
                                        const team2Name = match.team2_name || match.slot2;
                                        
                                        return (
                                            <div key={match.id || match.temp_id} className={`rounded-lg p-4 border transition-all duration-200 ${
                                                isCompleted 
                                                    ? 'bg-gray-700 border-green-600' 
                                                    : 'bg-gray-700 border-gray-600 hover:border-blue-500'
                                            }`}>
                                                <div className="text-xs text-gray-400 mb-3 flex items-center justify-between">
                                                    <span>Match {match.match_number || match.id}</span>
                                                    {isCompleted && (
                                                        <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                                                            Completed
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-white font-medium">{team1Name}</span>
                                                        <span className={`text-lg font-bold ${
                                                            isCompleted ? 'text-white' : 'text-gray-500'
                                                        }`}>
                                                            {isCompleted ? match.team1_score : '-'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-center">
                                                        <span className="text-gray-500 text-sm">vs</span>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-white font-medium">{team2Name}</span>
                                                        <span className={`text-lg font-bold ${
                                                            isCompleted ? 'text-white' : 'text-gray-500'
                                                        }`}>
                                                            {isCompleted ? match.team2_score : '-'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {showScoreButton && !isCompleted && onReportScore && (
                                                    <button
                                                        onClick={() => onReportScore(match)}
                                                        className="w-full mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                                                    >
                                                        Report Score
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>

        </div>
    );
}
