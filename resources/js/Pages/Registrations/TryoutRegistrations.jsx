import { useState, useMemo } from "react";
import { Head, Link, router } from "@inertiajs/react";

export default function TryoutRegistrations({ players: initialPlayers, event }) {
    const [players, setPlayers] = useState(initialPlayers);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ 
        isOpen: false, 
        action: null, 
        playerId: null, 
        playerEmail: null, 
        showMessage: false, 
        message: '' 
    });
    const [query, setQuery] = useState("");

    // Search filter
    const filteredPlayers = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return players;
        return players.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.email || "").toLowerCase().includes(q) ||
                (p.student_id || "").toLowerCase().includes(q) ||
                (p.department || "").toLowerCase().includes(q)
        );
    }, [players, query]);

    // Badge color by status
    const statusBadge = (status) => {
        const s = (status || "Pending").toLowerCase();
        const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
        if (s === "approve" || s === "approved") return `${base} bg-green-500/20 text-green-300 border border-green-400/30`;
        if (s === "disapprove" || s === "disapproved") return `${base} bg-red-500/20 text-red-300 border border-red-400/30`;
        return `${base} bg-yellow-500/20 text-yellow-200 border border-yellow-400/30`;
    };

    // Update individual player status
    const handleStatusChange = () => {
        if (!modal.playerId) return;

        const playerId = modal.playerId;
        const action = modal.action;

        setPlayers((current) =>
            current.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          status: action,
                          previousStatus: p.status || "Pending",
                          statusUpdatedAt: new Date().toISOString(),
                      }
                    : p
            )
        );

        closeModal();

        // Undo timeout (10 seconds)
        const undoTimeout = setTimeout(() => {
            setPlayers((current) =>
                current.map((p) =>
                    p.id === playerId && p.status === action
                        ? (() => {
                              const { previousStatus, statusUpdatedAt, ...rest } = p;
                              return rest;
                          })()
                        : p
                )
            );
        }, 10000);

        // API call
        router.post(
            route("player.updateStatus"),
            {
                player_id: playerId,
                status: action,
                email: modal.playerEmail,
            },
            {
                onError: (errors) => {
                    console.error("Failed to update status:", JSON.stringify(errors, null, 2));
                    const errorMessage = typeof errors === 'object' 
                        ? Object.values(errors).flat().join(', ') 
                        : 'Failed to update status. Please try again.';
                    setPlayers((current) =>
                        current.map((p) =>
                            p.id === playerId
                                ? { ...p, status: p.previousStatus || "Pending" }
                                : p
                        )
                    );
                    alert(errorMessage);
                },
                preserveScroll: true,
                preserveState: true,
            }
        );

        return () => clearTimeout(undoTimeout);
    };

    const openModal = (playerId, playerEmail, action) => {
        const player = players.find((p) => p.id === playerId);
        if (player) {
            setModal({
                isOpen: true,
                playerId,
                playerEmail,
                action,
                showMessage: false,
                message: ''
            });
        }
    };

    const closeModal = () => {
        setModal((prev) => ({ ...prev, isOpen: false, showMessage: false, message: '' }));
    };

    const toggleMessage = () => {
        setModal((prev) => ({ ...prev, showMessage: !prev.showMessage }));
    };

    const sendDefaultMessage = () => {
        setLoading(true);

        if (!modal.playerId || !modal.playerEmail) {
            alert('Unable to find player information for sending message');
            setLoading(false);
            return;
        }

        router.post(
            route("player.sendMessage"),
            {
                player_id: modal.playerId,
                message: "",
                email: modal.playerEmail,
                is_default: true,
                action: modal.action,
            },
            {
                onSuccess: () => {
                    handleStatusChangeAfterEmail();
                },
                onError: (errors) => {
                    console.error('Failed to send default message:', JSON.stringify(errors, null, 2));
                    const errorMessage = typeof errors === 'object' 
                        ? Object.values(errors).flat().join(', ') 
                        : 'Failed to send notification. Please try again.';
                    alert(errorMessage);
                    setLoading(false);
                },
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    const sendMessage = () => {
        setLoading(true);

        if (!modal.playerId || !modal.playerEmail) {
            alert('Unable to find player information for sending message');
            setLoading(false);
            return;
        }

        router.post(
            route("player.sendMessage"),
            {
                player_id: modal.playerId,
                message: modal.message,
                email: modal.playerEmail,
                action: modal.action,
            },
            {
                onSuccess: () => {
                    handleStatusChangeAfterEmail();
                },
                onError: (errors) => {
                    console.error('Failed to send message:', JSON.stringify(errors, null, 2));
                    const errorMessage = typeof errors === 'object' 
                        ? Object.values(errors).flat().join(', ') 
                        : 'Failed to send message. Please try again.';
                    alert(errorMessage);
                    setLoading(false);
                },
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    const handleStatusChangeAfterEmail = () => {
        if (!modal.playerId) return;

        const playerId = modal.playerId;
        const action = modal.action;

        setPlayers((current) =>
            current.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          status: action,
                          previousStatus: p.status || "Pending",
                          statusUpdatedAt: new Date().toISOString(),
                      }
                    : p
            )
        );

        closeModal();
        setLoading(false);

        // Undo timeout (10 seconds)
        const undoTimeout = setTimeout(() => {
            setPlayers((current) =>
                current.map((p) =>
                    p.id === playerId && p.status === action
                        ? (() => {
                              const { previousStatus, statusUpdatedAt, ...rest } = p;
                              return rest;
                          })()
                        : p
                )
            );
        }, 10000);

        // API call to persist status change
        router.post(
            route("player.updateStatus"),
            {
                player_id: playerId,
                status: action,
                email: modal.playerEmail,
            },
            {
                onError: (errors) => {
                    console.error("Failed to update status:", JSON.stringify(errors, null, 2));
                    const errorMessage = typeof errors === 'object' 
                        ? Object.values(errors).flat().join(', ') 
                        : 'Failed to update status. Please try again.';
                    setPlayers((current) =>
                        current.map((p) =>
                            p.id === playerId
                                ? { ...p, status: p.previousStatus || "Pending" }
                                : p
                        )
                    );
                    alert(errorMessage);
                },
                preserveScroll: true,
                preserveState: true,
            }
        );

        return () => clearTimeout(undoTimeout);
    };

    return (
        <>
            <Head title="Tryout Registrations" />

            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100 py-10 px-2 sm:px-4 md:px-8">
                <Link
                    href={route("dashboard")}
                    className="relative text-[14px] font-extrabold uppercase text-[#e1e1e1]
                    cursor-pointer hover:text-white focus:text-white after:content-['']
                    after:absolute after:bottom-[-2px] after:left-1/2 after:w-0 after:h-[2px]
                    after:bg-white after:transition-[width,left] after:duration-400
                    hover:after:w-full hover:after:left-0 focus:after:w-full focus:after:left-0
                    h-15 px-2 mt-10"
                >
                    ← Back to dashboard
                </Link>

                <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-xl shadow-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                Tryout Registrations
                                {event?.title ? ` — ${event.title}` : ""}
                            </h1>
                            <p className="text-slate-300">
                                {filteredPlayers.length} player(s) found
                            </p>
                        </div>
                        <div className="w-full sm:w-96">
                            <label className="block text-sm mb-1 text-slate-300">
                                Search players
                            </label>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by name, email, ID, or department"
                                className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        {filteredPlayers.length === 0 ? (
                            <p className="text-slate-300 text-center py-6">
                                No players match your search.
                            </p>
                        ) : (
                            <div className="overflow-x-auto rounded border border-white/10 mt-4">
                                <table className="w-full table-auto">
                                    <thead>
                                        <tr className="bg-white/10 text-slate-200">
                                            <th className="px-3 py-2 text-left text-sm font-semibold">Name</th>
                                            <th className="px-3 py-2 text-left text-sm font-semibold">Email</th>
                                            <th className="px-3 py-2 text-left text-sm font-semibold">Student ID</th>
                                            <th className="px-3 py-2 text-left text-sm font-semibold">Department</th>
                                            <th className="px-3 py-2 text-left text-sm font-semibold">Age</th>
                                            <th className="px-3 py-2 text-left text-sm font-semibold">Documents</th>
                                            <th className="px-3 py-2 text-center text-sm font-semibold">Status</th>
                                            <th className="px-3 py-2 text-center text-sm font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPlayers.map((player) => (
                                            <tr
                                                key={player.id}
                                                className="odd:bg-white/0 even:bg-white/5"
                                            >
                                                <td className="px-3 py-2">{player.name}</td>
                                                <td className="px-3 py-2">{player.email}</td>
                                                <td className="px-3 py-2">{player.student_id}</td>
                                                <td className="px-3 py-2">{player.department}</td>
                                                <td className="px-3 py-2">{player.age}</td>
                                                <td className="px-3 py-2 text-center">
                                                    {player.gdrive_link && (
                                                        <a
                                                            href={player.gdrive_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-300 hover:underline"
                                                        >
                                                            Open link
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={statusBadge(player.status)}>
                                                        {player.status || "Pending"}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-3 text-center gap-2 flex justify-center">
                                                    <button
                                                        className="text-[11px] bg-blue-500/20 hover:bg-blue-500/30 text-white-300 px-2.5 py-1 rounded border border-blue-500/30 transition-colors flex items-center gap-1"
                                                        onClick={() =>
                                                            openModal(
                                                                player.id,
                                                                player.email,
                                                                "approve"
                                                            )
                                                        }
                                                        disabled={loading}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        className="text-[11px] bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2.5 py-1 rounded border border-red-500/30 transition-colors flex items-center gap-1"
                                                        onClick={() =>
                                                            openModal(
                                                                player.id,
                                                                player.email,
                                                                "disapprove"
                                                            )
                                                        }
                                                        disabled={loading}
                                                    >
                                                        Disapprove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Modal */}
            {modal.isOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-blue-300 p-6 rounded shadow max-w-md w-full text-center">
                        <h2 className="text-lg font-bold mb-4 capitalize">
                           Confirmation of Approval
                        </h2>
                        <p className="mb-4">
                            {modal.showMessage
                                ? `This will ${modal.action} the player and send them a message.`
                                : `Are you sure you want to ${modal.action} this player?`
                            }
                        </p>

                        {/* Message Section */}
                        <div className="mb-4 text-left">
                            <button
                                type="button"
                                onClick={toggleMessage}
                                className="text-blue-600 hover:text-blue-800 text-sm mb-2 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {modal.showMessage ? 'Hide Message' : 'Add Message to Player'}
                            </button>

                            {modal.showMessage && (
                                <div className="mt-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Message:
                                    </label>
                                    <textarea
                                        value={modal.message}
                                        onChange={(e) => setModal(prev => ({ ...prev, message: e.target.value }))}
                                        placeholder="Enter your message to the player..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center gap-4">
                            <button
                                className="btn-blue-glow w-full"
                                onClick={closeModal}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-blue-glow w-full"
                                onClick={modal.showMessage ? sendMessage : sendDefaultMessage}
                                disabled={loading}
                            >
                                {modal.showMessage ? `${modal.action.charAt(0).toUpperCase() + modal.action.slice(1)} & Send Message` : (modal.action.charAt(0).toUpperCase() + modal.action.slice(1))}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
