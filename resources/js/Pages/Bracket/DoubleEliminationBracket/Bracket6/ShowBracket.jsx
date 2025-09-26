import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowResult({ eventId, refreshTrigger }) {
    const boxRefs = useRef({});
    const [lines, setLines] = useState([]);
    const [champion, setChampion] = useState(null);

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
                        <span className="ml-2 px-2 py-1 bg-gray-900 rounded border border-white w-8 text-center">
                            {m[key].score}
                        </span>
                    </div>
                ))}
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
            <div className="bg-gray-900 min-h-screen p-4 text-white">
                <Head title="Bracket Results" />
                <h1 className="text-2xl font-bold text-center mb-6">6-Team Double Elimination Bracket</h1>

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
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-center">Round 1</h3>
                                {renderMatch("UB1")}
                                {renderMatch("UB2")}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-center">Round 2</h3>
                                {renderMatch("UB3")}
                                {renderMatch("UB4")}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-center">Round 3</h3>
                                {renderMatch("UB5")}
                            </div>
                        </div>
                    </div>

                    {/* Lower Bracket */}
                    <div>
                        <h2 className="font-bold mb-2">Lower Bracket</h2>
                        <div className="flex gap-12 mb-10">
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-center">Round 1</h3>
                                {renderMatch("LB1")}
                                {renderMatch("LB2")}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-center">Round 2</h3>
                                {renderMatch("LB3")}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-center">Round 3</h3>
                                {renderMatch("LB4")}
                            </div>
                        </div>
                    </div>

                    {/* Grand Final */}
                    <div
                        className="flex flex-col justify-center items-center"
                        style={{ position: "absolute", left: "55%", top: "50%", transform: "translateY(-50%)" }}
                    >
                        <h2 className="font-bold mb-2 text-center">Grand Final</h2>
                        {renderMatch("GF")}
                    </div>

                    {/* Champion */}
                    {champion && (
                        <div
                            className="flex flex-col justify-center items-center"
                            style={{ position: "absolute", left: "70%", top: "55%", transform: "translateY(-50%)" }}
                        >
                            <h2 className="text-3xl font-bold text-yellow-400">🏆 Champion: {champion}</h2>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
