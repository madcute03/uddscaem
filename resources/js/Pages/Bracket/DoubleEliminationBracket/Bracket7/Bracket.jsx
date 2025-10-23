import React, { useState, useRef, useLayoutEffect, useEffect, useMemo } from "react";
import { router } from "@inertiajs/react";

// ... (rest of the imports and component code remains the same)

export default function SevenTeamDoubleElimination({ eventId, teamCount = 7 }) {
    const defaultMatches = {
        UB1: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        UB2: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        UB3: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        UB5: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        UB6: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        UB7: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        LB1: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        LB2: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        LB3: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        LB4: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
        LB5: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null, loser: null },
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
        UB5: "Match 4",
        UB6: "Match 5",
        UB7: "Match 6",
        LB1: "Match 7",
        LB2: "Match 8",
        LB3: "Match 9",
        LB4: "Match 10",
        LB5: "Match 11",
        GF:  "Match 12",
    }), []);
    const [showPopup, setShowPopup] = useState(false);
    const [modalMatch, setModalMatch] = useState(null);
    const [scoreInputs, setScoreInputs] = useState({ p1: "", p2: "" });
    const boxRefs = useRef({});
    const [history, setHistory] = useState([]);

    // Auto-load saved bracket
    useEffect(() => {
        if (!eventId) return;
        fetch(route("double-elimination.show", { event: eventId }))
            .then((res) => res.json())
            .then((data) => {
                if (data.matches) {
                    setMatches({ ...defaultMatches, ...data.matches });
                    setChampion(data.champion || null);

                    // Load teams in seeding order: 1-7
                    // Seed 1 gets bye to UB5, UB1: 2v7, UB2: 3v6, UB3: 4v5
                    const initialTeams = [
                        data.matches.UB5?.p2?.name || "", // Seed 1 (bye to UB5)
                        data.matches.UB1?.p1?.name || "", // Seed 2
                        data.matches.UB2?.p1?.name || "", // Seed 3
                        data.matches.UB3?.p1?.name || "", // Seed 4
                        data.matches.UB3?.p2?.name || "", // Seed 5
                        data.matches.UB2?.p2?.name || "", // Seed 6
                        data.matches.UB1?.p2?.name || "", // Seed 7
                    ];
                    setTeamsInput(initialTeams);
                }
            })
            .catch((err) => console.error("Failed to load bracket:", err));
    }, [eventId]);

    const handleTeamChange = (index, value) => {
        const newTeams = [...teamsInput];
        newTeams[index] = value;
        setTeamsInput(newTeams);
    };

    const applyTeams = () => {
        const updated = { ...matches };
        // Challonge-style seeding for 7 teams:
        // Seed 1 gets bye to UB5, UB1: 2v7, UB2: 3v6, UB3: 4v5
        updated.UB5.p2.name = teamsInput[0] || "TBD"; // Seed 1 (bye to UB5)
        updated.UB1.p1.name = teamsInput[1] || "TBD"; // Seed 2
        updated.UB2.p1.name = teamsInput[2] || "TBD"; // Seed 3
        updated.UB3.p1.name = teamsInput[3] || "TBD"; // Seed 4
        updated.UB3.p2.name = teamsInput[4] || "TBD"; // Seed 5
        updated.UB2.p2.name = teamsInput[5] || "TBD"; // Seed 6
        updated.UB1.p2.name = teamsInput[6] || "TBD"; // Seed 7
        setMatches(updated);
        setChampion(null);
    };

    const openScoreModal = (matchId) => {
        setModalMatch(matchId);
        setScoreInputs({
            p1: matches[matchId].p1.score || "",
            p2: matches[matchId].p2.score || "",
        });
    };

    const submitScores = () => {
        if (!modalMatch) return;
        const updated = { ...matches };
        const m = updated[modalMatch];
        m.p1.score = scoreInputs.p1;
        m.p2.score = scoreInputs.p2;

        const p1Score = parseInt(scoreInputs.p1, 10);
        const p2Score = parseInt(scoreInputs.p2, 10);

        if (isNaN(p1Score) || isNaN(p2Score)) {
            alert("Please enter valid scores");
            return;
        }

        let winnerKey = p1Score > p2Score ? "p1" : "p2";
        let loserKey = winnerKey === "p1" ? "p2" : "p1";

        m.winner = m[winnerKey].name;
        m.loser = m[loserKey].name;

        // Upper Bracket propagation
        switch (modalMatch) {
            case "UB1": updated.UB5.p1.name = m.winner; updated.LB2.p1.name = m.loser; break; // Match 1 loser → Match 8
            case "UB2": updated.UB6.p1.name = m.winner; updated.LB1.p1.name = m.loser; break; // Match 2 loser → Match 7
            case "UB3": updated.UB6.p2.name = m.winner; updated.LB1.p2.name = m.loser; break; // Match 3 loser → Match 7
            case "UB5": updated.UB7.p1.name = m.winner; updated.LB4.p1.name = m.loser; break; // Match 4 loser → Match 10
            case "UB6": updated.UB7.p2.name = m.winner; updated.LB3.p1.name = m.loser; break; // Match 5 loser → Match 9
            case "UB7": updated.GF.p1.name = m.winner; updated.LB5.p2.name = m.loser; break; // Match 6 loser → Match 11
        }

        // Lower Bracket propagation
        switch (modalMatch) {
            case "LB1": updated.LB2.p2.name = m.winner; break; // Match 7 winner → Match 8
            case "LB2": updated.LB3.p2.name = m.winner; break; // Match 8 winner → Match 9
            case "LB3": updated.LB4.p2.name = m.winner; break; // Match 9 winner → Match 10
            case "LB4": updated.LB5.p1.name = m.winner; break; // Match 10 winner → Match 11
            case "LB5": updated.GF.p2.name = m.winner; break; // Match 11 winner → Match 12 (GF)
            case "GF": setChampion(m.winner); break;
        }

        setMatches(updated);
        setModalMatch(null);
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
                onError: (err) => console.error("Failed to save:", err),
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

                {m.p1?.name !== "TBD" && m.p2?.name !== "TBD" && (
                    <button
                        onClick={() => openScoreModal(id)}
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
                ["UB1", "UB5"], ["UB2", "UB6"], ["UB3", "UB6"], ["UB5", "UB7"], ["UB6", "UB7"], ["UB7", "GF"],
                ["LB1", "LB2"], ["LB2", "LB3"], ["LB3", "LB4"], ["LB4", "LB5"], ["LB5", "GF"],
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
            <div className="bg-gray-900 min-h-screen p-2 md:p-6 text-white w-full max-w-[1800px] mx-auto overflow-x-auto">
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
                    onClick={() => {
                        setMatches(defaultMatches);
                        setTeamsInput(Array(teamCount).fill(""));
                        setChampion(null);
                    }}
                    className="px-3 py-1 bg-red-600 rounded-md text-white text-sm font-semibold hover:bg-red-500 transition"
                >Reset</button>
                <button onClick={handleSave} className="px-3 py-1 bg-green-600 rounded-md text-white text-sm font-semibold hover:bg-green-500 transition">Save Bracket</button>
            </div>

            <div id="bracket-container" className="relative w-full">
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {lines.map((d, i) => (
                        <path key={i} d={d} stroke="white" strokeWidth="2" fill="none" />
                    ))}
                </svg>

                <div className="flex gap-16 sm:gap-20 md:gap-24 lg:gap-28 min-w-max w-full overflow-visible">
                    {/* Upper Bracket */}
                    <div className="mb-8">
                        <h2 className="font-bold text-sm mb-3">Round 1</h2>
                        <div className="space-y-6 sm:space-y-8">
                            {renderMatch("UB1")}
                            {renderMatch("UB2")}
                            {renderMatch("UB3")}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="font-bold text-sm mb-3">Round 2</h2>
                        <div className="space-y-6 sm:space-y-8">
                            <div className="h-8"></div>
                            {renderMatch("UB5")}
                            <div className="h-8"></div>
                            {renderMatch("UB6")}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="font-bold text-sm mb-3">Semifinals</h2>
                        <div className="mt-32">
                            {renderMatch("UB7")}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="font-bold text-sm mb-3">Finals</h2>
                        <div className="mt-32">
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
                        <div className="space-y-6 sm:space-y-8">
                            {renderMatch("LB2")}
                            <div className="h-4"></div>
                            {renderMatch("LB3")}
                        </div>
                    </div>

                    <div>
                        <h2 className="font-bold text-sm mb-3">Losers Round 3</h2>
                        <div className="mt-8">
                            {renderMatch("LB4")}
                        </div>
                    </div>

                    <div>
                        <h2 className="font-bold text-sm mb-3">Losers Round 4</h2>
                        <div className="mt-8">
                            {renderMatch("LB5")}
                        </div>
                    </div>
                </div>

                {/* Popup */}
                {showPopup && (
                    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-green-600 px-4 py-2 rounded shadow-lg text-sm sm:text-base">
                        Bracket Saved!
                    </div>
                )}
            </div>

            {/* Score Modal */}
            {modalMatch && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4">
                    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-lg sm:text-xl font-bold mb-4">Report Score ({modalMatch})</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm mb-1">
                                    {matches[modalMatch].p1.name}
                                </label>
                                <input
                                    type="number"
                                    value={scoreInputs.p1}
                                    onChange={(e) => setScoreInputs({ ...scoreInputs, p1: e.target.value })}
                                    className="w-full px-3 py-1.5 rounded text-black text-sm sm:text-base"
                                    placeholder="Score"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">
                                    {matches[modalMatch].p2.name}
                                </label>
                                <input
                                    type="number"
                                    value={scoreInputs.p2}
                                    onChange={(e) => setScoreInputs({ ...scoreInputs, p2: e.target.value })}
                                    className="w-full px-3 py-1.5 rounded text-black text-sm sm:text-base"
                                    placeholder="Score"
                                    min="0"
                                />
                            </div>
                            <div className="flex justify-end gap-2 sm:gap-3 mt-4">
                                <button
                                    onClick={() => setModalMatch(null)}
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
