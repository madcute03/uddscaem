import React, { useEffect, useMemo, useState } from "react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowStanding({ eventId, teamCount }) {
    const [matches, setMatches] = useState([]);
    useEffect(() => {
        if (!eventId) return;
        fetch(route("round-robin.show", { event: eventId }))
            .then((r) => r.json())
            .then((d) => setMatches(Array.isArray(d.matches) ? d.matches : []));
    }, [eventId]);

  const standings = useMemo(() => {
    const table = {};
    matches.flat().forEach((m) => {
      const { home, away, played } = m || {};
      if (!home?.name || !away?.name || !played) return;
      if (!table[home.name]) table[home.name] = { team: home.name, played: 0, won: 0, lost: 0, setWins: 0, pts: 0 };
      if (!table[away.name]) table[away.name] = { team: away.name, played: 0, won: 0, lost: 0, setWins: 0, pts: 0 };
      table[home.name].played += 1; table[away.name].played += 1;
      table[home.name].setWins += home.score; table[away.name].setWins += away.score;
      if (home.score > away.score) { table[home.name].won += 1; table[away.name].lost += 1; }
      else if (home.score < away.score) { table[away.name].won += 1; table[home.name].lost += 1; }
    });
    Object.values(table).forEach((row) => { row.pts = row.setWins; });
    return Object.values(table).sort((a, b) => b.pts - a.pts || b.won - a.won || a.team.localeCompare(b.team));
  }, [matches]);

    return (
        <PublicLayout>
            <div className="bg-gray-900 min-h-screen p-4 md:p-6 text-white">
                <h1 className="text-xl font-bold text-center mb-4">{teamCount}-Team Round Robin (Standings)</h1>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
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
        </PublicLayout>
    );
}


