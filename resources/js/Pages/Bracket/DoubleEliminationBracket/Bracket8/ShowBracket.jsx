//ShowResult.jsx

import React, { useState, useRef, useLayoutEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";

// Simple Modal component
function Modal({ open, onClose, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="relative bg-gray-900 rounded-lg shadow-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto border border-gray-700">
                <button
                    className="absolute top-2 right-2 text-white bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center z-10"
                    onClick={onClose}
                    aria-label="Close"
                >
                    &times;
                </button>
                {children}
            </div>
        </div>
    );
}


export default function ShowResult({ eventId, matches: initialMatches, champion: initialChampion, teamCount = 8 }) {
    const boxRefs = useRef({});
    const [matches, setMatches] = useState(initialMatches || {});
    const [lines, setLines] = useState([]);
    const [champion, setChampion] = useState(initialChampion || null);
    const [modalOpen, setModalOpen] = useState(true);

    // Generate empty matches if none exist
    const generateEmptyMatches = () => {
        const ids = [
            "UB1", "UB2", "UB3", "UB4", "UB5", "UB6", "UB7",
            "LB1", "LB2", "LB3", "LB4", "LB5", "LB6",
            "GF"
        ];
        const empty = {};
        ids.forEach(id => {
            empty[id] = { p1: { name: "TBD", score: 0 }, p2: { name: "TBD", score: 0 }, winner: null, loser: null };
        });
        return empty;
    };


    // Only set matches if initialMatches is undefined and matches is still empty
    React.useEffect(() => {
        if (!initialMatches && Object.keys(matches).length === 0) {
            setMatches(generateEmptyMatches());
        }
    }, [initialMatches]);

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

            // connections for 8-team double elimination
            const connections = [
                ["UB1", "UB5"], ["UB2", "UB5"], ["UB3", "UB6"], ["UB4", "UB6"],
                ["UB5", "UB7"], ["UB6", "UB7"], ["UB7", "GF"],
                ["LB1", "LB3"], ["LB2", "LB4"], ["LB3", "LB5"], ["LB4", "LB5"], ["LB5", "LB6"], ["LB6", "GF"]
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
            <Head title={`${teamCount}-Team Double Elimination`} />
            <div className="bg-gray-900 min-h-screen p-4 text-white flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-center mb-6">{teamCount}-Team Double Elimination Bracket</h1>
                <button
                    className="px-6 py-3 bg-blue-700 hover:bg-blue-800 rounded-lg text-white font-bold mb-8 shadow-lg"
                    onClick={() => setModalOpen(true)}
                >
                    View Bracket
                </button>
                <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                    <div
                        id="bracket-container"
                        className="relative bg-gray-900 p-4 rounded-lg flex flex-col items-center justify-center min-w-[900px] min-h-[600px] max-w-full max-h-[80vh] overflow-auto border border-gray-700"
                        style={{ boxSizing: 'border-box' }}
                    >
                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                            {lines.map((d, i) => <path key={i} d={d} stroke="white" strokeWidth="2" fill="none" />)}
                        </svg>
                        {/* Upper Bracket */}
                        <div className="mb-10 z-10">
                            <h2 className="font-bold mb-2">Upper Bracket</h2>
                            <div className="flex gap-12">
                                {/* First column: UB1–UB4 */}
                                <div className="flex flex-col gap-4">{renderMatch("UB1")}{renderMatch("UB2")}{renderMatch("UB3")}{renderMatch("UB4")}</div>
                                {/* Second column: UB5 & UB6 with extra top margin */}
                                <div className="flex flex-col gap-4 mt-12">
                                    {renderMatch("UB5")}
                                    {renderMatch("UB6")}
                                </div>
                                {/* Third column: UB7 */}
                                <div className="flex flex-col gap-4 mt-24">{renderMatch("UB7")}</div>
                            </div>
                        </div>
                        {/* Lower Bracket */}
                        <div className="mb-10 z-10">
                            <h2 className="font-bold mb-2">Lower Bracket</h2>
                            <div className="flex gap-12">
                                <div className="flex flex-col gap-4">{renderMatch("LB1")}{renderMatch("LB2")}</div>
                                <div className="flex flex-col gap-4">{renderMatch("LB3")}{renderMatch("LB4")}</div>
                                <div className="flex flex-col gap-4">{renderMatch("LB5")}</div>
                                <div className="flex flex-col gap-4">{renderMatch("LB6")}</div>
                            </div>
                        </div>
                        {/* Grand Final */}
                        <div className="absolute left-2/3 top-1/2 transform -translate-y-1/2 z-20">
                            {renderMatch("GF")}
                            {champion && <h2 className="text-3xl font-bold text-yellow-400 mt-4">🏆 Champion: {champion}</h2>}
                        </div>
                    </div>
                </Modal>
            </div>
        </PublicLayout>
    );
}
