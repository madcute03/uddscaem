import React, { useState, useEffect } from "react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowTwoTeamBracket({ savedBracket }) {
    const defaultMatch = {
        M1: { p1: { name: "TBD", score: "" }, p2: { name: "TBD", score: "" }, winner: null }
    };

    const [match, setMatch] = useState(defaultMatch);
    const [champion, setChampion] = useState(null);

    // Load saved bracket
    useEffect(() => {
        if (savedBracket) {
            setMatch(savedBracket.match || defaultMatch);
            setChampion(savedBracket.champion || null);
        }
    }, [savedBracket]);

    const renderMatch = (id, label) => {
        const m = match[id];
        return (
            <div className="p-3 border rounded-lg bg-gray-800 text-white mb-6 w-44 relative">
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

    return (
        <PublicLayout>
        <div className="bg-gray-900 min-h-screen p-6 text-white flex flex-col items-center">
            <h1 className="text-2xl font-bold text-center mb-6">
                2-Team Single Elimination Bracket
            </h1>

            <div className="flex items-center gap-32">
                {renderMatch("M1", "Match 1")}
                {champion && (
                    <div>
                        <h2 className="text-3xl font-bold text-yellow-400">
                            🏆 {champion}
                        </h2>
                    </div>
                )}
            </div>
        </div>
        </PublicLayout>
    );
}
