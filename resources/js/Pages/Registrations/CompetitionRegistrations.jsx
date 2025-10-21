import { useState, useMemo } from "react";
import { Head, Link } from "@inertiajs/react";

export default function CompetitionRegistrations({ players: initialPlayers, event }) {
    const [query, setQuery] = useState("");
    
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
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
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
                                                    <p className="text-sm text-slate-300">{teamMembers.length} members</p>
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
