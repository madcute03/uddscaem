import React, { useState } from "react";
import { Link, Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

// Double Elimination Brackets
import DEBracket3 from "@/Pages/Bracket/DoubleEliminationBracket/Bracket3/Bracket";
import DEBracket4 from "@/Pages/Bracket/DoubleEliminationBracket/Bracket4/Bracket";
import DEBracket5 from "@/Pages/Bracket/DoubleEliminationBracket/Bracket5/Bracket";
import DEBracket6 from "@/Pages/Bracket/DoubleEliminationBracket/Bracket6/Bracket";
import DEBracket7 from "@/Pages/Bracket/DoubleEliminationBracket/Bracket7/Bracket";
import DEBracket8 from "@/Pages/Bracket/DoubleEliminationBracket/Bracket8/Bracket";

// Single Elimination Brackets
import SEBracket2 from "@/Pages/Bracket/SingleEliminationBracket/Bracket2/Bracket2";
import SEBracket3 from "@/Pages/Bracket/SingleEliminationBracket/Bracket3/Bracket3";
import SEBracket4 from "@/Pages/Bracket/SingleEliminationBracket/Bracket4/Bracket4";
import SEBracket5 from "@/Pages/Bracket/SingleEliminationBracket/Bracket5/Bracket5";
import SEBracket6 from "@/Pages/Bracket/SingleEliminationBracket/Bracket6/Bracket6";
import SEBracket7 from "@/Pages/Bracket/SingleEliminationBracket/Bracket7/Bracket7";
import SEBracket8 from "@/Pages/Bracket/SingleEliminationBracket/Bracket8/Bracket8";

export default function CreateBracket({ events = [] }) {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [bracketType, setBracketType] = useState(null); // "single" or "double"
    const [teamCount, setTeamCount] = useState(null);
    const [isBracketModalOpen, setIsBracketModalOpen] = useState(false);

    const handleTeamCountSelection = (count) => {
        if (!selectedEvent || !bracketType) {
            return;
        }

        const payload = {
            bracket_type: bracketType,
            teams: count,
        };

        const requestOptions = {
            onSuccess: () => {
                setTeamCount(count);
                setIsBracketModalOpen(true);
            },
            onError: (errors) => {
                console.error(errors);
                alert("Failed to save bracket settings.");
            },
        };

        if (bracketType === "single") {
            router.post(
                `/events/${selectedEvent.id}/bracket-settings`,
                payload,
                requestOptions
            );
        } else {
            router.post(
                route("bracket.storeSettings", {
                    event: selectedEvent.id,
                }),
                payload,
                requestOptions
            );
        }
    };

    const handleCloseBracketModal = () => {
        setIsBracketModalOpen(false);
        setSelectedEvent(null);
        setBracketType(null);
        setTeamCount(null);
    };

    // Map team count to the correct bracket component
    const doubleEliminationBrackets = {
        3: DEBracket3,
        4: DEBracket4,
        5: DEBracket5,
        6: DEBracket6,
        7: DEBracket7,
        8: DEBracket8,
    };

    const singleEliminationBrackets = {
        2: SEBracket2,
        3: SEBracket3,
        4: SEBracket4,
        5: SEBracket5,
        6: SEBracket6,
        7: SEBracket7,
        8: SEBracket8,
    };

    // Only show events that allow bracketing
    const visibleEvents = (events || []).filter((e) => e?.allow_bracketing);

    const SelectedBracket =
        bracketType === "double"
            ? teamCount
                ? doubleEliminationBrackets[teamCount]
                : null
            : bracketType === "single"
            ? teamCount
                ? singleEliminationBrackets[teamCount]
                : null
            : null;

    return (
        <AuthenticatedLayout>
            <Head title="Create Bracket" />
            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold mb-4">
                    Select Event for Bracket
                </h1>
                {visibleEvents.length === 0 ? (
                    <p className="text-gray-400">No events available.</p>
                ) : (
                    <div className="space-y-4">
                        {visibleEvents.map((event) => (
                            <div
                                key={event.id}
                                className="border border-slate-700/70 bg-slate-900/50 rounded-xl p-5 shadow-sm hover:shadow-lg transition"
                            >
                                <h2 className="py-2 text-lg font-semibold">
                                    {event.title}
                                </h2>
                                <p className="py-2 text-gray-700">
                                    {event.description}
                                </p>
                                <p className="py-2 text-sm text-gray-500">
                                    Date: {event.event_date}
                                </p>

                                <button
                                    onClick={() => {
                                        setSelectedEvent(event);
                                        setBracketType(null);
                                        setTeamCount(null);
                                        setIsBracketModalOpen(false);
                                    }}
                                    className="py-2 w-[200px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                >
                                    Create and Reset Bracket
                                </button>
                                <br />
                                <button
                                    onClick={() => {
                                        if (event.bracket_type && event.teams) {
                                            const isCurrentEventActive =
                                                selectedEvent?.id === event.id &&
                                                isBracketModalOpen;

                                            if (isCurrentEventActive) {
                                                handleCloseBracketModal();
                                            } else {
                                                setSelectedEvent(event);
                                                setBracketType(
                                                    event.bracket_type
                                                );
                                                setTeamCount(event.teams);
                                                setIsBracketModalOpen(true);
                                            }
                                        } else {
                                            alert(
                                                "You have not created a bracket yet for this event."
                                            );
                                        }
                                    }}
                                    className="w-[200px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                >
                                    {selectedEvent?.id === event.id &&
                                    isBracketModalOpen
                                        ? "Hide Bracket"
                                        : "View Created Bracket"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Step 1: Choose Bracket Type */}
                {selectedEvent && !bracketType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/80 overflow-y-auto">
                        <div className="w-full max-w-md bg-gray-800 text-white rounded-xl shadow-2xl border border-gray-700 p-5 sm:p-6">
                            <h2 className="text-xl font-bold mb-4 text-center">
                                Choose Bracket Type for {selectedEvent.title}
                            </h2>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setBracketType("single")}
                                    className="block w-full bg-green-600 text-white px-4 py-2 rounded text-center hover:bg-green-700 transition-colors"
                                >
                                    Single Elimination
                                </button>

                                <button
                                    onClick={() => setBracketType("double")}
                                    className="block w-full bg-purple-600 text-white px-4 py-2 rounded text-center hover:bg-purple-700 transition-colors"
                                >
                                    Double Elimination
                                </button>
                            </div>

                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="mt-4 w-full bg-red-300 px-4 py-2 rounded hover:bg-red-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Choose Number of Teams */}
                {selectedEvent && bracketType && !teamCount && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/80 overflow-y-auto">
                        <div className="w-full max-w-md bg-gray-800 text-white rounded-xl shadow-2xl border border-gray-700 p-5 sm:p-6">
                            <h2 className="text-xl font-bold mb-4 text-center">
                                Select Number of Teams (
                                {bracketType === "single" ? "Single" : "Double"}{" "}
                                Elimination)
                            </h2>

                            <div className="grid grid-cols-2 gap-3">
                                {(bracketType === "single"
                                    ? [2, 3, 4, 5, 6, 7, 8]
                                    : [3, 4, 5, 6, 7, 8]
                                ).map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => handleTeamCountSelection(count)}
                                        className={
                                            bracketType === "single"
                                                ? "block bg-green-600 text-white px-4 py-2 rounded text-center hover:bg-green-700"
                                                : "block bg-purple-600 text-white px-4 py-2 rounded text-center hover:bg-purple-700"
                                        }
                                    >
                                        {count} Teams
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setBracketType(null)}
                                className="mt-4 w-full bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}

                {/* Render the selected bracket component */}
                {SelectedBracket && selectedEvent && isBracketModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto">
                        <div className="relative min-h-full w-full bg-white rounded-none sm:rounded-xl shadow-2xl">
                            <button
                                onClick={handleCloseBracketModal}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                                aria-label="Close bracket"
                            >
                                ✕
                            </button>
                            <div className="p-0 sm:p-6">
                                <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                                    {selectedEvent.title} Bracket
                                </h2>
                                <div className="bg-gray-100 w-full rounded-none sm:rounded-lg overflow-x-auto">
                                    <div className="min-w-[1100px] sm:min-w-[1400px] p-0 sm:p-4">
                                        <SelectedBracket
                                            eventId={selectedEvent.id}
                                            teamCount={teamCount}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
