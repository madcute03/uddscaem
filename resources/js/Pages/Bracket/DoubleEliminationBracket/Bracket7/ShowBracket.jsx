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
                className="p-3 border rounded-lg bg-gray-800 text-white mb-6 w-44 relative"
            >
                <p className="font-bold mb-1">{id}</p>
                {["p1", "p2"].map(key => (
                    <div key={key} className={`flex justify-between items-center w-full px-2 py-1 mb-1 rounded text-left ${m.winner === m[key].name ? "bg-green-600" : "bg-gray-700"}`}>
                        <span>{m[key].name}</span>
                        <span className="ml-2 px-2 py-1 bg-gray-900 rounded border border-white w-8 text-center">{m[key].score}</span>
                    </div>
                ))}
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
            <div className="bg-gray-900 min-h-screen p-4 text-white">
                <h1 className="text-2xl font-bold text-center mb-6">{teamCount}-Team Double Elimination Bracket</h1>

                <div id="bracket-container" className="relative">
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {lines.map((d, i) => <path key={i} d={d} stroke="white" strokeWidth="2" fill="none" />)}
                    </svg>

                    {/* Upper Bracket */}
                    <div className="mb-10">
                        <h2 className="font-bold mb-2">Upper Bracket</h2>
                        <div className="flex gap-12">
                            {/* Round 1: UB1–UB3 */}
                            <div>{renderMatch("UB1")}{renderMatch("UB2")}{renderMatch("UB3")}</div>

                            {/* Round 2: UB5 & UB6 */}
                            <div className="mt-12">{renderMatch("UB5")}{renderMatch("UB6")}</div>

                            {/* Final: UB7 */}
                            <div className="mt-24">{renderMatch("UB7")}</div>
                        </div>
                    </div>

                    {/* Lower Bracket */}
                    <div className="mb-10">
                        <h2 className="font-bold mb-2">Lower Bracket</h2>
                        <div className="flex gap-12">
                            <div>{renderMatch("LB1")}{renderMatch("LB2")}</div>
                            <div>{renderMatch("LB3")}{renderMatch("LB4")}</div>
                            <div>{renderMatch("LB5")}</div>
                        </div>
                    </div>

                    {/* Grand Final */}
                    <div className="absolute left-2/3 top-1/2 transform -translate-y-1/2">
                        {renderMatch("GF")}
                        {champion && <h2 className="text-3xl font-bold text-yellow-400 mt-4">🏆 Champion: {champion}</h2>}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
