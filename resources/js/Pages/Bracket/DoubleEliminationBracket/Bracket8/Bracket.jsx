// Bracket.jsx
import React, { useState, useRef, useLayoutEffect, useEffect, useMemo } from "react";
import { router } from "@inertiajs/react";

export default function EightTeamDoubleElimination({ eventId, teamCount = 8 }) {
    const defaultMatches = {
        UB1: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        UB2: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        UB3: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        UB4: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        UB5: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        UB6: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        UB7: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        LB1: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        LB2: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        LB3: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        LB4: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        LB5: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        LB6: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        GF: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
    };

    const [teamsInput, setTeamsInput] = useState(Array(teamCount).fill(""));
    const [matches, setMatches] = useState(defaultMatches);
    const [champion, setChampion] = useState(null);
    const [lines, setLines] = useState([]);
    const matchLabelMap = useMemo(() => ({
        UB1: "Match 1",
        UB2: "Match 2",
        UB3: "Match 3",
        UB4: "Match 4",
        UB5: "Match 5",
        UB6: "Match 6",
        UB7: "Match 7",
        LB1: "Match 8",
        LB2: "Match 9",
        LB3: "Match 10",
        LB4: "Match 11",
        LB5: "Match 12",
        LB6: "Match 13",
        GF:  "Match 14",
    }), []);
    const [showPopup, setShowPopup] = useState(false);

    // modal state
    const [showModal, setShowModal] = useState(false);
    const [currentMatch, setCurrentMatch] = useState(null);
    const [scoreInput, setScoreInput] = useState({ p1: "", p2: "" });

    const boxRefs = useRef({});

    // Load saved bracket
    useEffect(() => {
        if (!eventId) return;
        fetch(route("double-elimination.show", { event: eventId }))
            .then((res) => res.json())
            .then((data) => {
                if (data.matches) {
                    setMatches({ ...defaultMatches, ...data.matches });
                    setChampion(data.champion || null);
                    // Load teams in seeding order: 1-8
                    // UB1: 1v8, UB2: 4v5, UB3: 2v7, UB4: 3v6 (Challonge-style)
                    const initialTeams = [
                        data.matches.UB1?.p1?.name || "", // Seed 1
                        data.matches.UB3?.p1?.name || "", // Seed 2
                        data.matches.UB4?.p1?.name || "", // Seed 3
                        data.matches.UB2?.p1?.name || "", // Seed 4
                        data.matches.UB2?.p2?.name || "", // Seed 5
                        data.matches.UB4?.p2?.name || "", // Seed 6
                        data.matches.UB3?.p2?.name || "", // Seed 7
                        data.matches.UB1?.p2?.name || "", // Seed 8
                    ];
                    setTeamsInput(initialTeams);
                }
            })
            .catch((err) => console.error("Failed to load bracket:", err));
    }, [eventId]);

    const handleTeamChange = (i, val) => {
        const arr = [...teamsInput];
        arr[i] = val;
        setTeamsInput(arr);
    };

    const applyTeams = () => {
        const updated = { ...defaultMatches };
        // Challonge-style seeding for 8 teams: 1v8, 4v5, 2v7, 3v6
        updated.UB1.p1.name = teamsInput[0] || "TBD"; // Seed 1
        updated.UB1.p2.name = teamsInput[7] || "TBD"; // Seed 8
        updated.UB2.p1.name = teamsInput[3] || "TBD"; // Seed 4
        updated.UB2.p2.name = teamsInput[4] || "TBD"; // Seed 5
        updated.UB3.p1.name = teamsInput[1] || "TBD"; // Seed 2
        updated.UB3.p2.name = teamsInput[6] || "TBD"; // Seed 7
        updated.UB4.p1.name = teamsInput[2] || "TBD"; // Seed 3
        updated.UB4.p2.name = teamsInput[5] || "TBD"; // Seed 6
        setMatches(updated);
        setChampion(null);
    };

    // open modal
    const openReportScore = (id) => {
        setCurrentMatch(id);
        setScoreInput({
            p1: matches[id].p1.score || "",
            p2: matches[id].p2.score || "",
        });
        setShowModal(true);
    };

    // submit score
    const submitScore = () => {
        if (!currentMatch) return;
        const updated = { ...matches };
        const m = updated[currentMatch];
        m.p1.score = scoreInput.p1;
        m.p2.score = scoreInput.p2;

        if (m.p1.name !== "TBD" && m.p2.name !== "TBD" && m.p1.score !== m.p2.score) {
            const winnerKey = parseInt(m.p1.score) > parseInt(m.p2.score) ? "p1" : "p2";
            const loserKey = winnerKey === "p1" ? "p2" : "p1";
            const winnerName = m[winnerKey].name;
            const loserName = m[loserKey].name;

            m.winner = winnerName;
            m.loser = loserName;

            // upper propagation
            switch (currentMatch) {
                case "UB1": updated.UB5.p1.name = winnerName; updated.LB1.p1.name = loserName; break;
                case "UB2": updated.UB5.p2.name = winnerName; updated.LB1.p2.name = loserName; break;
                case "UB3": updated.UB6.p1.name = winnerName; updated.LB2.p1.name = loserName; break;
                case "UB4": updated.UB6.p2.name = winnerName; updated.LB2.p2.name = loserName; break;
                case "UB5": updated.UB7.p1.name = winnerName; updated.LB3.p1.name = loserName; break;
                case "UB6": updated.UB7.p2.name = winnerName; updated.LB4.p1.name = loserName; break;
                case "UB7": updated.GF.p1.name = winnerName; updated.LB6.p2.name = loserName; break;
            }
            // lower propagation
            switch (currentMatch) {
                case "LB1": updated.LB3.p2.name = winnerName; break;
                case "LB2": updated.LB4.p2.name = winnerName; break;
                case "LB3": updated.LB5.p1.name = winnerName; break;
                case "LB4": updated.LB5.p2.name = winnerName; break;
                case "LB5": updated.LB6.p1.name = winnerName; break;
                case "LB6": updated.GF.p2.name = winnerName; break;
                case "GF": setChampion(winnerName); break;
            }
        }

        setMatches(updated);
        setShowModal(false);
    };

    const handleSave = () => {
        if (!eventId) return;
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

                {/* Show Report Score button only if both teams exist */}
                {m.p1?.name !== "TBD" && m.p2?.name !== "TBD" && (
                    <button
                        onClick={() => openReportScore(id)}
                        className="px-2 py-1.5 sm:px-1 sm:py-0.5 bg-blue-600 hover:bg-blue-500 rounded font-medium text-[10px] sm:text-[9px] w-full mt-1 sm:mt-0.5 transition-colors"
                    >
                        Report Score
                    </button>
                )}

                {/* Show Winner only if valid */}
                {m.winner && m.winner !== "TBD" && (
                    <p className="text-green-400 text-[10px] mt-0.5">🏆 {m.winner}</p>
                )}
            </div>
        );
    };


    // lines
    useLayoutEffect(() => {
        const updateLines = () => {
            const container = document.getElementById("bracket-container");
            if (!container) return;
            const connections = [
                ["UB1", "UB5"], ["UB2", "UB5"], ["UB3", "UB6"], ["UB4", "UB6"],
                ["UB5", "UB7"], ["UB6", "UB7"], ["UB7", "GF"],
                ["LB1", "LB3"], ["LB2", "LB4"], ["LB3", "LB5"], ["LB4", "LB5"], ["LB5", "LB6"], ["LB6", "GF"],
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
                    newLines.push(`M${startX},${startY} H${midX} V${endY} H${endX}`);
                }
            });
            setLines(newLines);
        };
        requestAnimationFrame(updateLines);
    }, [matches]);

    return (
        <div className="bg-gray-900 min-h-screen p-2 md:p-6 text-white w-full overflow-x-auto">
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
                <button onClick={applyTeams} className="px-3 py-1 bg-blue-600 rounded-md text-white text-sm font-semibold hover:bg-blue-500 transition">Apply Teams</button>
                <button
                    onClick={() => { setMatches(defaultMatches); setTeamsInput(Array(8).fill("")); setChampion(null); }}
                    className="px-3 py-1 bg-red-600 rounded-md text-white text-sm font-semibold hover:bg-red-500 transition"
                >Reset</button>
                <button onClick={handleSave} className="px-3 py-1 bg-green-600 rounded-md text-white text-sm font-semibold hover:bg-green-500 transition">Save Bracket</button>
            </div>

            <div id="bracket-container" className="relative">
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {lines.map((d, i) => <path key={i} d={d} stroke="white" strokeWidth="2" fill="none" />)}
                </svg>

                {/* Upper Bracket */}
                <div className="flex gap-16 sm:gap-20 md:gap-24 lg:gap-28 min-w-max w-full overflow-visible">
                    <div className="mb-8">
                        <h2 className="font-bold text-sm mb-3">Round 1</h2>
                        <div className="space-y-6 sm:space-y-8">
                            {renderMatch("UB1")}
                            {renderMatch("UB2")}
                            {renderMatch("UB3")}
                            {renderMatch("UB4")}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="font-bold text-sm mb-3">Round 2</h2>
                        <div className="space-y-6 sm:space-y-8">
                            <div className="h-8"></div>
                            {renderMatch("UB5")}
                            <div className="h-16"></div>
                            {renderMatch("UB6")}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="font-bold text-sm mb-3">Semifinals</h2>
                        <div className="mt-40">
                            {renderMatch("UB7")}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="font-bold text-sm mb-3">Finals</h2>
                        <div className="mt-40">
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
                        <div className="space-y-6 sm:space-y-8">
                            {renderMatch("LB1")}
                            {renderMatch("LB2")}
                        </div>
                    </div>

                    <div>
                        <h2 className="font-bold text-sm mb-3">Losers Round 2</h2>
                        <div className="space-y-6 sm:space-y-8">
                            <div className="h-4"></div>
                            {renderMatch("LB3")}
                            <div className="h-8"></div>
                            {renderMatch("LB4")}
                        </div>
                    </div>

                    <div>
                        <h2 className="font-bold text-sm mb-3">Losers Round 3</h2>
                        <div className="mt-16">
                            {renderMatch("LB5")}
                        </div>
                    </div>

                    <div>
                        <h2 className="font-bold text-sm mb-3">Losers Round 4</h2>
                        <div className="mt-16">
                            {renderMatch("LB6")}
                        </div>
                    </div>
                </div>
            </div>

            {showPopup && <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-green-600 px-4 py-2 rounded shadow-lg">Bracket Saved!</div>}

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
                    <div className="bg-white text-black p-6 rounded-lg shadow-lg w-80">
                        <h2 className="text-lg font-bold mb-4">Report Score ({currentMatch})</h2>
                        <div className="mb-3">
                            <label className="block text-sm font-semibold">{matches[currentMatch]?.p1?.name}</label>
                            <input type="number" value={scoreInput.p1} onChange={(e) => setScoreInput({ ...scoreInput, p1: e.target.value })} className="w-full border px-2 py-1 rounded" />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold">{matches[currentMatch]?.p2?.name}</label>
                            <input type="number" value={scoreInput.p2} onChange={(e) => setScoreInput({ ...scoreInput, p2: e.target.value })} className="w-full border px-2 py-1 rounded" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="px-3 py-1 rounded bg-gray-400 text-white">Cancel</button>
                            <button onClick={submitScore} className="px-3 py-1 rounded bg-blue-600 text-white font-bold">Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
