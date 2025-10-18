import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowFourTeamBracket({ eventId }) {
    const defaultMatches = {
        SF1: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
        SF2: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
        GF: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
    };

    const [matches, setMatches] = useState(defaultMatches);
    const [champion, setChampion] = useState(null);
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
                }
            })
            .catch(err => console.error("Failed to load bracket:", err));
    }, [eventId]);

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
                    <div 
                        key={k} 
                        className={`flex justify-between items-center mb-0.5 text-[10px] sm:text-xs ${m.winner === m[k]?.name ? "bg-green-600" : "bg-gray-700"} px-1.5 py-1 sm:py-0.5 rounded`}
                    >
                        <span>{m[k]?.name ?? "TBD"}</span>
                        <span className="ml-2">{m[k]?.score || "-"}</span>
                    </div>
                ))}
                {m.winner && m.winner !== "TBD" && (
                    <p className="text-green-400 text-[10px] mt-0.5 text-center">🏆 {m.winner} 🏆</p>
                )}
            </div>
        );
    };

    // Draw connecting lines
    useLayoutEffect(() => {
        const container = document.getElementById("bracket-container");
        if (!container) return;
        const connections = [
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
        <PublicLayout>
            <div className="bg-gray-900 min-h-screen p-2 md:p-6 text-white w-full overflow-x-auto">
                <h1 className="text-xl font-bold text-center mb-4">4-Team Single Elimination Bracket</h1>

                <div id="bracket-container" className="relative">
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {lines.map((d, i) => (
                            <path key={i} d={d} stroke="white" strokeWidth="2" fill="none" />
                        ))}
                    </svg>

                    <div className="flex flex-col gap-6 min-w-max">
                        <div className="flex gap-12 sm:gap-20 md:gap-28 lg:gap-36 xl:gap-44">
                            <div className="space-y-16 sm:space-y-20 md:space-y-24">
                                {renderMatch("SF1", "Match 1")}
                                {renderMatch("SF2", "Match 2")}
                            </div>
                            <div className="flex flex-col justify-center">
                                <div>
                                    {renderMatch("GF", "Match 3")}
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
