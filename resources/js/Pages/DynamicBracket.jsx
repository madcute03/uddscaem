import React, { useState, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function DynamicBracket({ event, registeredPlayers = [] }) {
    const [teams, setTeams] = useState([]);
    const [bracketType, setBracketType] = useState('single');
    const [generatedBracket, setGeneratedBracket] = useState(null);
    const [tournamentName, setTournamentName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedTournament, setSavedTournament] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Initialize tournament name with event title
    useEffect(() => {
        if (event) {
            setTournamentName(`${event.title} Tournament`);
        }
    }, [event]);

    // Add a new team
    const addTeam = () => {
        setTeams([...teams, { name: '', members: [] }]);
    };

    // Remove a team
    const removeTeam = (index) => {
        setTeams(teams.filter((_, i) => i !== index));
    };

    // Update team name
    const updateTeamName = (index, name) => {
        const newTeams = [...teams];
        newTeams[index].name = name;
        setTeams(newTeams);
    };

    // Auto-populate teams from registered players
    const autoPopulateTeams = () => {
        if (registeredPlayers.length === 0) {
            alert('No registered players found for this event.');
            return;
        }

        // Group by team_name if available
        const teamGroups = {};
        registeredPlayers.forEach(player => {
            const teamName = player.team_name || `Team ${player.name}`;
            if (!teamGroups[teamName]) {
                teamGroups[teamName] = [];
            }
            teamGroups[teamName].push(player.name);
        });

        const autoTeams = Object.keys(teamGroups).map(teamName => ({
            name: teamName,
            members: teamGroups[teamName]
        }));

        setTeams(autoTeams);
    };

    // Generate bracket
    const generateBracket = async () => {
        if (teams.length < 2) {
            alert('Please add at least 2 teams.');
            return;
        }

        if (teams.some(t => !t.name.trim())) {
            alert('Please provide names for all teams.');
            return;
        }

        setIsGenerating(true);

        try {
            const response = await axios.post('/api/bracket/generate', {
                event_id: event.id,
                teams: teams,
                bracket_type: bracketType
            });

            if (response.data.success) {
                setGeneratedBracket(response.data.bracket);
                setShowSuccess(false);
            }
        } catch (error) {
            console.error('Error generating bracket:', error);
            alert('Failed to generate bracket. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Save bracket to database
    const saveBracket = async () => {
        if (!generatedBracket) {
            alert('Please generate a bracket first.');
            return;
        }

        if (!tournamentName.trim()) {
            alert('Please provide a tournament name.');
            return;
        }

        setIsSaving(true);

        try {
            const response = await axios.post('/api/bracket/store', {
                event_id: event.id,
                tournament_name: tournamentName,
                bracket_type: bracketType,
                teams: generatedBracket.teams,
                matches: generatedBracket.matches,
                total_rounds: generatedBracket.total_rounds
            });

            if (response.data.success) {
                setSavedTournament(response.data.tournament);
                setShowSuccess(true);
            }
        } catch (error) {
            console.error('Error saving bracket:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            alert('Failed to save bracket: ' + errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Dynamic Bracket - ${event?.title}`} />
            
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link 
                            href={route('dashboard')}
                            className="inline-flex items-center text-slate-300 hover:text-white mb-4 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Dashboard
                        </Link>
                        
                        <h1 className="text-3xl font-bold text-white mb-2">Dynamic Bracketing System</h1>
                        <p className="text-gray-400">{event?.title}</p>
                    </div>

                    {/* Success Message */}
                    {showSuccess && (
                        <div className="mb-6 bg-green-900/50 border border-green-700 rounded-lg p-4">
                            <div className="flex items-center">
                                <svg className="w-6 h-6 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h3 className="text-green-100 font-semibold">Bracket Saved Successfully!</h3>
                                    <p className="text-green-200 text-sm">Your tournament bracket has been saved to the database.</p>
                                </div>
                            </div>
                            <Link
                                href={route('events.show', event.id)}
                                className="mt-3 inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                                View Event Page
                            </Link>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Panel - Team Input */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Setup Teams</h2>
                            
                            {/* Tournament Name */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tournament Name
                                </label>
                                <input
                                    type="text"
                                    value={tournamentName}
                                    onChange={(e) => setTournamentName(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter tournament name"
                                />
                            </div>

                            {/* Bracket Type Selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Bracket Type
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setBracketType('single')}
                                        className={`px-4 py-2 rounded-lg transition-colors ${
                                            bracketType === 'single'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        Single
                                    </button>
                                    <button
                                        onClick={() => setBracketType('double')}
                                        className={`px-4 py-2 rounded-lg transition-colors ${
                                            bracketType === 'double'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        Double
                                    </button>
                                    <button
                                        onClick={() => setBracketType('round-robin')}
                                        className={`px-4 py-2 rounded-lg transition-colors ${
                                            bracketType === 'round-robin'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        Round Robin
                                    </button>
                                </div>
                            </div>

                            {/* Auto-populate button */}
                            {registeredPlayers.length > 0 && (
                                <button
                                    onClick={autoPopulateTeams}
                                    className="w-full mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Auto-populate from Registered Players ({registeredPlayers.length})
                                </button>
                            )}

                            {/* Teams List */}
                            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                                {teams.map((team, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={team.name}
                                            onChange={(e) => updateTeamName(index, e.target.value)}
                                            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={`Team ${index + 1} name`}
                                        />
                                        <button
                                            onClick={() => removeTeam(index)}
                                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add Team Button */}
                            <button
                                onClick={addTeam}
                                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Team
                            </button>

                            {/* Generate Button */}
                            <button
                                onClick={generateBracket}
                                disabled={isGenerating || teams.length < 2}
                                className="w-full mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold flex items-center justify-center"
                            >
                                {isGenerating ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Generate Bracket
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Right Panel - Bracket Preview */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-white">Bracket Preview</h2>
                                {generatedBracket && !showSuccess && (
                                    <button
                                        onClick={saveBracket}
                                        disabled={isSaving}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center"
                                    >
                                        {isSaving ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                                </svg>
                                                Save Bracket
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {!generatedBracket ? (
                                <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p className="text-lg">No bracket generated yet</p>
                                    <p className="text-sm mt-2">Add teams and click "Generate Bracket"</p>
                                </div>
                            ) : (
                                <div className="overflow-auto max-h-[600px]">
                                    {/* Bracket Structure Display */}
                                    <div className="space-y-4">
                                        <div className="bg-gray-700/50 rounded-lg p-4">
                                            <h3 className="text-white font-semibold mb-2">Tournament Info</h3>
                                            <div className="text-sm text-gray-300 space-y-1">
                                                <p><span className="font-medium">Type:</span> {bracketType === 'single' ? 'Single Elimination' : bracketType === 'double' ? 'Double Elimination' : 'Round Robin'}</p>
                                                <p><span className="font-medium">Teams:</span> {generatedBracket.teams?.filter(t => !t.isBye).length || 0} {generatedBracket.bracket_size && generatedBracket.bracket_size > (generatedBracket.teams?.filter(t => !t.isBye).length || 0) && <span className="text-gray-500">(Bracket size: {generatedBracket.bracket_size})</span>}</p>
                                                <p><span className="font-medium">Total Rounds:</span> {generatedBracket.total_rounds}</p>
                                                <p><span className="font-medium">Total Matches:</span> {generatedBracket.matches?.length || 0}</p>
                                                {generatedBracket.teams?.filter(t => t.isBye).length > 0 && (
                                                    <p className="text-yellow-400 text-xs mt-2">
                                                        ⚠️ {generatedBracket.teams.filter(t => t.isBye).length} BYE team(s) added to fill bracket
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Teams */}
                                        <div className="bg-gray-700/50 rounded-lg p-4">
                                            <h3 className="text-white font-semibold mb-2">Competing Teams</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {generatedBracket.teams?.filter(t => !t.isBye).map((team, idx) => (
                                                    <div key={idx} className="bg-gray-800 rounded px-3 py-2 text-sm text-gray-200">
                                                        <span className="font-medium">{team.name}</span>
                                                        {team.seed && <span className="text-gray-500 ml-2">#{team.seed}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Visual Bracket Preview */}
                                        {bracketType !== 'round-robin' && generatedBracket.matches && (
                                            <div className="bg-gray-700/50 rounded-lg p-4">
                                                <h3 className="text-white font-semibold mb-3">Bracket Structure</h3>
                                                <div className="overflow-x-auto">
                                                    <div className="flex gap-8 min-w-max">
                                                        {Array.from(new Set(generatedBracket.matches.map(m => m.round))).map(round => (
                                                            <div key={round} className="flex flex-col justify-around min-h-[300px]">
                                                                <div className="text-xs text-gray-400 font-semibold mb-2 text-center">
                                                                    {round === generatedBracket.total_rounds ? 'Final' : `Round ${round}`}
                                                                </div>
                                                                <div className="space-y-4">
                                                                    {generatedBracket.matches
                                                                        .filter(m => m.round === round)
                                                                        .map((match, idx) => (
                                                                            <div key={idx} className="bg-gray-800 rounded-lg p-2 w-40 border border-gray-600">
                                                                                <div className="text-xs text-gray-400 mb-1">Match {match.match_number}</div>
                                                                                <div className="space-y-1">
                                                                                    <div className={`px-2 py-1 rounded text-xs ${match.team1_name === 'BYE' ? 'bg-gray-700 text-gray-500 italic' : 'bg-gray-700 text-white'}`}>
                                                                                        {match.team1_name || 'TBD'}
                                                                                    </div>
                                                                                    <div className={`px-2 py-1 rounded text-xs ${match.team2_name === 'BYE' ? 'bg-gray-700 text-gray-500 italic' : 'bg-gray-700 text-white'}`}>
                                                                                        {match.team2_name || 'TBD'}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Round Robin Matches */}
                                        {bracketType === 'round-robin' && generatedBracket.matches && (
                                            <div className="bg-gray-700/50 rounded-lg p-4">
                                                <h3 className="text-white font-semibold mb-2">All Matches</h3>
                                                <div className="space-y-2">
                                                    {generatedBracket.matches.map((match, idx) => (
                                                        <div key={idx} className="bg-gray-800 rounded p-3 text-sm">
                                                            <div className="flex items-center justify-between text-gray-200">
                                                                <span className="font-medium">{match.team1_name}</span>
                                                                <span className="text-gray-500 mx-2">vs</span>
                                                                <span className="font-medium">{match.team2_name}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
