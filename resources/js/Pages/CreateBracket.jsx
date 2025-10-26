import React, { useState } from "react";
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Link, Head, router } from "@inertiajs/react";
import axios from "axios";
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

// Round Robin (generic)
import RrBracket from "@/Pages/Bracket/RoundRobinBracket/RoundRobin";

export default function CreateBracket({ events = [] }) {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [bracketType, setBracketType] = useState(null); // "single" or "double"
    const [teamCount, setTeamCount] = useState(null);
    const [isBracketModalOpen, setIsBracketModalOpen] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingEvent, setPendingEvent] = useState(null);
    const [showEventStatusWarning, setShowEventStatusWarning] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    // Check if an event is ongoing
    const isEventOngoing = (event) => {
        if (!event) return false;
        const today = new Date();
        const eventDate = new Date(event.event_date);
        
        // Set both dates to start of day for comparison
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        
        console.log('Today:', today.toISOString(), 'Event date:', eventDate.toISOString()); // Debug
        return eventDate <= today && !event.is_done;
    };

    const handleTeamCountSelection = async (count) => {
        if (!selectedEvent || !bracketType) {
            return;
        }

        try {
            // First, reset any existing bracket data for this event
            const resetPayload = {
                bracket_type: bracketType,
                teams: count,
                reset: true  // Add a flag to indicate this is a reset
            };

            // Use the appropriate endpoint based on bracket type
            const endpoint = bracketType === 'single' 
                ? `/events/${selectedEvent.id}/bracket-settings`
                : route('bracket.storeSettings', { event: selectedEvent.id });

            // Send the reset request
            const response = await axios.post(endpoint, resetPayload);
            
            // If reset was successful, update the UI
            if (response.data.success) {
                setTeamCount(count);
                setIsBracketModalOpen(true);
                
                // Force a refresh of the bracket data
                if (bracketType === 'single') {
                    router.reload({ only: ['events'] });
                } else {
                    // For double elimination, we need to trigger a refresh of the bracket data
                    window.dispatchEvent(new CustomEvent('bracket-data-reset', {
                        detail: { eventId: selectedEvent.id, teamCount: count }
                    }));
                }
            }
        } catch (error) {
            console.error('Error resetting bracket:', error);
            alert("Failed to reset bracket. Please try again.");
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
                : bracketType === "round"
                    ? RrBracket
                    : null;

    return (
        <AuthenticatedLayout>
            <Head title="Bracket Management" />
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Link 
                        href={route('dashboard')}
                        className="inline-flex items-center text-slate-300 hover:text-white mb-6 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Events
                    </Link>
                    
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Tournament Bracket Management</h1>
                        <p className="text-gray-400">Select an event to create or manage brackets</p>
                    </div>

                    {visibleEvents.length === 0 ? (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
                            <div className="text-gray-400 mb-4">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-white">No events available</h3>
                            <p className="mt-2 text-sm text-gray-400">
                                There are currently no events that allow bracket creation.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {visibleEvents.map((event) => (
                                <div key={event.id} className="bg-gray-800/50 border border-gray-700/70 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                                    <div className="flex items-center justify-center mb-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-white">{event.title}</h3>
                                    </div>
                                    <div className="flex flex-col space-y-3">
                                        <button
                                            onClick={() => {
                                                setPendingEvent(event);
                                                setPendingAction('create');
                                                if (!isEventOngoing(event)) {
                                                    setShowEventStatusWarning(true);
                                                    return;
                                                }
                                                if (event.bracket_type) {
                                                    setShowConfirmation(true);
                                                } else {
                                                    setSelectedEvent(event);
                                                    setBracketType(null);
                                                    setTeamCount(null);
                                                    setIsBracketModalOpen(false);
                                                }
                                            }}
                                            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                            {event.bracket_type ? 'Create New Bracket' : 'Create Bracket'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (!isEventOngoing(event)) {
                                                    setPendingEvent(event);
                                                    setPendingAction('view');
                                                    setShowEventStatusWarning(true);
                                                    return;
                                                }
                                                
                                                if (event.bracket_type && event.teams) {
                                                    const isCurrentEventActive = selectedEvent?.id === event.id && isBracketModalOpen;
                                                    if (isCurrentEventActive) {
                                                        handleCloseBracketModal();
                                                    } else {
                                                        setSelectedEvent(event);
                                                        setBracketType(event.bracket_type);
                                                        setTeamCount(event.teams);
                                                        setIsBracketModalOpen(true);
                                                    }
                                                } else {
                                                    alert("You have not created a bracket yet for this event.");
                                                }
                                            }}
                                            className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors duration-200"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            {selectedEvent?.id === event.id && isBracketModalOpen ? "Hide Bracket" : "View Bracket"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Confirmation Dialog */}
                    <Transition appear show={showConfirmation} as={Fragment}>
                        <Dialog as="div" className="relative z-50" onClose={() => setShowConfirmation(false)}>
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <div className="fixed inset-0 bg-black/50" />
                            </Transition.Child>

                            <div className="fixed inset-0 overflow-y-auto">
                                <div className="flex min-h-full items-center justify-center p-4 text-center">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-out duration-300"
                                        enterFrom="opacity-0 scale-95"
                                        enterTo="opacity-100 scale-100"
                                        leave="ease-in duration-200"
                                        leaveFrom="opacity-100 scale-100"
                                        leaveTo="opacity-0 scale-95"
                                    >
                                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                                            <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                                                Reset Bracket Confirmation
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-300">
                                                    Are you sure you want to create a new bracket? This will reset any existing bracket data for this event.
                                                </p>
                                            </div>

                                            <div className="mt-6 flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                    onClick={() => setShowConfirmation(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                                                    onClick={() => {
                                                        setSelectedEvent(pendingEvent);
                                                        setBracketType(null);
                                                        setTeamCount(null);
                                                        setIsBracketModalOpen(false);
                                                        setShowConfirmation(false);
                                                    }}
                                                >
                                                    Yes, Reset Bracket
                                                </button>
                                            </div>
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </div>
                        </Dialog>
                    </Transition>

                    {/* Event Status Warning Dialog */}
                    <Transition appear show={showEventStatusWarning} as={Fragment}>
                        <Dialog as="div" className="relative z-50" onClose={() => setShowEventStatusWarning(false)}>
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <div className="fixed inset-0 bg-black/50" />
                            </Transition.Child>

                            <div className="fixed inset-0 overflow-y-auto">
                                <div className="flex min-h-full items-center justify-center p-4 text-center">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-out duration-300"
                                        enterFrom="opacity-0 scale-95"
                                        enterTo="opacity-100 scale-100"
                                        leave="ease-in duration-200"
                                        leaveFrom="opacity-100 scale-100"
                                        leaveTo="opacity-0 scale-95"
                                    >
                                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-yellow-900/90 p-6 text-left align-middle shadow-xl transition-all border border-yellow-700">
                                            <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-yellow-100">
                                                ⚠️ Event Not Ongoing
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-yellow-200">
                                                    This event is not currently ongoing. Are you sure you want to {
                                                        pendingAction === 'create' ? 'create a bracket' : 
                                                        'view the bracket'
                                                    }?
                                                </p>
                                            </div>

                                            <div className="mt-6 flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-yellow-600 px-4 py-2 text-sm font-medium text-yellow-100 hover:bg-yellow-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
                                                    onClick={() => setShowEventStatusWarning(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
                                                    onClick={() => {
                                                        setShowEventStatusWarning(false);
                                                        if (pendingAction === 'create') {
                                                            if (pendingEvent.bracket_type) {
                                                                setShowConfirmation(true);
                                                            } else {
                                                                setSelectedEvent(pendingEvent);
                                                                setBracketType(null);
                                                                setTeamCount(null);
                                                                setIsBracketModalOpen(false);
                                                            }
                                                        } else {
                                                            setSelectedEvent(pendingEvent);
                                                            setBracketType(pendingEvent.bracket_type);
                                                            setTeamCount(pendingEvent.teams);
                                                            setIsBracketModalOpen(true);
                                                        }
                                                    }}
                                                >
                                                    Continue Anyway
                                                </button>
                                            </div>
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </div>
                        </Dialog>
                    </Transition>

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

                                    <button
                                        onClick={() => setBracketType("round")}
                                        className="block w-full bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700 transition-colors"
                                    >
                                        Round Robin
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
                                        : bracketType === "double"
                                            ? [3, 4, 5, 6, 7, 8]
                                            : [3, 4, 5, 6, 7, 8]
                                    ).map((count) => (
                                        <button
                                            key={count}
                                            onClick={() => handleTeamCountSelection(count)}
                                            className={
                                                bracketType === "single"
                                                    ? "block bg-green-600 text-white px-4 py-2 rounded text-center hover:bg-green-700"
                                                    : bracketType === "double"
                                                        ? "block bg-purple-600 text-white px-4 py-2 rounded text-center hover:bg-purple-700"
                                                        : "block bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700"
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
                        <div className="fixed inset-0 z-50 flex flex-col p-0 bg-black/80 overflow-y-auto">
                            <div className="relative w-full max-w-full flex-1 flex flex-col min-h-0">
                                {/* Header with close button */}
                                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                                    <h2 className="text-xl font-bold text-white">
                                        {selectedEvent.title} - Bracket View
                                    </h2>
                                    <button
                                        onClick={handleCloseBracketModal}
                                        className="p-1.5 rounded-full hover:bg-gray-700/50 text-gray-300 hover:text-white transition-colors"
                                        aria-label="Close bracket"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-auto bg-gray-900/50">
                                    <div className="max-w-full overflow-x-auto p-4">
                                        <div className="min-w-max mx-auto">
                                            <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg shadow-lg inline-block">
                                                <div className="p-4">
                                                    <SelectedBracket
                                                        eventId={selectedEvent.id}
                                                        teamCount={teamCount}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
