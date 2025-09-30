import React, { useState, useRef, useLayoutEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowResult({ eventId, matches: initialMatches, champion: initialChampion, teamCount }) {
    const boxRefs = useRef({});
    const [matches, setMatches] = useState(initialMatches || {});
    const [lines, setLines] = useState([]);
    const [champion, setChampion] = useState(initialChampion || null);

    // Generate empty matches if none exist
    const generateEmptyMatches = () => {
        const ids = [
            "UB1", "UB2", "UB3", "UB5", "UB6", "UB7",
            "LB1", "LB2", "LB3", "LB4", "LB5",
            "GF"
        ];
        const empty = {};
        ids.forEach(id => {
            empty[id] = { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null };
        });
        return empty;
    };

    if (!initialMatches) {
        setMatches(generateEmptyMatches());
    }

    const renderMatch = (id) => {
        const m = matches[id] || { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null };
        return (
            <div
                id={id}
                ref={el => (boxRefs.current[id] = el)}
                className="p-1.5 border rounded-lg bg-gray-800 text-white mb-2 w-36 sm:w-40 md:w-44 relative"
            >
                <p className="font-bold mb-0.5 text-[10px] sm:text-xs">{id}</p>
                {["p1", "p2"].map(key => (
                    <div 
                        key={key} 
                        className={`flex justify-between items-center mb-0.5 text-[10px] sm:text-xs ${
                            m.winner === m[key]?.name ? "bg-green-600" : "bg-gray-700"
                        } px-1.5 py-1 sm:py-0.5 rounded`}
                    >
                        <span>{m[key]?.name ?? "TBD"}</span>
                        <span className="ml-2">{m[key]?.score || "-"}</span>
                    </div>
                ))}
                
                {/* Show Winner only if valid */}
                {m.winner && m.winner !== "TBD" && (
                    <p className="text-green-400 text-[10px] mt-0.5">🏆 {m.winner}</p>
                )}
            </div>
        );
    };

    // Draw bracket lines dynamically
    useLayoutEffect(() => {
        const updateLines = () => {
            const container = document.getElementById("bracket-container");
            if (!container) return;

            // connections for 7-team double elimination
            const connections = [
                ["UB1", "UB5"], ["UB2", "UB6"], ["UB3", "UB6"],
                ["UB5", "UB7"], ["UB6", "UB7"], ["UB7", "GF"],
                ["LB1", "LB3"], ["LB2", "LB4"], ["LB3", "LB4"], ["LB4", "LB5"], ["LB5", "GF"]
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
            <Head />
            <div className="bg-gray-900 min-h-screen p-2 md:p-6 text-white w-full overflow-x-auto overflow-y-visible">
                <h1 className="text-xl font-bold text-center mb-4">{teamCount}-Team Double Elimination Bracket</h1>

                <div id="bracket-container" className="relative overflow-visible">
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
                        {lines.map((d, i) => <path key={i} d={d} stroke="white" strokeWidth="2" fill="none" />)}
                    </svg>

                    <div className="flex flex-col gap-4 sm:gap-6 min-w-max pr-[500px] overflow-visible">
                        <div className="mb-6">
                            <h2 className="font-bold text-sm mb-3">Upper Bracket</h2>
                            <div className="flex gap-24 sm:gap-32 md:gap-40 lg:gap-48">
                                <div className="space-y-2 sm:space-y-3">{renderMatch("UB1")}{renderMatch("UB2")}{renderMatch("UB3")}</div>
                                <div className="mt-8">
                                    {renderMatch("UB5")}
                                    {renderMatch("UB6")}
                                </div>
                                <div className="mt-16">{renderMatch("UB7")}</div>
                            </div>
                        </div>

                        <div>
                            <h2 className="font-bold text-sm mb-3">Lower Bracket</h2>
                            <div className="flex gap-24 sm:gap-32 md:gap-40 lg:gap-48">
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="h-8"></div>
                                    {renderMatch("LB1")}{renderMatch("LB2")}
                                </div>
                                <div className="mt-8 space-y-10">{renderMatch("LB3")}{renderMatch("LB4")}</div>
                                <div className="mt-16">{renderMatch("LB5")}</div>
                            </div>
                        </div>

                        <div className="absolute left-[900px] top-1/2 transform -translate-y-1/2">
                            {renderMatch("GF")}
                            {champion && <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400 mt-2 sm:mt-3 text-center">🏆 {champion} 🏆</h2>}
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
