import { useState, useMemo } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";

export default function CompetitionRegistrations({ players: initialPlayers, event }) {
    const [query, setQuery] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const { auth, flash } = usePage().props;
    
    // Use initialPlayers directly
    const players = initialPlayers;

    // Search filter
    const filteredPlayers = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return players;
        return players.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.email || "").toLowerCase().includes(q) ||
                (p.student_id || "").toLowerCase().includes(q) ||
                (p.department || "").toLowerCase().includes(q)
        );
    }, [players, query]);

    // Check if a participant is already added
    const isParticipantAdded = (participantName) => {
        return event?.participants?.includes(participantName) || false;
    };

    // Handler to add a specific team or player as participant
    const handleAddAsParticipant = (participantName) => {
        if (confirm(`Are you sure you want to add "${participantName}" as a participant to this event?`)) {
            setIsProcessing(participantName);
            router.post(
                route('events.addParticipants', event.id),
                { participant_name: participantName },
                {
                    preserveScroll: true,
                    onFinish: () => setIsProcessing(false),
                }
            );
        }
    };

    // Group players by team for team events
    const groupedPlayers = useMemo(() => {
        if (event?.registration_type !== 'team') {
            return { players: filteredPlayers, teams: null };
        }

        const teams = {};
        const ungroupedPlayers = [];

        filteredPlayers.forEach(player => {
            if (player.team_name) {
                if (!teams[player.team_name]) {
                    teams[player.team_name] = [];
                }
                teams[player.team_name].push(player);
            } else {
                ungroupedPlayers.push(player);
            }
        });

        return { teams, players: ungroupedPlayers };
    }, [filteredPlayers, event]);

    return (
        <>
            <Head title="Competition Registrations" />

            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100 py-10 px-2 sm:px-4 md:px-8">
                <Link
                    href={route("dashboard")}
                    className="relative text-[14px] font-extrabold uppercase text-[#e1e1e1]
                    cursor-pointer hover:text-white focus:text-white after:content-['']
                    after:absolute after:bottom-[-2px] after:left-1/2 after:w-0 after:h-[2px]
                    after:bg-white after:transition-[width,left] after:duration-400
                    hover:after:w-full hover:after:left-0 focus:after:w-full focus:after:left-0
                    h-15 px-2 mt-10"
                >
                    ← Back to dashboard
                </Link>

                <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-xl shadow-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-4 sm:p-6 md:p-8">
                    {/* Success/Error Messages */}
                    {flash?.success && (
                        <div className="mb-4 p-4 rounded-lg bg-green-500/20 border border-green-400/30 text-green-300">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300">
                            {flash.error}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl font-semibold">
                                {event?.registration_type === 'team' ? 'Registered Teams' : 'Registered Players'}
                                {event?.title ? ` — ${event.title}` : ""}
                            </h1>
                            <p className="text-slate-300">
                                {event?.registration_type === 'team'
                                    ? `${Object.keys(groupedPlayers.teams || {}).length} team(s) registered`
                                    : `${filteredPlayers.length} player(s) registered`
                                }
                            </p>
                        </div>
                        <div className="w-full sm:w-96">
                            <label className="block text-sm mb-1 text-slate-300">
                                Search {event?.registration_type === 'team' ? 'teams' : 'players'}
                            </label>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={`Search by ${event?.registration_type === 'team' ? 'team name' : 'name'}, email, ID, or department`}
                                className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        {event?.registration_type === 'team' ? (
                            // Team Registration View
                            <>
                                {Object.keys(groupedPlayers.teams || {}).length === 0 ? (
                                    <p className="text-slate-300 text-center py-6">
                                        No teams match your search.
                                    </p>
                                ) : (
                                    <div className="space-y-6">
                                        {Object.entries(groupedPlayers.teams).map(([teamName, teamMembers]) => (
                                            <div key={teamName} className="bg-white/5 border border-white/10 rounded-lg p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-lg font-semibold text-blue-300">{teamName}</h3>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-300 border border-green-400/30">
                                                            Registered
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-sm text-slate-300">{teamMembers.length} members</p>
                                                        {auth?.user && (
                                                            <button
                                                                onClick={() => handleAddAsParticipant(teamName)}
                                                                disabled={isProcessing === teamName || isParticipantAdded(teamName)}
                                                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300
                                                                         ${isParticipantAdded(teamName)
                                                                             ? 'bg-green-600/50 border border-green-500/50 cursor-not-allowed'
                                                                             : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                                                                         }
                                                                         disabled:from-slate-600 disabled:to-slate-500
                                                                         disabled:cursor-not-allowed disabled:transform-none
                                                                         text-white flex items-center gap-2`}
                                                            >
                                                                {isProcessing === teamName ? (
                                                                    <>
                                                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        Adding...
                                                                    </>
                                                                ) : isParticipantAdded(teamName) ? (
                                                                    <>
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                        Added as Participant
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                        </svg>
                                                                        Add as Participant
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="text-slate-300 text-sm">
                                                                <th className="px-3 py-2 text-left">Name</th>
                                                                <th className="px-3 py-2 text-left">Email</th>
                                                                <th className="px-3 py-2 text-left">Student ID</th>
                                                                <th className="px-3 py-2 text-left">Department</th>
                                                                <th className="px-3 py-2 text-left">Age</th>
                                                                <th className="px-3 py-2 text-left">Documents</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {teamMembers.map((player) => (
                                                                <tr key={player.id} className="border-t border-white/10">
                                                                    <td className="px-3 py-2">{player.name}</td>
                                                                    <td className="px-3 py-2">{player.email}</td>
                                                                    <td className="px-3 py-2">{player.student_id}</td>
                                                                    <td className="px-3 py-2">{player.department}</td>
                                                                    <td className="px-3 py-2">{player.age}</td>
                                                                    <td className="px-3 py-2 text-center">
                                                                        {player.gdrive_link && (
                                                                            <a
                                                                                href={player.gdrive_link}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-blue-300 hover:underline text-sm"
                                                                            >
                                                                                Open link
                                                                            </a>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            // Individual Registration View
                            <>
                                {filteredPlayers.length === 0 ? (
                                    <p className="text-slate-300 text-center py-6">
                                        No players match your search.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto rounded border border-white/10 mt-4">
                                        <table className="w-full table-auto">
                                            <thead>
                                                <tr className="bg-white/10 text-slate-200">
                                                    <th className="px-3 py-2 text-left text-sm font-semibold">Name</th>
                                                    <th className="px-3 py-2 text-left text-sm font-semibold">Email</th>
                                                    <th className="px-3 py-2 text-left text-sm font-semibold">Student ID</th>
                                                    <th className="px-3 py-2 text-left text-sm font-semibold">Department</th>
                                                    <th className="px-3 py-2 text-left text-sm font-semibold">Age</th>
                                                    <th className="px-3 py-2 text-left text-sm font-semibold">Documents</th>
                                                    <th className="px-3 py-2 text-center text-sm font-semibold">Status</th>
                                                    {auth?.user && (
                                                        <th className="px-3 py-2 text-center text-sm font-semibold">Actions</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredPlayers.map((player) => (
                                                    <tr
                                                        key={player.id}
                                                        className="odd:bg-white/0 even:bg-white/5"
                                                    >
                                                        <td className="px-3 py-2">{player.name}</td>
                                                        <td className="px-3 py-2">{player.email}</td>
                                                        <td className="px-3 py-2">{player.student_id}</td>
                                                        <td className="px-3 py-2">{player.department}</td>
                                                        <td className="px-3 py-2">{player.age}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            {player.gdrive_link && (
                                                                <a
                                                                    href={player.gdrive_link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-300 hover:underline"
                                                                >
                                                                    Open link
                                                                </a>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-300 border border-green-400/30">
                                                                Registered
                                                            </span>
                                                        </td>
                                                        {auth?.user && (
                                                            <td className="px-3 py-2 text-center">
                                                                <button
                                                                    onClick={() => handleAddAsParticipant(player.name)}
                                                                    disabled={isProcessing === player.name || isParticipantAdded(player.name)}
                                                                    className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-300
                                                                             ${isParticipantAdded(player.name)
                                                                                 ? 'bg-green-600/50 border border-green-500/50 cursor-not-allowed'
                                                                                 : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                                                                             }
                                                                             disabled:from-slate-600 disabled:to-slate-500
                                                                             disabled:cursor-not-allowed disabled:transform-none
                                                                             text-white flex items-center gap-1.5 mx-auto`}
                                                                >
                                                                    {isProcessing === player.name ? (
                                                                        <>
                                                                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg>
                                                                            Adding...
                                                                        </>
                                                                    ) : isParticipantAdded(player.name) ? (
                                                                        <>
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                            Added
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                            </svg>
                                                                            Add
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
