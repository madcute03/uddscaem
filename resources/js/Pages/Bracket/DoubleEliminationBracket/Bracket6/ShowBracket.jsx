import React, { useEffect, useState, useRef, useLayoutEffect, useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowResult({ eventId, refreshTrigger }) {
    const boxRefs = useRef({});
    const [lines, setLines] = useState([]);
    const [champion, setChampion] = useState(null);
    
    const matchLabelMap = useMemo(() => ({
        UB1: "Match 1",
        UB2: "Match 2",
        UB3: "Match 3",
        UB4: "Match 4",
        UB5: "Match 5",
        LB1: "Match 6",
        LB2: "Match 7",
        LB3: "Match 8",
        LB4: "Match 9",
        GF:  "Match 10",
    }), []);

    const emptyMatches = {
        UB1: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        UB2: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        UB3: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        UB4: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        UB5: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        LB1: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        LB2: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        LB3: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
        LB4: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null },
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
                    setMatches(data.matches);
                    setChampion(data.champion);
                } else {
                    setMatches(emptyMatches);
                    setChampion(null);
                }
            })
            .catch(err => console.error(err));
    }, [eventId, refreshTrigger]);

    const renderMatch = (id) => {
        const m = matches[id];
        const label = matchLabelMap[id] || id;
        return (
            <div
                id={id}
                ref={(el) => (boxRefs.current[id] = el)}
                className="p-1.5 border rounded-lg bg-gray-800 text-white mb-2 w-44 sm:w-52 md:w-60 lg:w-64 relative"
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

    useLayoutEffect(() => {
        const updateLines = () => {
            const container = document.getElementById("bracket-container");
            if (!container || !matches) return;

            const connections = [
                ["UB1", "UB3"],
                ["UB2", "UB4"],
                ["UB3", "UB5"],
                ["UB4", "UB5"],
                ["UB5", "GF"],
                ["LB1", "LB2"],
                ["LB2", "LB3"],
                ["LB3", "LB4"],
                ["LB4", "GF"],
            ];

            const newLines = [];
            connections.forEach(([fromId, toId]) => {
                const from = boxRefs.current[fromId];
                const to = boxRefs.current[toId];
                if (from && to) {
                    const fromBox = from.getBoundingClientRect();
                    const toBox = to.getBoundingClientRect();
                    const containerBox = container.getBoundingClientRect();

                    const startX = fromBox.right - containerBox.left;
                    const startY = fromBox.top + fromBox.height / 2 - containerBox.top;
                    const endX = toBox.left - containerBox.left;
                    const endY = toBox.top + toBox.height / 2 - containerBox.top;

                    const midX = startX + 30;
                    const midY = endY;
                    const path = `M${startX},${startY} H${midX} V${midY} H${endX}`;
                    newLines.push(path);
                }
            });

            setLines(newLines);
        };

        requestAnimationFrame(updateLines);
    }, [matches]);

    return (
        <PublicLayout>
            <div className="bracket-root">
                <div className="bg-gray-900 min-h-screen p-2 md:p-6 text-white w-full mx-auto overflow-x-auto">
                    <Head title="Bracket Results" />
                    <h1 className="text-xl font-bold text-center mb-4">6-Team Double Elimination Bracket</h1>

                <div id="bracket-container" className="relative w-full min-w-[1400px] overflow-x-auto">
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {lines.map((d, i) => (
                            <path key={i} d={d} stroke="white" strokeWidth="2" fill="none" />
                        ))}
                    </svg>

                    <div className="flex gap-12 sm:gap-16 md:gap-20 lg:gap-24 xl:gap-28 2xl:gap-32 min-w-[1400px] w-full">
                        {/* Left Column - Brackets */}
                        <div className="w-3/4">
                            {/* Upper Bracket */}
                            <div className="mb-8">
                                <h2 className="font-bold text-sm mb-3">Upper Bracket</h2>
                                <div className="flex gap-12 sm:gap-16 md:gap-20 lg:gap-24 xl:gap-28 2xl:gap-32">
                                    <div className="space-y-2 sm:space-y-3">
                                        {renderMatch("UB1")}
                                        {renderMatch("UB2")}
                                    </div>
                                    <div className="mt-8">
                                        {renderMatch("UB3")}
                                        {renderMatch("UB4")}
                                    </div>
                                    <div className="mt-16">
                                        {renderMatch("UB5")}
                                    </div>
                                </div>
                            </div>

                            {/* Lower Bracket */}
                            <div>
                                <h2 className="font-bold text-sm mb-3">Lower Bracket</h2>
                                <div className="flex gap-12 sm:gap-16 md:gap-20 lg:gap-24 xl:gap-28 2xl:gap-32">
                                    <div className="space-y-2 sm:space-y-3">
                                        <div className="h-8"></div>
                                        {renderMatch("LB1")}
                                        {renderMatch("LB2")}
                                    </div>
                                    <div className="mt-8">
                                        {renderMatch("LB3")}
                                    </div>
                                    <div className="mt-16">
                                        {renderMatch("LB4")}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Grand Final */}
                        <div className="w-1/4 flex items-center">
                            <div className="w-full">
                                <h2 className="font-bold text-sm mb-3 text-center">Grand Final</h2>
                                {renderMatch("GF")}
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
            </div>
        </PublicLayout>
    );
}
