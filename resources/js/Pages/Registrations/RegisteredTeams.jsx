import { useState, useMemo } from "react";
import { Head, Link, router } from "@inertiajs/react";

export default function RegisteredTeams({ registrations: initialRegistrations, event, teams_count }) {
    const [selectedImage, setSelectedImage] = useState(null);
    const [registrations, setRegistrations] = useState(initialRegistrations);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, playerId: null, playerEmail: null, action: null });
    const [query, setQuery] = useState("");

    const filteredRegistrations = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return registrations;
        return registrations.map(reg => ({
            ...reg,
            players: reg.players.filter(p =>
                (reg.team_name || "").toLowerCase().includes(q) ||
                p.name.toLowerCase().includes(q) ||
                (p.email || "").toLowerCase().includes(q) ||
                (p.student_id || "").toLowerCase().includes(q)
            )
        })).filter(reg => reg.players.length > 0 || (reg.team_name || "").toLowerCase().includes(q));
    }, [registrations, query]);

    const statusBadge = (status) => {
        const s = (status || 'Pending').toLowerCase();
        const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
        if (s === 'approved') return `${base} bg-green-500/20 text-green-300 border border-green-400/30`;
        if (s === 'disapproved') return `${base} bg-red-500/20 text-red-300 border border-red-400/30`;
        return `${base} bg-yellow-500/20 text-yellow-200 border border-yellow-400/30`;
    };

    const handleStatusChange = () => {
        if (!modal.playerId) return;

        const playerId = modal.playerId;
        const action = modal.action;

        // Store previous status for undo
        const updatedRegistrations = registrations.map(reg => {
            const playerIndex = reg.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) return reg;

            const newPlayers = [...reg.players];
            newPlayers[playerIndex] = {
                ...newPlayers[playerIndex],
                status: action,
                previousStatus: newPlayers[playerIndex].status || 'Pending',
                statusUpdatedAt: new Date().toISOString()
            };

            return { ...reg, players: newPlayers };
        });

        setRegistrations(updatedRegistrations);
        closeModal();

        // Auto-clear the previous status after 10 seconds
        const undoTimeout = setTimeout(() => {
            setRegistrations(currentRegistrations =>
                currentRegistrations.map(reg => ({
                    ...reg,
                    players: reg.players.map(p =>
                        p.id === playerId && p.status === action
                            ? (() => { const { previousStatus, statusUpdatedAt, ...rest } = p; return rest; })()
                            : p
                    )
                }))
            );
        }, 10000); // 10 seconds to undo

        // Make the API call
        router.post(route('player.updateStatus'), {
            player_id: playerId,
            status: action,
            email: modal.playerEmail
        }, {
            onError: (errors) => {
                console.error('Failed to update status:', errors);
                // Revert on error
                setRegistrations(currentRegistrations =>
                    currentRegistrations.map(reg => ({
                        ...reg,
                        players: reg.players.map(p =>
                            p.id === playerId
                                ? { ...p, status: p.previousStatus || 'Pending' }
                                : p
                        )
                    }))
                );
                alert('Failed to update status. Please try again.');
            },
            preserveScroll: true,
            preserveState: true
        });

        return () => clearTimeout(undoTimeout);
    };

    const openModal = (playerId, playerEmail, action) => {
        const player = registrations
            .flatMap(reg => reg.players)
            .find(p => p.id === playerId);

        if (player) {
            const canUndo = player.statusUpdatedAt && new Date() - new Date(player.statusUpdatedAt) < 10000;
            if (canUndo || !player.status || player.status === 'Pending') {
                setModal({
                    isOpen: true,
                    playerId,
                    playerEmail,
                    action,
                    isUndo: canUndo
                });
            }
        }
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        // Don't reset loading here to prevent flicker
    };

    return (
        <>
            <Head title="Registered Teams" />

            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100 py-10 px-2 sm:px-4 md:px-8">
                <Link href={route('dashboard')} className="relative
                                            text-[14px] font-extrabold font-inherit uppercase
                                            text-[#e1e1e1]
                                            cursor-pointer bg-none border-0
                                            transition-colors duration-400 [transition-timing-function:cubic-bezier(0.25,0.8,0.25,1)]
                                            hover:text-white focus:text-white
                                            after:content-[''] after:absolute after:bottom-[-2px] after:left-1/2
                                            after:w-0 after:h-[2px] after:bg-white
                                            after:transition-[width,left] after:duration-400 [after:transition-timing-function:cubic-bezier(0.25,0.8,0.25,1)]
                                            hover:after:w-full hover:after:left-0
                                            focus:after:w-full focus:after:left-0
                                            h-15 px-2 mt-10">
                    ← Back to dashboard
                </Link>
                <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-xl shadow-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Registered Players{event?.title ? ` — ${event.title}` : ''}</h1>
                            <p className="text-slate-300">{teams_count ?? registrations.length} player(s) registered</p>
                        </div>
                        <div className="w-full sm:w-80">
                            <label className="block text-sm mb-1 text-slate-300">Search name</label>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by name, email or student ID"
                                className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        {filteredRegistrations.length === 0 ? (
                            <p className="text-slate-300">No teams match your search.</p>
                        ) : (
                            <div className="space-y-8">
                                {filteredRegistrations.map((reg) => (
                                    <div key={reg.id} className="border border-white/15 rounded bg-white/5 p-4">
                                        

                                        <div className="overflow-x-auto rounded border border-white/10">
                                            <table className="w-full table-auto">
                                                <thead>
                                                    <tr className="bg-white/10 text-slate-200">
                                                        <th className="px-3 py-2 text-left text-sm font-semibold">#</th>
                                                        <th className="px-3 py-2 text-left text-sm font-semibold">Name</th>
                                                        <th className="px-3 py-2 text-left text-sm font-semibold">Email</th>
                                                        <th className="px-3 py-2 text-left text-sm font-semibold">Student ID</th>
                                                        <th className="px-3 py-2 text-left text-sm font-semibold">Department</th>
                                                        <th className="px-3 py-2 text-left text-sm font-semibold">Age</th>
                                                        <th className="px-3 py-2 text-left text-sm font-semibold">Documents Link</th>
                                                        <th className="px-3 py-2 text-center text-sm font-semibold">Status</th>
                                                        <th className="px-3 py-2 text-center text-sm font-semibold">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reg.players.map((player, pIndex) => (
                                                        <tr key={player.id} className="odd:bg-white/0 even:bg-white/5">
                                                            <td className="px-3 py-2 align-middle text-center">{pIndex + 1}</td>
                                                            <td className="px-3 py-2 align-middle">{player.name}</td>
                                                            <td className="px-3 py-2 align-middle">{player.email}</td>
                                                            <td className="px-3 py-2 align-middle">{player.student_id}</td>
                                                            <td className="px-3 py-2 align-middle">{player.department}</td>
                                                            <td className="px-3 py-2 align-middle">{player.age}</td>
                                                            <td className="px-3 py-2 align-middle text-center">
                                                                {(() => {
                                                                    const value = player.player_image || player.whiteform_image;
                                                                    if (!value) return null;
                                                                    return /^https?:\/\//.test(value) ? (
                                                                        <a
                                                                            href={value}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-blue-300 hover:underline"
                                                                        >
                                                                            Open link
                                                                        </a>
                                                                    ) : (
                                                                        <img
                                                                            src={`data:image/*;base64,${value}`}
                                                                            alt="Document"
                                                                            className="h-16 w-16 object-cover rounded cursor-pointer hover:scale-110 transition"
                                                                            onClick={() => setSelectedImage(`data:image/jpeg;base64,${value}`)}
                                                                        />
                                                                    );
                                                                })()}
                                                            </td>
                                                            <td className="px-3 py-2 align-middle text-center">
                                                                <span className={statusBadge(player.status)}>{player.status || 'Pending'}</span>
                                                            </td>
                                                            <td className="px-3 py-2 align-middle text-center space-x-2">
                                                                {/* Always show Approve/Disapprove buttons for Pending status */}
                                                                {(!player.status || player.status === 'Pending') && (
                                                                    <>
                                                                        <button
                                                                            className="btn-blue-glow disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200 mr-2"
                                                                            onClick={() => openModal(player.id, player.email, 'approved')}
                                                                            disabled={loading}
                                                                        >
                                                                            {loading && modal.playerId === player.id && modal.action === 'approved' ? 'Processing...' : 'Approve'}
                                                                        </button>
                                                                        <button
                                                                            className="btn-blue-glow disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
                                                                            onClick={() => openModal(player.id, player.email, 'disapproved')}
                                                                            disabled={loading}
                                                                        >
                                                                            {loading && modal.playerId === player.id && modal.action === 'disapproved' ? 'Processing...' : 'Disapprove'}
                                                                        </button>
                                                                    </>
                                                                )}

                                                                {/* Show Undo button for 10 seconds after status change */}
                                                                {player.status && player.status !== 'Pending' && player.statusUpdatedAt && new Date() - new Date(player.statusUpdatedAt) < 10000 && (
                                                                    <button
                                                                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors ml-2"
                                                                        onClick={() => {
                                                                            // Undo the status change
                                                                            setRegistrations(currentRegistrations =>
                                                                                currentRegistrations.map(reg => ({
                                                                                    ...reg,
                                                                                    players: reg.players.map(p =>
                                                                                        p.id === player.id
                                                                                            ? { ...p, status: 'Pending' }
                                                                                            : p
                                                                                    )
                                                                                }))
                                                                            );
                                                                        }}
                                                                    >
                                                                        Undo {player.status}
                                                                    </button>
                                                                )}

                                                                {/* Show status text if not in undo period */}
                                                                {player.status && player.status !== 'Pending' && (!player.statusUpdatedAt || new Date() - new Date(player.statusUpdatedAt) >= 10000) && (
                                                                    <span className="text-sm text-gray-400">{player.status}</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>


                </div>
            </div>

            {/* Image Preview Modal */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="relative">
                        <img
                            src={selectedImage}
                            alt="Preview"
                            className="max-h-[90vh] max-w-[90vw] rounded shadow-lg"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                            <button
                                className="btn-blue-glow"
                                onClick={() => setSelectedImage(null)}
                            >
                                ✕ Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Confirmation Modal */}
            {modal.isOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow max-w-sm w-full text-center">
                        <h2 className="text-lg font-bold mb-4">
                            {modal.isUndo ? 'Undo ' : ''}{modal.action.charAt(0).toUpperCase() + modal.action.slice(1)}
                        </h2>
                        <p className="mb-4">
                            {modal.isUndo
                                ? `Are you sure you want to undo the ${modal.action} status?`
                                : `Are you sure you want to ${modal.action} this player?`}
                        </p>
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
                                onClick={handleStatusChange}
                                disabled={loading}
                            >
                                {modal.action.charAt(0).toUpperCase() + modal.action.slice(1)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
