import React, { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function CreateBracket({ event, registeredPlayers = [] }) {
    const [teams, setTeams] = useState([]);
    const [bracketType, setBracketType] = useState('single');
    const [tournamentName, setTournamentName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showBulkAddModal, setShowBulkAddModal] = useState(false);
    const [bulkTeamText, setBulkTeamText] = useState('');

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

    // Bulk add teams
    const handleBulkAdd = () => {
        if (!bulkTeamText.trim()) {
            alert('Please enter team names.');
            return;
        }

        // Split by newlines and filter out empty lines
        const teamNames = bulkTeamText
            .split('\n')
            .map(name => name.trim())
            .filter(name => name.length > 0);

        if (teamNames.length === 0) {
            alert('No valid team names found.');
            return;
        }

        // Convert to team objects
        const newTeams = teamNames.map(name => ({
            name: name,
            members: []
        }));

        setTeams(newTeams);
        setBulkTeamText('');
        setShowBulkAddModal(false);
    };

    // Generate bracket and navigate to preview
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
                // Store data in session storage for the next page
                sessionStorage.setItem('generatedBracket', JSON.stringify({
                    bracket: response.data.bracket,
                    tournamentName: tournamentName,
                    bracketType: bracketType,
                    eventId: event.id
                }));

                // Navigate to view bracket page
                router.visit(route('events.viewDynamicBracket', { event: event.id }));
            }
        } catch (error) {
            console.error('Error generating bracket:', error);
            alert('Failed to generate bracket. Please try again.');
            setIsGenerating(false);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Create Bracket - ${event?.title}`} />
            
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link 
                            href={route('bracket')}
                            className="inline-flex items-center text-slate-300 hover:text-white mb-4 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Bracket Management
                        </Link>
                        
                        <h1 className="text-3xl font-bold text-white mb-2">Create Dynamic Bracket</h1>
                        <p className="text-gray-400">{event?.title}</p>
                    </div>

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

                        {/* Quick Add Buttons */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {/* Bulk Add Button */}
                            <button
                                onClick={() => setShowBulkAddModal(true)}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Bulk Add
                            </button>

                            {/* Auto-populate button */}
                            {registeredPlayers.length > 0 && (
                                <button
                                    onClick={autoPopulateTeams}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Auto ({registeredPlayers.length})
                                </button>
                            )}
                        </div>

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
                </div>

                {/* Bulk Add Modal */}
                {showBulkAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-2xl w-full p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-white">Bulk Add Teams</h3>
                                <button
                                    onClick={() => {
                                        setShowBulkAddModal(false);
                                        setBulkTeamText('');
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <p className="text-gray-300 text-sm mb-4">
                                Enter team names, one per line. Each line will become a separate team.
                            </p>

                            <textarea
                                value={bulkTeamText}
                                onChange={(e) => setBulkTeamText(e.target.value)}
                                className="w-full h-64 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                                placeholder="Team Alpha&#10;Team Bravo&#10;Team Charlie&#10;Team Delta&#10;..."
                            />

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={handleBulkAdd}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
                                >
                                    Add Teams
                                </button>
                                <button
                                    onClick={() => {
                                        setShowBulkAddModal(false);
                                        setBulkTeamText('');
                                    }}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
