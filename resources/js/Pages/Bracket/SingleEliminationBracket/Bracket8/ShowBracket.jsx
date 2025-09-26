import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowResult({ eventId }) {
    const defaultMatches = {
        R1A: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
        R1B: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
        R1C: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
        R1D: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
        SF1: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
        SF2: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
        GF: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null },
    };

    const [matches, setMatches] = useState(defaultMatches);
    const [champion, setChampion] = useState(null);
    const boxRefs = useRef({});
    const [lines, setLines] = useState([]);

    // Load bracket results
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
                className="p-3 border rounded-lg bg-gray-800 text-white mb-6 w-56 relative"
            >
                <p className="font-bold mb-2">{label}</p>
                {["p1", "p2"].map(k => (
                    <div key={k} className={`flex justify-between items-center mb-2 ${m.winner === m[k]?.name ? "bg-green-600" : "bg-gray-700"} px-2 py-1 rounded`}>
                        <span>{m[k]?.name ?? "TBD"}</span>
                        <span>{m[k]?.score || "-"}</span>
                    </div>
                ))}
                {m.winner && <p className="text-green-400 text-sm mt-1">Winner: {m.winner}</p>}
            </div>
        );
    };

    // Draw connecting lines
    useLayoutEffect(() => {
        const container = document.getElementById("bracket-container");
        if (!container) return;
        const connections = [
            ["R1A", "SF1"], ["R1B", "SF1"],
            ["R1C", "SF2"], ["R1D", "SF2"],
            ["SF1", "GF"], ["SF2", "GF"]
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
        <div className="bg-gray-900 min-h-screen p-4 text-white">
            <h1 className="text-2xl font-bold text-center mb-6">8-Team Bracket Results</h1>

            <div id="bracket-container" className="relative">
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {lines.map((d, i) => <path key={i} d={d} stroke="white" strokeWidth="2" fill="none" />)}
                </svg>

                <div className="flex flex-col md:flex-row md:gap-24 justify-center">
                    <div className="flex flex-col gap-6">
                        {renderMatch("R1A", "Round 1")}
                        {renderMatch("R1B", "Round 1")}
                        {renderMatch("R1C", "Round 1")}
                        {renderMatch("R1D", "Round 1")}
                    </div>
                    <div className="flex flex-col gap-72 mt-12">
                        {renderMatch("SF1", "Semi-Final 1")}
                        {renderMatch("SF2", "Semi-Final 2")}
                    </div>
                    <div className="mt-24">{renderMatch("GF", "Grand Final")}</div>
                </div>
            </div>

            {champion && <h2 className="text-3xl font-bold text-yellow-400 mt-6 text-center">🏆 Champion: {champion}</h2>}
        </div>
        </PublicLayout>
    );
}
