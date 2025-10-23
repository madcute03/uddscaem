import React, { useState, useRef, useLayoutEffect, useEffect, useMemo } from "react";
import { router } from "@inertiajs/react";

export default function FiveTeamDoubleElimination({ eventId, teamCount = 5 }) {
    const defaultMatches = {
        UB1: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        UB2: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        UB3: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        UB4: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        LB1: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        LB2: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        LB3: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        GF: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
    };

    const [teamsInput, setTeamsInput] = useState(Array(teamCount).fill(""));
    const [matches, setMatches] = useState(defaultMatches);
    const [champion, setChampion] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const boxRefs = useRef({});
    const [lines, setLines] = useState([]);
    // Deterministic match labels in visual order (left-to-right, top-to-bottom)
    const matchLabelMap = useMemo(() => ({
        UB1: "Match 1",
        UB2: "Match 2",
        UB3: "Match 3",
        UB4: "Match 4",
        LB1: "Match 5",
        LB2: "Match 6",
        LB3: "Match 7",
        GF:  "Match 8",
    }), []);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [activeMatch, setActiveMatch] = useState(null);
    const [scoreP1, setScoreP1] = useState(0);
    const [scoreP2, setScoreP2] = useState(0);

    // Load saved data
    useEffect(() => {
        if (!eventId) return;

        fetch(route("double-elimination.show", { event: eventId }))
            .then(res => res.json())
            .then(data => {
                if (data.matches) setMatches({ ...defaultMatches, ...data.matches });
                if (data.champion) setChampion(data.champion);

                // Load teams in seeding order: 1-5
                // Seeds 1&2 get byes, UB1: 4v5, UB2: 2v3, UB3: 1 vs winner of UB1
                const initialTeams = [
                    data.matches.UB3?.p1?.name || "", // Seed 1 (bye to UB3)
                    data.matches.UB2?.p1?.name || "", // Seed 2 (bye to UB2)
                    data.matches.UB2?.p2?.name || "", // Seed 3
                    data.matches.UB1?.p1?.name || "", // Seed 4
                    data.matches.UB1?.p2?.name || ""  // Seed 5
                ];
                setTeamsInput(initialTeams);
            })
            .catch(err => console.error("Failed to load bracket:", err));
    }, [eventId]);


    // Save bracket
    const handleSave = () => {
        if (!eventId) return alert("No event selected!");
        router.post(
            route("double-elimination.save"),
            { event_id: eventId, matches, champion },
            {
                preserveState: true,
                onSuccess: () => {
                    setShowPopup(true);
                    setTimeout(() => setShowPopup(false), 1500);
                },
            }
        );
    };

    const handleTeamChange = (index, value) => {
        const newTeams = [...teamsInput];
        newTeams[index] = value;
        setTeamsInput(newTeams);
    };

    const applyTeams = () => {
        const updated = { ...matches };
        // Challonge-style seeding for 5 teams:
        // Seeds 1&2 get byes, UB1: 4v5, UB2: 2v3
        updated.UB3.p1.name = teamsInput[0] || "TBD"; // Seed 1 (bye to UB3)
        updated.UB2.p1.name = teamsInput[1] || "TBD"; // Seed 2 (bye to UB2)
        updated.UB2.p2.name = teamsInput[2] || "TBD"; // Seed 3
        updated.UB1.p1.name = teamsInput[3] || "TBD"; // Seed 4
        updated.UB1.p2.name = teamsInput[4] || "TBD"; // Seed 5
        setMatches(updated);
        setChampion(null);
    };

    // Open modal to report score
    const openReportScore = (matchId) => {
        setActiveMatch(matchId);
        setScoreP1(matches[matchId].p1.score || 0);
        setScoreP2(matches[matchId].p2.score || 0);
        setShowModal(true);
    };

    // Submit scores
    const submitScores = () => {
        const updated = { ...matches };
        const matchId = activeMatch;
        if (!matchId) return;

        updated[matchId].p1.score = parseInt(scoreP1) || 0;
        updated[matchId].p2.score = parseInt(scoreP2) || 0;

        const { p1, p2 } = updated[matchId];
        if (p1.name !== "TBD" && p2.name !== "TBD" && p1.score !== p2.score) {
            const winnerKey = p1.score > p2.score ? "p1" : "p2";
            const loserKey = winnerKey === "p1" ? "p2" : "p1";
            const winnerName = updated[matchId][winnerKey].name;
            const loserName = updated[matchId][loserKey].name;

            updated[matchId].winner = winnerName;
            updated[matchId].loser = loserName;

            // Upper Bracket progression
            if (matchId === "UB1") { updated.UB3.p2.name = winnerName; updated.LB1.p1.name = loserName; }
            if (matchId === "UB2") { updated.UB4.p1.name = winnerName; updated.LB1.p2.name = loserName; }
            if (matchId === "UB3") { updated.UB4.p2.name = winnerName; updated.LB2.p1.name = loserName; }
            if (matchId === "UB4") { updated.GF.p1.name = winnerName; updated.LB3.p2.name = loserName; }

            // Lower Bracket progression
            if (matchId === "LB1") updated.LB2.p2.name = winnerName;
            if (matchId === "LB2") updated.LB3.p1.name = winnerName;
            if (matchId === "LB3") updated.GF.p2.name = winnerName;

            // Grand Final
            if (matchId === "GF") setChampion(winnerName);
        }

        setMatches(updated);
        setShowModal(false);
    };

    const renderMatch = (id) => {
        const m = matches[id];
        if (!m) return null;
        const label = matchLabelMap[id] || id;

        return (
            <div
                id={id}
                ref={(el) => (boxRefs.current[id] = el)}
                className="p-1.5 border rounded-lg bg-gray-800 text-white mb-2 w-36 sm:w-40 md:w-44 relative"
            >
                <p className="font-bold mb-0.5 text-[10px] sm:text-xs">{label}</p>
                {["p1", "p2"].map((k) => (
                    <div
                        key={k}
                        className={`flex justify-between items-center mb-0.5 text-[10px] sm:text-xs ${m.winner === m[k]?.name ? "bg-green-600" : "bg-gray-700"
                            } px-1.5 py-1 sm:py-0.5 rounded`}
                    >
                        <span>{m[k]?.name ?? "TBD"}</span>
                        <span className="ml-2">{m[k]?.score || "-"}</span>
                    </div>
                ))}

                {m.p1?.name !== "TBD" && m.p2?.name !== "TBD" && (
                    <button
                        onClick={() => {
                            setActiveMatch(id);
                            setScoreP1(m.p1.score || 0);
                            setScoreP2(m.p2.score || 0);
                            setShowModal(true);
                        }}
                        className="px-2 py-1.5 sm:px-1 sm:py-0.5 bg-blue-600 hover:bg-blue-500 rounded font-medium text-[10px] sm:text-[9px] w-full mt-1 sm:mt-0.5 transition-colors"
                    >
                        Report Score
                    </button>
                )}

                {m.winner && m.winner !== "TBD" && (
                    <p className="text-green-400 text-[10px] mt-0.5">🏆 {m.winner}</p>
                )}
            </div>
        );
    };


    useLayoutEffect(() => {
        const updateLines = () => {
            const container = document.getElementById("bracket-container");
            if (!container) return;

            const connections = [
                ["UB1", "UB3"], ["UB2", "UB4"], ["UB3", "UB4"], ["UB4", "GF"],
                ["LB1", "LB2"], ["LB2", "LB3"], ["LB3", "GF"],
            ];

            const newLines = [];
            connections.forEach(([fromId, toId]) => {
                const from = boxRefs.current[fromId];
                const to = boxRefs.current[toId];
                if (from && to) {
                    const f = from.getBoundingClientRect();
                    const t = to.getBoundingClientRect();
                    const c = container.getBoundingClientRect();
                    const startX = f.right - c.left;
                    const startY = f.top + f.height / 2 - c.top;
                    const endX = t.left - c.left;
                    const endY = t.top + t.height / 2 - c.top;
                    const midX = startX + 30;
                    const path = `M${startX},${startY} H${midX} V${endY} H${endX}`;
                    newLines.push(path);
                }
            });
            setLines(newLines);
        };
        requestAnimationFrame(updateLines);
    }, [matches]);

    return (
        <div className="bracket-root">
            <div className="bg-gray-900 min-h-screen p-3 md:p-6 text-white w-full overflow-x-auto">
                <h1 className="text-xl font-bold text-center mb-4">{teamCount}-Team Double Elimination Bracket</h1>

                <div className="flex gap-3 justify-center mb-6 flex-wrap">
                    {teamsInput.map((team, i) => (
                        <input
                            key={i}
                            type="text"
                            value={team}
                            onChange={(e) => handleTeamChange(i, e.target.value)}
                            placeholder={`Team ${i + 1}`}
                            className="w-28 sm:w-32 px-2 py-1 rounded-md border border-slate-600 bg-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                    ))}
                    <button 
                        onClick={applyTeams} 
                        className="px-3 py-1 bg-blue-600 rounded-md text-white text-sm font-semibold hover:bg-blue-500 transition"
                    >
                        Apply Teams
                    </button>
                    <button 
                        onClick={() => {
                                setMatches(defaultMatches);
                                setTeamsInput(Array(teamCount).fill(""));
                                setChampion(null);
                            }}
                        className="px-3 py-1 bg-red-600 rounded-md text-white text-sm font-semibold hover:bg-red-500 transition"
                    >
                        Reset
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="px-3 py-1 bg-green-600 rounded-md text-white text-sm font-semibold hover:bg-green-500 transition"
                    >
                        Save Bracket
                    </button>
                </div>

                <div id="bracket-container" className="relative w-full">
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {lines.map((d, i) => (
                            <path key={i} d={d} stroke="white" strokeWidth="2" fill="none" />
                        ))}
                    </svg>

                    {/* Upper Bracket */}
                    <div className="flex gap-16 sm:gap-20 md:gap-24 lg:gap-28 min-w-max w-full overflow-visible">
                        <div className="mb-8">
                            <h2 className="font-bold text-sm mb-3">Round 1</h2>
                            <div className="mt-8">
                                {renderMatch("UB1")}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="font-bold text-sm mb-3">Round 2</h2>
                            <div className="space-y-6 sm:space-y-8">
                                {renderMatch("UB2")}
                                {renderMatch("UB3")}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="font-bold text-sm mb-3">Semifinals</h2>
                            <div className="mt-16">
                                {renderMatch("UB4")}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="font-bold text-sm mb-3">Finals</h2>
                            <div className="mt-16">
                                {renderMatch("GF")}
                                {champion && (
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400 mt-2 sm:mt-3 text-center">
                                        🏆 {champion} 🏆
                                    </h2>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Lower Bracket - Below Upper Bracket */}
                    <div className="mt-12 flex gap-16 sm:gap-20 md:gap-24 lg:gap-28 min-w-max w-full overflow-visible">
                        <div>
                            <h2 className="font-bold text-sm mb-3">Losers Round 1</h2>
                            <div className="mt-8">
                                {renderMatch("LB1")}
                            </div>
                        </div>

                        <div>
                            <h2 className="font-bold text-sm mb-3">Losers Round 2</h2>
                            <div className="mt-8">
                                {renderMatch("LB2")}
                            </div>
                        </div>

                        <div>
                            <h2 className="font-bold text-sm mb-3">Losers Round 3</h2>
                            <div className="mt-8">
                                {renderMatch("LB3")}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Popup */}
                {showPopup && (
                    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-green-600 px-4 py-2 rounded shadow-lg text-sm sm:text-base">
                        Bracket Saved!
                    </div>
                )}

                {/* Score Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4">
                        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg w-full max-w-md">
                            <h2 className="text-lg sm:text-xl font-bold mb-4">Report Score ({activeMatch})</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm mb-1">
                                        {matches[activeMatch].p1.name}
                                    </label>
                                    <input
                                        type="number"
                                        value={scoreP1}
                                        onChange={e => setScoreP1(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded text-black text-sm sm:text-base"
                                        placeholder="Score"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">
                                        {matches[activeMatch].p2.name}
                                    </label>
                                    <input
                                        type="number"
                                        value={scoreP2}
                                        onChange={e => setScoreP2(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded text-black text-sm sm:text-base"
                                        placeholder="Score"
                                        min="0"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 sm:gap-3 mt-4">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-3 sm:px-4 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm sm:text-base font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitScores}
                                        className="px-3 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm sm:text-base font-medium"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
