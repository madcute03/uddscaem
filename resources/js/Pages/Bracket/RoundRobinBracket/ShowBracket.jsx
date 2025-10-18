import React, { useEffect, useMemo, useState } from "react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowBracket({ eventId, teamCount }) {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!eventId) return;
        setLoading(true);
        fetch(route("round-robin.show", { event: eventId }))
            .then((r) => r.json())
            .then((d) => setMatches(Array.isArray(d.matches) ? d.matches : []))
            .finally(() => setLoading(false));
    }, [eventId]);

  const standings = useMemo(() => {
    const table = {};
    matches.flat().forEach((m) => {
      const { home, away, played } = m || {};
      if (!home?.name || !away?.name) return;
      if (!table[home.name]) table[home.name] = { team: home.name, played: 0, won: 0, lost: 0, setWins: 0, pts: 0 };
      if (!table[away.name]) table[away.name] = { team: away.name, played: 0, won: 0, lost: 0, setWins: 0, pts: 0 };
      if (!played) return;
      table[home.name].played += 1;
      table[away.name].played += 1;
      table[home.name].setWins += home.score;
      table[away.name].setWins += away.score;
      if (home.score > away.score) { table[home.name].won += 1; table[away.name].lost += 1; }
      else if (home.score < away.score) { table[away.name].won += 1; table[home.name].lost += 1; }
    });
    Object.values(table).forEach((row) => { row.pts = row.setWins; });
    return Object.values(table).sort((a, b) => b.pts - a.pts || b.won - a.won || a.team.localeCompare(b.team));
  }, [matches]);

    if (loading) return <PublicLayout><div className="text-white p-4">Loading...</div></PublicLayout>;

    return (
        <PublicLayout>
            <div className="bg-gray-900 min-h-screen p-4 md:p-6 text-white">
                <h1 className="text-xl font-bold text-center mb-4">{teamCount}-Team Round Robin (Results)</h1>

                <div className="space-y-6">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h2 className="font-semibold mb-3">Matches</h2>
                        {matches.map((round, idx) => (
                            <div key={idx} className="mb-4">
                                <h3 className="text-sm text-gray-300 mb-2">Round {idx + 1}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {round.map((m, mIdx) => {
                                        const priorCount = matches.slice(0, idx).reduce((acc, r) => acc + r.length, 0);
                                        const matchNumber = priorCount + mIdx + 1;
                                        const label = `Match ${matchNumber}`;
                                        return (
                                        <div key={m.id} className="bg-gray-900 border border-gray-700 rounded p-3">
                                            <div className="text-xs text-gray-400 mb-2">{label}</div>
                                            <div className="flex items-center justify-between bg-gray-700 rounded px-2 py-1 mb-1">
                                                <span>{m.home.name}</span>
                                                <span className="font-semibold">{m.played ? m.home.score : "-"}</span>
                                            </div>
                                            <div className="flex items-center justify-between bg-gray-700 rounded px-2 py-1">
                                                <span>{m.away.name}</span>
                                                <span className="font-semibold">{m.played ? m.away.score : "-"}</span>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h2 className="font-semibold mb-3">Standings</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="p-2 text-left">Rank</th>
                                        <th className="p-2 text-left">Participant</th>
                                        <th className="p-2">Match W-L</th>
                                        <th className="p-2">Set Wins</th>
                                        <th className="p-2">PTS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.map((row, idx) => (
                                        <tr key={row.team} className="odd:bg-gray-900">
                                            <td className="p-2 text-left font-semibold">{idx + 1}</td>
                                            <td className="p-2 text-left">{row.team}</td>
                                            <td className="p-2 text-center">{row.won}-{row.lost}</td>
                                            <td className="p-2 text-center">{row.setWins}</td>
                                            <td className="p-2 text-center font-semibold">{row.pts}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </PublicLayout>
    );
}


