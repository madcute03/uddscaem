import React, { useEffect, useMemo, useState } from "react";
import { router } from "@inertiajs/react";

export default function RoundRobin({ eventId, teamCount }) {
    const [teamInputs, setTeamInputs] = useState(Array.from({ length: teamCount }, (_, i) => `Team ${i + 1}`));
    const [appliedTeams, setAppliedTeams] = useState(Array.from({ length: teamCount }, (_, i) => `Team ${i + 1}`));
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [active, setActive] = useState({ roundIdx: null, matchIdx: null });
    const [scoreHome, setScoreHome] = useState(0);
    const [scoreAway, setScoreAway] = useState(0);
    const [showPopup, setShowPopup] = useState(false);

    // Generate round-robin schedule using circle method
    const schedule = useMemo(() => {
        const n = appliedTeams.length;
        if (n < 2) return [];
        const list = [...appliedTeams];
        const isOdd = n % 2 === 1;
        if (isOdd) list.push("BYE");
        const m = list.length;
        const rounds = m - 1;
        const half = m / 2;
        const roundsArr = [];

        let arr = [...list];
        for (let r = 0; r < rounds; r++) {
            const roundMatches = [];
            for (let i = 0; i < half; i++) {
                const home = arr[i];
                const away = arr[m - 1 - i];
                if (home !== "BYE" && away !== "BYE") {
                    roundMatches.push({
                        id: `R${r + 1}-M${i + 1}`,
                        round: r + 1,
                        home: { name: home, score: 0 },
                        away: { name: away, score: 0 },
                        played: false,
                    });
                }
            }
            roundsArr.push(roundMatches);
            // rotate (keep first fixed)
            arr = [arr[0], ...arr.slice(2), arr[1]];
        }
        return roundsArr;
    }, [appliedTeams]);

    // Load saved state
    useEffect(() => {
        if (!eventId) return;
        setLoading(true);
        fetch(route("round-robin.show", { event: eventId }))
            .then((r) => r.json())
            .then((data) => {
                if (data.matches && Array.isArray(data.matches) && data.matches.length) {
                    setMatches(data.matches);
                } else {
                    setMatches(schedule);
                }
            })
            .finally(() => setLoading(false));
    }, [eventId, schedule]);

    const openReportScore = (rIdx, mIdx) => {
        const m = matches[rIdx][mIdx];
        setActive({ roundIdx: rIdx, matchIdx: mIdx });
        setScoreHome(m.home.score || 0);
        setScoreAway(m.away.score || 0);
        setShowModal(true);
    };

    const submitScores = () => {
        const { roundIdx, matchIdx } = active;
        if (roundIdx == null || matchIdx == null) return;
        setMatches((prev) =>
            prev.map((round, rI) =>
                rI === roundIdx
                    ? round.map((m, mI) =>
                          mI === matchIdx
                              ? {
                                    ...m,
                                    home: { ...m.home, score: parseInt(scoreHome) || 0 },
                                    away: { ...m.away, score: parseInt(scoreAway) || 0 },
                                    played: true,
                                }
                              : m
                      )
                    : round
            )
        );
        setShowModal(false);
    };

    const standings = useMemo(() => {
        const table = {};
        appliedTeams.forEach((t) => (table[t] = { team: t, played: 0, won: 0, lost: 0, setWins: 0, pts: 0 }));
        matches.flat().forEach((m) => {
            if (!m.played) return;
            const { home, away } = m;
            if (!table[home.name] || !table[away.name]) return;
            table[home.name].played += 1;
            table[away.name].played += 1;
            // Set Wins: number of rounds (games) won in the match, but capped at 1 for the "set" winner per match if that's the intended meaning.
            // Based on your instruction: Set Wins should be how many rounds they win (i.e., per match winner gets 1 set win)
            if (home.score > away.score) {
                table[home.name].won += 1;
                table[home.name].setWins += 1; // won this match's set
                table[away.name].lost += 1;
            } else if (home.score < away.score) {
                table[away.name].won += 1;
                table[away.name].setWins += 1; // won this match's set
                table[home.name].lost += 1;
            }
            // PTS should be based on how many games they won each rounds -> sum of game points
            table[home.name].pts += home.score;
            table[away.name].pts += away.score;
        });
        return Object.values(table).sort((a, b) => b.pts - a.pts || b.setWins - a.setWins || b.won - a.won || a.team.localeCompare(b.team));
    }, [matches, appliedTeams]);

    const save = () => {
        router.post(
            route("round-robin.save"),
            { event_id: eventId, matches, champion: standings[0]?.team || null },
            {
                preserveState: true,
                onSuccess: () => {
                    setShowPopup(true);
                    setTimeout(() => setShowPopup(false), 1500);
                },
            }
        );
    };

    const handleTeamChange = (idx, name) => {
        const next = [...teamInputs];
        next[idx] = name;
        setTeamInputs(next);
    };

    const applyTeams = () => {
        // Shuffle the entered teams and apply them to the bracket (random seeding)
        const filled = teamInputs.map((t, i) => t && t.trim() !== "" ? t.trim() : `Team ${i + 1}`);
        // Fisher-Yates shuffle
        const shuffled = [...filled];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setAppliedTeams(shuffled);
        // After appliedTeams updates, schedule will recompute; reset matches based on new schedule
        const newSchedule = (() => {
            const n = shuffled.length;
            const list = [...shuffled];
            if (n % 2 === 1) list.push("BYE");
            const m = list.length;
            const rounds = m - 1;
            const half = m / 2;
            const roundsArr = [];
            let arr = [...list];
            for (let r = 0; r < rounds; r++) {
                const roundMatches = [];
                for (let i = 0; i < half; i++) {
                    const home = arr[i];
                    const away = arr[m - 1 - i];
                    if (home !== "BYE" && away !== "BYE") {
                        roundMatches.push({
                            id: `R${r + 1}-M${i + 1}`,
                            round: r + 1,
                            home: { name: home, score: 0 },
                            away: { name: away, score: 0 },
                            played: false,
                        });
                    }
                }
                roundsArr.push(roundMatches);
                arr = [arr[0], ...arr.slice(2), arr[1]];
            }
            return roundsArr;
        })();
        setMatches(newSchedule);
    };

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="text-white space-y-6">
            <h2 className="text-xl font-bold">Round Robin ({teamCount} Teams)</h2>

            <div className="flex flex-wrap items-center gap-2">
                {teamInputs.map((t, i) => (
                    <input
                        key={i}
                        type="text"
                        value={t}
                        onChange={(e) => handleTeamChange(i, e.target.value)}
                        placeholder={`Team ${i + 1}`}
                        className="w-28 sm:w-32 px-2 py-1 rounded-md border border-slate-600 bg-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                ))}
                <button onClick={applyTeams} className="px-3 py-1 bg-blue-600 rounded-md text-white text-sm font-semibold hover:bg-blue-500 transition">
                    Apply Teams
                </button>
                <button onClick={() => setMatches(schedule)} className="px-3 py-1 bg-red-600 rounded-md text-white text-sm font-semibold hover:bg-red-500 transition">
                    Reset
                </button>
                <button onClick={save} className="px-3 py-1 bg-green-600 rounded-md text-white text-sm font-semibold hover:bg-green-500 transition">
                    Save Bracket
                </button>
            </div>

            <div className="relative overflow-x-auto">
                <div className="relative min-w-[1600px]">
                    {matches.map((round, rIdx) => (
                        <div key={rIdx} className="mb-8">
                            <div className="flex items-center mb-3">
                                <div className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Round {rIdx + 1}</div>
                                <div className="ml-3 flex-1 h-px bg-gray-700"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {round.map((m, mIdx) => {
                                    const priorCount = matches.slice(0, rIdx).reduce((acc, r) => acc + r.length, 0);
                                    const matchNumber = priorCount + mIdx + 1;
                                    const label = `Match ${matchNumber}`;
                                    return (
                                    <div key={m.id} className="bg-gray-900 border border-gray-700 rounded-md overflow-hidden">
                                        <div className="px-3 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                                            <span className="text-[11px] text-gray-300 font-medium">{label}</span>
                                            <button
                                                onClick={() => openReportScore(rIdx, mIdx)}
                                                className="text-[11px] px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-white"
                                            >
                                                Report
                                            </button>
                                        </div>
                                        <div className="p-3">
                                            <div className={`flex items-center justify-between rounded border px-2 py-1 ${m.played && m.home.score > m.away.score ? "bg-green-600/20 border-green-600" : "bg-gray-800 border-gray-700"}`}>
                                                <span className="text-sm truncate pr-2">{m.home.name}</span>
                                                <span className="text-sm font-bold w-8 text-center">{m.played ? m.home.score : "-"}</span>
                                            </div>
                                            <div className={`mt-1 flex items-center justify-between rounded border px-2 py-1 ${m.played && m.away.score > m.home.score ? "bg-green-600/20 border-green-600" : "bg-gray-800 border-gray-700"}`}>
                                                <span className="text-sm truncate pr-2">{m.away.name}</span>
                                                <span className="text-sm font-bold w-8 text-center">{m.played ? m.away.score : "-"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Standings</h3>
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

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4">
                    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-lg sm:text-xl font-bold mb-4">Report Score ({`Round ${active.roundIdx + 1} - ${matches[active.roundIdx][active.matchIdx].id}`})</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm mb-1">{matches[active.roundIdx][active.matchIdx].home.name}</label>
                                <input
                                    type="number"
                                    value={scoreHome}
                                    onChange={(e) => setScoreHome(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded text-black text-sm sm:text-base"
                                    placeholder="Score"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">{matches[active.roundIdx][active.matchIdx].away.name}</label>
                                <input
                                    type="number"
                                    value={scoreAway}
                                    onChange={(e) => setScoreAway(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded text-black text-sm sm:text-base"
                                    placeholder="Score"
                                    min="0"
                                />
                            </div>
                            <div className="flex justify-end gap-2 sm:gap-3 mt-4">
                                <button onClick={() => setShowModal(false)} className="px-3 sm:px-4 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm sm:text-base font-medium">Cancel</button>
                                <button onClick={submitScores} className="px-3 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm sm:text-base font-medium">Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showPopup && (
                <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-green-600 px-4 py-2 rounded shadow-lg text-sm sm:text-base">
                    BRACKET SAVED
                </div>
            )}
        </div>
    );
}


