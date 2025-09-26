import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowResult({ eventId,teamCount }) {
    const defaultMatches = {
        UB1: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null },
        UB2: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null },
        UB3: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null },
        LB1: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null },
        LB2: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null },
        GF: { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null },
    };

    const [matches, setMatches] = useState(structuredClone(defaultMatches));
    const [champion, setChampion] = useState(null);
    const [lines, setLines] = useState([]);
    const boxRefs = useRef({});

    // Load saved bracket
    useEffect(() => {
        if (!eventId) return;
        fetch(route("double-elimination.show", { event: eventId }))
            .then(res => res.json())
            .then(data => {
                if (data.matches) setMatches({ ...defaultMatches, ...data.matches });
                if (data.champion) setChampion(data.champion);
            })
            .catch(err => console.error(err));
    }, [eventId]);

    const renderMatch = (id) => {
        const m = matches[id];
        if (!m) return null;
        return (
            <div
                id={id}
                ref={(el) => (boxRefs.current[id] = el)}
                className="p-3 border rounded-lg bg-gray-800 text-white mb-6 w-44 relative"
            >
                <p className="font-bold mb-1">{id}</p>
                {["p1", "p2"].map((key) => (
                    <div
                        key={key}
                        className={`flex justify-between items-center w-full px-2 py-1 mb-1 rounded text-left ${m.winner === m[key].name ? "bg-green-600" : "bg-gray-700"
                            }`}
                    >
                        <span>{m[key].name}</span>
                        <span className="ml-2">{m[key].score}</span>
                    </div>
                ))}
                
            </div>
        );
    };

    useLayoutEffect(() => {
        const updateLines = () => {
            const container = document.getElementById("bracket-container");
            if (!container) return;
            const connections = [
                ["UB1", "UB3"], ["UB2", "UB3"], ["UB3", "GF"],
                ["LB1", "LB2"], ["LB2", "GF"],
            ];
            const newLines = [];
            connections.forEach(([fromId, toId]) => {
                const from = boxRefs.current[fromId];
                const to = boxRefs.current[toId];
                if (!from || !to) return;
                const f = from.getBoundingClientRect();
                const t = to.getBoundingClientRect();
                const c = container.getBoundingClientRect();
                const startX = f.right - c.left;
                const startY = f.top + f.height / 2 - c.top;
                const endX = t.left - c.left;
                const endY = t.top + t.height / 2 - c.top;
                const midX = startX + 20;
                const path = `M${startX},${startY} H${midX} V${endY} H${endX}`;
                newLines.push(path);
            });
            setLines(newLines);
        };
        requestAnimationFrame(updateLines);
    }, [matches]);

    return (
        <PublicLayout>
        <div className="bg-gray-900 min-h-screen p-6 text-white">
            <h1 className="text-2xl font-bold text-center mb-6">
                {teamCount}-Team Double Elimination Bracket (Results)
            </h1>

            <div id="bracket-container" className="relative">
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {lines.map((d, i) => (
                        <path key={i} d={d} stroke="white" strokeWidth="2" fill="none" />
                    ))}
                </svg>

                {/* Upper Bracket */}
                <div>
                    <h2 className="font-bold mb-2">Upper Bracket</h2>
                    <div className="flex gap-12 mb-10">
                        <div>{renderMatch("UB1")}{renderMatch("UB2")}</div>
                        <div className="mt-12">{renderMatch("UB3")}</div>
                    </div>
                </div>

                {/* Lower Bracket */}
                <div>
                    <h2 className="font-bold mb-2">Lower Bracket</h2>
                    <div className="flex gap-12 mb-10">
                        <div>{renderMatch("LB1")}</div>
                        <div className="mt-12">{renderMatch("LB2")}</div>
                    </div>
                </div>

                {/* Grand Final */}
                <div
                    className="flex flex-col justify-center items-center"
                    style={{ position: "absolute", left: "45%", top: "50%", transform: "translateY(-50%)" }}
                >
                    <h2 className="font-bold mb-2 text-center">Grand Final</h2>
                    {renderMatch("GF")}
                </div>
            </div>

            {champion && (
                <h2 className="text-3xl font-bold text-yellow-400 absolute left-[65%] top-[55%]">
                    🏆 Champion: {champion}
                </h2>
            )}
        </div>
        </PublicLayout>
    );
}
