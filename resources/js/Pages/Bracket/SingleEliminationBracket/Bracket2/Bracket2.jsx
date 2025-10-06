import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { router } from "@inertiajs/react";

export default function TwoTeamBracket({ eventId }) {
    const defaultMatches = {
        F: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
    };

    const [teamsInput, setTeamsInput] = useState(["", ""]);
    const [matches, setMatches] = useState(defaultMatches);
    const [champion, setChampion] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentMatch, setCurrentMatch] = useState(null);
    const [scoreInput, setScoreInput] = useState({ p1: "", p2: "" });
    const [showPopup, setShowPopup] = useState(false);
    const boxRefs = useRef({});
    const [lines, setLines] = useState([]);

    // Load saved bracket
    useEffect(() => {
        if (!eventId) return;
        fetch(route("single-elimination.show", { event: eventId }))
            .then(res => res.json())
            .then(data => {
                if (data.matches) {
                    setMatches({ ...defaultMatches, ...data.matches });
                    setChampion(data.champion || null);
                    setTeamsInput([
                        data.matches.F?.p1?.name || "",
                        data.matches.F?.p2?.name || ""
                    ]);
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
        updated.F.p1.name = teamsInput[0] || "TBD";
        updated.F.p2.name = teamsInput[1] || "TBD";
        updated.F.p1.score = "";
        updated.F.p2.score = "";
        updated.F.winner = null;
        setMatches(updated);
        setChampion(null);
    };

    const openReportScore = (matchId) => {
        setCurrentMatch(matchId);
        setScoreInput({
            p1: matches[matchId]?.p1?.score || "",
            p2: matches[matchId]?.p2?.score || "",
        });
        setShowModal(true);
    };

    const submitScore = () => {
        if (!currentMatch) return;
        const updated = { ...matches };
        const m = updated[currentMatch];
        m.p1.score = scoreInput.p1;
        m.p2.score = scoreInput.p2;

        if (m.p1.score !== m.p2.score) {
            const winnerKey = parseInt(m.p1.score) > parseInt(m.p2.score) ? "p1" : "p2";
            const winnerName = m[winnerKey].name;
            m.winner = winnerName;
            setChampion(winnerName);
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

    const resetBracket = () => {
        setTeamsInput(["", ""]);
        setMatches(defaultMatches);
        setChampion(null);
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
                {m.p1?.name !== "TBD" && m.p2?.name !== "TBD" && !m.winner && (
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
        const newLines = []; // Only one match, no lines needed for now
        setLines(newLines);
    }, [matches]);

    return (
        <div className="bg-gray-900 min-h-screen p-2 md:p-6 text-white w-full overflow-x-auto">
            <h1 className="text-xl font-bold text-center mb-4">2-Team Single Elimination Bracket</h1>

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
                    onClick={resetBracket}
                    className="px-3 py-1 bg-red-600 rounded-md text-white text-sm font-semibold hover:bg-red-500 transition"
                >
                    Reset
                </button>
            </div>

            <div id="bracket-container" className="relative">
                <div className="flex justify-center min-w-max">
                    <div className="mt-8">
                        {renderMatch("F", "Final")}
                        {champion && (
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400 mt-2 sm:mt-3 text-center">
                                🏆 {champion} 🏆
                            </h2>
                        )}
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
