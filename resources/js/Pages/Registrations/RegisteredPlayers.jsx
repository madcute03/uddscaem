import { useState, useMemo } from "react";
import { Head, Link, router } from "@inertiajs/react";

export default function RegisteredPlayers({ players: initialPlayers, event }) {
    const [selectedImage, setSelectedImage] = useState(null);
    const [players, setPlayers] = useState(initialPlayers);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, playerId: null, playerEmail: null, action: null });
    const [query, setQuery] = useState("");

    // ✅ Search filter
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

    // ✅ Badge color by status
    const statusBadge = (status) => {
        const s = (status || "Pending").toLowerCase();
        const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
        if (s === "approved") return `${base} bg-green-500/20 text-green-300 border border-green-400/30`;
        if (s === "disapproved") return `${base} bg-red-500/20 text-red-300 border border-red-400/30`;
        return `${base} bg-yellow-500/20 text-yellow-200 border border-yellow-400/30`;
    };

    // ✅ Update player status
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
                    console.error("Failed to update status:", errors);
                    setPlayers((current) =>
                        current.map((p) =>
                            p.id === playerId
                                ? { ...p, status: p.previousStatus || "Pending" }
                                : p
                        )
                    );
                    alert("Failed to update status. Please try again.");
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
            const canUndo =
                player.statusUpdatedAt &&
                new Date() - new Date(player.statusUpdatedAt) < 10000;
            if (canUndo || !player.status || player.status === "Pending") {
                setModal({
                    isOpen: true,
                    playerId,
                    playerEmail,
                    action,
                    isUndo: canUndo,
                });
            }
        }
    };

    const closeModal = () => {
        setModal((prev) => ({ ...prev, isOpen: false }));
    };

    return (
        <>
            <Head title="Registered Players" />

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
                                Registered Players
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
                                            <th className="px-3 py-2 text-left text-sm font-semibold">
                                                Name
                                            </th>
                                            <th className="px-3 py-2 text-left text-sm font-semibold">
                                                Email
                                            </th>
                                            <th className="px-3 py-2 text-left text-sm font-semibold">
                                                Student ID
                                            </th>
                                            <th className="px-3 py-2 text-left text-sm font-semibold">
                                                Department
                                            </th>
                                            <th className="px-3 py-2 text-left text-sm font-semibold">
                                                Age
                                            </th>
                                            <th className="px-3 py-2 text-left text-sm font-semibold">
                                                Documents
                                            </th>
                                            <th className="px-3 py-2 text-center text-sm font-semibold">
                                                Status
                                            </th>
                                            <th className="px-3 py-2 text-center text-sm font-semibold">
                                                Actions
                                            </th>
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
                                                <td className="px-3 py-2 text-center space-x-2">
                                                    {(!player.status ||
                                                        player.status === "Pending") && (
                                                        <>
                                                            <button
                                                                className="btn-blue-glow mr-2"
                                                                onClick={() =>
                                                                    openModal(
                                                                        player.id,
                                                                        player.email,
                                                                        "approved"
                                                                    )
                                                                }
                                                                disabled={loading}
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                className="btn-blue-glow"
                                                                onClick={() =>
                                                                    openModal(
                                                                        player.id,
                                                                        player.email,
                                                                        "disapproved"
                                                                    )
                                                                }
                                                                disabled={loading}
                                                            >
                                                                Disapprove
                                                            </button>
                                                        </>
                                                    )}

                                                    {player.status &&
                                                        player.status !== "Pending" &&
                                                        player.statusUpdatedAt &&
                                                        new Date() -
                                                            new Date(
                                                                player.statusUpdatedAt
                                                            ) <
                                                            10000 && (
                                                            <button
                                                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors ml-2"
                                                                onClick={() => {
                                                                    setPlayers((current) =>
                                                                        current.map((p) =>
                                                                            p.id === player.id
                                                                                ? {
                                                                                      ...p,
                                                                                      status:
                                                                                          "Pending",
                                                                                  }
                                                                                : p
                                                                        )
                                                                    );
                                                                }}
                                                            >
                                                                Undo {player.status}
                                                            </button>
                                                        )}
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

            {/* ✅ Status Modal */}
            {modal.isOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow max-w-sm w-full text-center">
                        <h2 className="text-lg font-bold mb-4 capitalize">
                            {modal.action} Confirmation
                        </h2>
                        <p className="mb-4">
                            Are you sure you want to {modal.action} this player?
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
                                {modal.action.charAt(0).toUpperCase() +
                                    modal.action.slice(1)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
