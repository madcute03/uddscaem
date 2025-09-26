// resources/js/Pages/Bracket/SingleEliminationBracket/Bracket8/ShowStanding.jsx
import React from "react";
import { Head, Link } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowStanding({
    eventId,
    matches = {},
    champion = null,
    teamCount = 8,
    teams = [], // 👈 ideally pass full list of 8 teams here
}) {
    const calculateStandings = () => {
        const standings = {};

        // Step 1: get all teams
        let allTeams = teams.length
            ? teams
            : Array.from(
                new Set(
                    Object.values(matches)
                        .flatMap((m) => [m.p1?.name, m.p2?.name])
                        .filter((t) => t && t !== "TBD")
                )
            );

        // Step 2: ensure we always have `teamCount` entries
        while (allTeams.length < teamCount) {
            allTeams.push(`TBD ${allTeams.length + 1}`);
        }

        // Step 3: initialize standings
        allTeams.forEach((team) => {
            standings[team] = { name: team, wins: 0, losses: 0 };
        });

        // Step 4: update standings from matches
        Object.values(matches).forEach((match) => {
            ["p1", "p2"].forEach((key) => {
                const team = match[key]?.name;
                if (!team || team === "TBD") return; // skip empty slots

                if (!standings[team]) {
                    standings[team] = { name: team, wins: 0, losses: 0 };
                }

                if (match.winner && match.winner === team) {
                    standings[team].wins += 1;
                } else if (match.winner && match.winner !== team) {
                    standings[team].losses += 1;
                }
            });
        });

        // Step 5: sort by wins desc, losses asc
        return Object.values(standings).sort(
            (a, b) => b.wins - a.wins || a.losses - b.losses
        );
    };

    const standings = calculateStandings();

    return (
        <PublicLayout>
            <Head title={`${teamCount}-Team Standings`} />
            <div className="bg-gray-900 min-h-screen p-6 text-white">
                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
                    {teamCount}-Team Tournament Standings
                </h1>

            

                {/* Standings Table */}
                <div className="max-w-4xl mx-auto overflow-x-auto">
                    <table className="w-full border border-gray-700 text-sm sm:text-base">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-3 border border-gray-700 text-left">Rank</th>
                                <th className="p-3 border border-gray-700 text-left">Team</th>
                                <th className="p-3 border border-gray-700 text-center">Wins</th>
                                <th className="p-3 border border-gray-700 text-center">Losses</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map((team, index) => (
                                <tr
                                    key={team.name}
                                    className="odd:bg-gray-800 even:bg-gray-700"
                                >
                                    <td className="p-3 border border-gray-700 text-center">
                                        {index + 1}
                                    </td>
                                    <td className="p-3 border border-gray-700 font-semibold">
                                        {team.name}
                                        {champion === team.name && (
                                            <span className="ml-2 text-yellow-400">🏆</span>
                                        )}
                                    </td>
                                    <td className="p-3 border border-gray-700 text-center">
                                        {team.wins}
                                    </td>
                                    <td className="p-3 border border-gray-700 text-center">
                                        {team.losses}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Champion Highlight */}
                {champion && (
                    <div className="mt-8 text-center">
                        <h2 className="text-3xl font-bold text-yellow-400">
                            🏆 Champion: {champion}
                        </h2>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
