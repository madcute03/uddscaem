import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowThreeTeamBracket({ savedBracket }) {
    const defaultMatches = {
        SF: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
        GF: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
    };

    const [matches, setMatches] = useState(defaultMatches);
    const [champion, setChampion] = useState(null);
    const boxRefs = useRef({});
    const [lines, setLines] = useState([]);

    // Load saved bracket
    useEffect(() => {
        if (savedBracket) {
            setMatches(savedBracket.matches || defaultMatches);
            setChampion(savedBracket.champion || null);
        }
    }, [savedBracket]);

    const renderMatch = (id, label) => {
        const m = matches[id];
        return (
            <div
                id={id}
                ref={(el) => (boxRefs.current[id] = el)}
                className="p-3 border rounded-lg bg-gray-800 text-white mb-6 w-44 relative"
            >
                <p className="font-bold mb-1 text-center">{label}</p>
                {["p1", "p2"].map((key) => (
                    <div
                        key={key}
                        className={`flex justify-between items-center mb-2 px-2 py-1 rounded ${m.winner === m[key]?.name ? "bg-green-600" : "bg-gray-700"
                            }`}
                    >
                        <span>{m[key]?.name ?? "TBD"}</span>
                        <span>{m[key]?.score || "-"}</span>
                    </div>
                ))}
                {m.winner && <p className="text-green-400 text-sm mt-1">Winner: {m.winner}</p>}
            </div>
        );
    };

    useLayoutEffect(() => {
        const container = document.getElementById("bracket-container");
        if (!container) return;
        const connections = [["SF", "GF"]];

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
            const midX = startX + (endX - startX) / 2;

            return `M${startX},${startY} H${midX} V${endY} H${endX}`;
        }).filter(Boolean);

        setLines(newLines);
    }, [matches]);

    return (
        <PublicLayout>
        <div className="bg-gray-900 min-h-screen p-6 text-white flex flex-col items-center">
            <h1 className="text-2xl font-bold text-center mb-6">
                3-Team Single Elimination Bracket
            </h1>

            <div id="bracket-container" className="relative flex items-center gap-32">
                <div className="flex flex-col gap-24">{renderMatch("SF", "Semi-Final")}</div>
                <div className="flex flex-col gap-24 mt-12 relative">
                    {renderMatch("GF", "Grand Final")}
                    {champion && (
                        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-6">
                            <h2 className="text-3xl font-bold text-yellow-400">🏆 {champion}</h2>
                        </div>
                    )}
                </div>

                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {lines.map((d, i) => (
                        <path key={i} d={d} stroke="white" strokeWidth="2" fill="none" />
                    ))}
                </svg>
            </div>
        </div>
        </PublicLayout>
    );
}
