import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { router } from "@inertiajs/react"; // for saving if needed

export default function SevenTeamBracket({ eventId }) {
    const defaultMatches = {
        R1A: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
        R1B: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
        R1C: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
        SF1: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
        SF2: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
        GF: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
    };

    const [teamsInput, setTeamsInput] = useState(Array(7).fill(""));
    const [matches, setMatches] = useState(defaultMatches);
    const [champion, setChampion] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentMatch, setCurrentMatch] = useState(null);
    const [scoreInput, setScoreInput] = useState({ p1: "", p2: "" });
    const [showPopup, setShowPopup] = useState(false);
    const boxRefs = useRef({});
    const [lines, setLines] = useState([]);

    // Load saved bracket (optional)
    useEffect(() => {
        if (!eventId) return;
        fetch(route("single-elimination.show", { event: eventId }))
            .then(res => res.json())
            .then(data => {
                if (data.matches) {
                    setMatches({ ...defaultMatches, ...data.matches });
                    setChampion(data.champion || null);
                    // Load teams in seeding order: 1-7
                    // Seed 1 gets bye, R1A: 2v7, R1B: 3v6, R1C: 4v5
                    const initialTeams = [
                        data.matches.SF1?.p1?.name || "", // Seed 1 (bye to SF)
                        data.matches.R1A?.p1?.name || "", // Seed 2
                        data.matches.R1B?.p1?.name || "", // Seed 3
                        data.matches.R1C?.p1?.name || "", // Seed 4
                        data.matches.R1C?.p2?.name || "", // Seed 5
                        data.matches.R1B?.p2?.name || "", // Seed 6
                        data.matches.R1A?.p2?.name || "", // Seed 7
                    ];
                    setTeamsInput(initialTeams);
                }
            })
            .catch(err => console.error("Failed to load bracket:", err));
    }, [eventId]);

    const handleTeamChange = (i, val) => {
        const arr = [...teamsInput];
        arr[i] = val;
        setTeamsInput(arr);
    };

    const applyTeams = () => {
        const updated = { ...defaultMatches };
        // Challonge-style seeding for 7 teams:
        // Seed 1 gets bye to semifinals
        // R1A: 2v7, R1B: 3v6, R1C: 4v5
        
        // Round 1
        updated.R1A.p1.name = teamsInput[1] || "TBD"; // Seed 2
        updated.R1A.p2.name = teamsInput[6] || "TBD"; // Seed 7
        updated.R1B.p1.name = teamsInput[2] || "TBD"; // Seed 3
        updated.R1B.p2.name = teamsInput[5] || "TBD"; // Seed 6
        updated.R1C.p1.name = teamsInput[3] || "TBD"; // Seed 4
        updated.R1C.p2.name = teamsInput[4] || "TBD"; // Seed 5

        // Semi-Finals
        updated.SF1.p1.name = teamsInput[0] || "TBD"; // Seed 1 (bye)
        updated.SF1.p2.name = "TBD"; // Winner of R1A (2v7)
        updated.SF2.p1.name = "TBD"; // Winner of R1B (3v6)
        updated.SF2.p2.name = "TBD"; // Winner of R1C (4v5)

        setMatches(updated);
        setChampion(null);
    };

    const openReportScore = (matchId) => {
        setCurrentMatch(matchId);
        setScoreInput({
            p1: matches[matchId].p1.score || "",
            p2: matches[matchId].p2.score || "",
        });
        setShowModal(true);
    };

    const submitScore = () => {
        if (!currentMatch) return;
        const updated = { ...matches };
        const m = updated[currentMatch];
        m.p1.score = scoreInput.p1;
        m.p2.score = scoreInput.p2;

        if (m.p1.name !== "TBD" && m.p2.name !== "TBD" && m.p1.score !== m.p2.score) {
            const winnerKey = parseInt(m.p1.score) > parseInt(m.p2.score) ? "p1" : "p2";
            const winnerName = m[winnerKey].name;
            m.winner = winnerName;

            switch (currentMatch) {
                case "R1A": updated.SF1.p2.name = winnerName; break;
                case "R1B": updated.SF2.p1.name = winnerName; break;
                case "R1C": updated.SF2.p2.name = winnerName; break;
                case "SF1": updated.GF.p1.name = winnerName; break;
                case "SF2": updated.GF.p2.name = winnerName; break;
                case "GF": setChampion(winnerName); break;
            }
        }

        setMatches(updated);
        setShowModal(false);
    };

    const handleSave = () => {
        if (!eventId) return;
        router.post(
            route("single-elimination.save"),
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

    const renderMatch = (id, label) => {
        const m = matches[id];
        if (!m) return null;
        return (
            <div
                id={id}
                ref={el => (boxRefs.current[id] = el)}
                className="p-1.5 border rounded-lg bg-gray-800 text-white mb-2 w-36 sm:w-40 md:w-44 relative"
            >
                <p className="font-bold mb-0.5 text-[10px] sm:text-xs text-center">{label}</p>
                {["p1", "p2"].map(k => (
                    <div key={k} className={`flex justify-between items-center mb-0.5 text-[10px] sm:text-xs ${m.winner === m[k]?.name ? "bg-green-600" : "bg-gray-700"} px-1.5 py-1 sm:py-0.5 rounded`}>
                        <span>{m[k]?.name ?? "TBD"}</span>
                        <span className="ml-2">{m[k]?.score || "-"}</span>
                    </div>
                ))}
                {m.p1?.name !== "TBD" && m.p2?.name !== "TBD" && (
                    <button 
                        onClick={() => openReportScore(id)} 
                        className="px-2 py-1.5 sm:px-1 sm:py-0.5 bg-blue-600 hover:bg-blue-500 rounded font-medium text-[10px] sm:text-[9px] w-full mt-1 sm:mt-0.5 transition-colors"
                    >
                        Report Score
                    </button>
                )}
                {m.winner && m.winner !== "TBD" && (
                    <p className="text-green-400 text-[10px] mt-0.5 text-center">🏆 {m.winner} 🏆</p>
                )}
            </div>
        );
    };

    useLayoutEffect(() => {
        const container = document.getElementById("bracket-container");
        if (!container) return;
        const connections = [
            ["R1A", "SF1"],
            ["R1B", "SF2"],
            ["R1C", "SF2"],
            ["SF1", "GF"],
            ["SF2", "GF"]
        ];

        const newLines = connections.map(([fromId, toId]) => {
            const from = boxRefs.current[fromId];
            const to = boxRefs.current[toId];
            if (!from || !to) return null;

            const f = from.getBoundingClientRect();
            const t = to.getBoundingClientRect();
            const c = container.getBoundingClientRect();

            const startX = f.right - c.left;
            const startY = f.top + f.height / 2 - c.top;
            const endX = t.left - c.left;
            const endY = t.top + t.height / 2 - c.top;
            const midX = startX + 30;

            return `M${startX},${startY} H${midX} V${endY} H${endX}`;
        }).filter(Boolean);

        setLines(newLines);
    }, [matches]);

    return (
        <div className="bg-gray-900 min-h-screen p-2 md:p-6 text-white w-full overflow-x-auto">
            <h1 className="text-xl font-bold text-center mb-4">7-Team Single Elimination Bracket</h1>

            <div className="flex gap-3 justify-center mb-6 flex-wrap">
                {teamsInput.map((t, i) => (
                    <input
                        key={i}
                        type="text"
                        value={t}
                        onChange={e => handleTeamChange(i, e.target.value)}
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
                    onClick={handleSave}
                    className="px-3 py-1 bg-green-600 rounded-md text-white text-sm font-semibold hover:bg-green-500 transition"
                >
                    Save Bracket
                </button>
                <button
                    onClick={() => {
                        setTeamsInput(Array(7).fill(""));
                        setMatches(defaultMatches);
                        setChampion(null);
                    }}
                    className="px-3 py-1 bg-red-600 rounded-md text-white text-sm font-semibold hover:bg-red-500 transition"
                >
                    Reset
                </button>
            </div>

            <div id="bracket-container" className="relative">
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {lines.map((d, i) => <path key={i} d={d} stroke="white" strokeWidth="2" fill="none" />)}
                </svg>

                <div className="flex flex-col gap-6 min-w-max">
                    <div className="flex gap-12 sm:gap-20 md:gap-28 lg:gap-36 xl:gap-44">
                        <div className="space-y-6 sm:space-y-8 md:space-y-10">
                            {renderMatch("R1A", "Round 1")}
                            <div className="h-8 sm:h-10 md:h-12"></div>
                            {renderMatch("R1B", "Round 1")}
                            <div className="h-8 sm:h-10 md:h-12"></div>
                            {renderMatch("R1C", "Round 1")}
                        </div>
                        <div className="mt-12 space-y-24 sm:space-y-28 md:space-y-32">
                            <div className="pt-8">
                                {renderMatch("SF1", "Semi-Final 1")}
                            </div>
                            <div className="pt-8">
                                {renderMatch("SF2", "Semi-Final 2")}
                            </div>
                        </div>
                        <div className="flex flex-col justify-center">
                            <div>
                                {renderMatch("GF", "Grand Final")}
                                {champion && (
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400 mt-2 sm:mt-3 text-center">
                                        🏆 {champion} 🏆
                                    </h2>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showPopup && (
                <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-green-600 px-4 py-2 rounded shadow-lg text-sm sm:text-base">
                    Bracket Saved!
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-lg sm:text-xl font-bold mb-4">Report Score ({currentMatch})</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm mb-1">
                                    {matches[currentMatch]?.p1?.name}
                                </label>
                                <input
                                    type="number"
                                    value={scoreInput.p1}
                                    onChange={e => setScoreInput({ ...scoreInput, p1: e.target.value })}
                                    className="w-full px-3 py-1.5 rounded text-black text-sm sm:text-base"
                                    placeholder="Score"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">
                                    {matches[currentMatch]?.p2?.name}
                                </label>
                                <input
                                    type="number"
                                    value={scoreInput.p2}
                                    onChange={e => setScoreInput({ ...scoreInput, p2: e.target.value })}
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
                                    onClick={submitScore}
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
    );
}
