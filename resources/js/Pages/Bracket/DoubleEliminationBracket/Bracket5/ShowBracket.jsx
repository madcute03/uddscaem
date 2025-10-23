import React, { useState, useRef, useLayoutEffect, useEffect, useMemo } from "react";
import { Head } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function FiveTeamShowResult({ eventId, refreshTrigger }) {
    const boxRefs = useRef({});
    const [lines, setLines] = useState([]);
    const [champion, setChampion] = useState(null);
    
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

    const emptyMatches = {
        UB1: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        UB2: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        UB3: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        UB4: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        LB1: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        LB2: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        LB3: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        GF: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
    };

    const [matches, setMatches] = useState(emptyMatches);

    // Fetch matches from backend
    useEffect(() => {
        if (!eventId) return;

        fetch(route("double-elimination.show", { event: eventId }))
            .then(res => res.json())
            .then(data => {
                if (data && data.matches && Object.keys(data.matches).length) {
                    setMatches({ ...emptyMatches, ...data.matches });
                    setChampion(data.champion);
                } else {
                    setMatches(emptyMatches);
                    setChampion(null);
                }
            })
            .catch(err => console.error("Failed to load bracket:", err));
    }, [eventId, refreshTrigger]);

    // Render match (read-only)
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

                {m.winner && m.winner !== "TBD" && (
                    <p className="text-green-400 text-[10px] mt-0.5">🏆 {m.winner}</p>
                )}
            </div>
        );
    };

    // Draw bracket lines
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
        <PublicLayout>
            <div className="bg-gray-900 min-h-screen p-3 md:p-6 text-white w-full overflow-x-auto">
                <Head title="5-Team Double Elimination Bracket" />
                <h1 className="text-xl font-bold text-center mb-4">5-Team Double Elimination Bracket</h1>

                <div id="bracket-container" className="relative w-full overflow-visible">
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
            </div>
        </PublicLayout>
    );
}
