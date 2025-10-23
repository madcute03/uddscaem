import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { useState } from 'react';

export default function BorrowersIndex() {
    const { stats = {}, items = [], requests = [], logs = [] } = usePage().props;
    const { data, setData, post, reset, processing } = useForm({ name: '', quantity: 0 });
    const [actionModal, setActionModal] = useState({ open: false, action: null, request: null, send_mail: true, note: '' });
    const [editingItems, setEditingItems] = useState(new Set());
    const [deletingItems, setDeletingItems] = useState(new Set());
    const [deletingRequests, setDeletingRequests] = useState(new Set());
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);

    const openAction = (action, request) => setActionModal({ open: true, action, request, send_mail: true, note: '' });
    const closeAction = () => setActionModal((m) => ({ ...m, open: false }));

    const handleEditItem = (itemId) => {
        const item = items.find(it => it.id === itemId);
        if (item) {
            setData({ name: item.name, quantity: item.quantity });
            setEditingItemId(itemId);
        }
    };

    const handleUpdateItem = (itemId) => {
        if (!data.name.trim()) return;

        setEditingItems(prev => new Set([...prev, itemId]));
        router.put(route('admin.items.update', { item: itemId }), {
            name: data.name,
            quantity: data.quantity || 0
        }, {
            onFinish: () => {
                setEditingItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(itemId);
                    return newSet;
                });
                reset();
                setEditingItemId(null);
            },
            preserveState: false,
            preserveScroll: false,
        });
    };

    const handleCancelEdit = () => {
        reset();
        setEditingItemId(null);
    };

    const handleDeleteRequest = (requestId) => {
        if (confirm('Are you sure you want to delete this borrow request? This action cannot be undone.')) {
            setDeletingRequests(prev => new Set([...prev, requestId]));
            router.delete(route('admin.borrow-requests.delete', { borrowRequest: requestId }), {
                onFinish: () => {
                    setDeletingRequests(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(requestId);
                        return newSet;
                    });
                },
                preserveState: false,
                preserveScroll: false,
            });
        }
    };

    const handleDeleteItem = (itemId) => {
        if (confirm('Are you sure you want to delete this item?')) {
            setDeletingItems(prev => new Set([...prev, itemId]));
            router.delete(route('admin.items.destroy', { item: itemId }), {
                onFinish: () => {
                    setDeletingItems(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(itemId);
                        return newSet;
                    });
                },
                preserveState: false,
                preserveScroll: false,
            });
        }
    };

    const [purposeModal, setPurposeModal] = useState({ open: false, title: '', content: '' });

    const [emailModal, setEmailModal] = useState({ open: false, email: '', message: '' });

    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, request: null });

    const openPurposeModal = (title, content) => {
        setPurposeModal({ open: true, title, content });
    };

    const closePurposeModal = () => {
        setPurposeModal({ open: false, title: '', content: '' });
    };

    const openEmailModal = (email) => {
        setEmailModal({ open: true, email, message: '' });
    };

    const closeEmailModal = () => {
        setEmailModal({ open: false, email: '', message: '' });
    };

    const sendEmailMessage = () => {
        if (!emailModal.message.trim()) return;

        // TODO: Implement email sending functionality
        router.post(route('admin.send-message'), {
            email: emailModal.email,
            message: emailModal.message,
        }, {
            onFinish: () => {
                closeEmailModal();
            },
            preserveState: false,
            preserveScroll: false,
        });
    };

    const submitAction = () => {
        if (!actionModal.request || isSubmittingAction) return;

        // Special handling for deny action
        if (actionModal.action === 'deny') {
            setDeleteConfirmModal({ open: true, request: actionModal.request });
            closeAction();
            return;
        }

        setIsSubmittingAction(true);
        const routeName = actionModal.action === 'approve'
            ? 'admin.borrow-requests.approve'
            : actionModal.action === 'deny'
            ? 'admin.borrow-requests.deny'
            : 'admin.borrow-requests.returned';
        router.post(route(routeName, { borrowRequest: actionModal.request.id }), {
            send_mail: actionModal.send_mail,
            note: actionModal.note,
        }, {
            onFinish: () => {
                closeAction();
                setIsSubmittingAction(false);
            },
            preserveState: false,
            preserveScroll: false,
        });
    };

    const handleDeleteAfterDeny = (shouldDelete) => {
        if (shouldDelete && deleteConfirmModal.request) {
            // Delete the request
            handleDeleteRequest(deleteConfirmModal.request.id);
        } else {
            // Just deny the request
            setIsSubmittingAction(true);
            router.post(route('admin.borrow-requests.deny', { borrowRequest: deleteConfirmModal.request.id }), {
                send_mail: actionModal.send_mail,
                note: actionModal.note,
            }, {
                onFinish: () => {
                    setIsSubmittingAction(false);
                },
                preserveState: false,
                preserveScroll: false,
            });
        }
        setDeleteConfirmModal({ open: false, request: null });
    };

    return (
        <AuthenticatedLayout header={<h2>Borrowers Management</h2>}>
            <Head title="Borrowers Management" />
            <div className="max-w-full space-y-8 align-content-start">
                <section>
                    <h3 className="text-xl font-semibold mb-3">Inventory Dashboard</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-6">
                            <div className="text-sm text-slate-400">Total Items</div>
                            <div className="text-3xl font-bold">{stats.total_items ?? 0}</div>
                        </div>
                        <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-6">
                            <div className="text-sm text-slate-400">Borrowed Items</div>
                            <div className="text-3xl font-bold">{stats.borrowed_items ?? 0}</div>
                        </div>
                        <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-6">
                            <div className="text-sm text-slate-400">Pending Requests</div>
                            <div className="text-3xl font-bold">{stats.pending_requests ?? 0}</div>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-xl font-semibold mb-3">Inventory Management</h3>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/30 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900/60">
                                <tr className="text-left">
                                    <th className="px-4 py-2">Item ID</th>
                                    <th className="px-4 py-2">Item Name</th>
                                    <th className="px-4 py-2">Quantity</th>
                                    <th className="px-4 py-2">Available</th>
                                    <th className="px-4 py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it) => (
                                    <tr key={it.id} className="border-t border-slate-800">
                                        <td className="px-4 py-2">{it.id}</td>
                                        <td className="px-4 py-2">{it.name}</td>
                                        <td className="px-4 py-2">{it.quantity}</td>
                                        <td className="px-4 py-2">{it.available}</td>
                                        <td className="px-4 py-2 space-x-2">
                                            <button
                                                onClick={() => handleEditItem(it.id)}
                                                disabled={editingItems.has(it.id)}
                                                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {editingItems.has(it.id) ? 'Updating...' : 'Edit'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(it.id)}
                                                disabled={deletingItems.has(it.id)}
                                                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {deletingItems.has(it.id) ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-3 space-y-2">
                        {editingItemId && (
                            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 mb-3">
                                <div className="text-sm text-blue-300">
                                    Editing Item #{editingItemId} - {data.name}
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                value={data.name}
                                onChange={(e)=>setData('name', e.target.value)}
                                placeholder="Item name"
                                className="px-3 py-2 rounded bg-slate-900 border border-slate-700"
                            />
                            <input
                                type="number"
                                value={data.quantity}
                                onChange={(e)=>setData('quantity', e.target.value)}
                                placeholder="Qty"
                                className="px-3 py-2 rounded bg-slate-900 border border-slate-700 w-24"
                            />
                            {editingItemId ? (
                                <>
                                    <button
                                        disabled={processing || editingItems.has(editingItemId)}
                                        onClick={() => handleUpdateItem(editingItemId)}
                                        className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
                                    >
                                        {editingItems.has(editingItemId) ? 'Updating...' : 'Update Item'}
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    disabled={processing}
                                    onClick={() => post(route('admin.items.store'), { onSuccess: ()=> reset() })}
                                    className="w-[141px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                >
                                    + Add New Item
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-xl font-semibold mb-3">Borrow Requests</h3>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/30 overflow-hidden">
                        <table className="w-full text-sm">
                                <thead className="bg-slate-800/60">
                                    <tr className="text-left border-b border-slate-600">
                                        <th className="px-3 py-3 font-medium text-slate-300">Student ID</th>
                                        <th className="px-3 py-3 font-medium text-slate-300">Student Name</th>
                                        <th className="px-3 py-3 font-medium text-slate-300">Email</th>
                                        <th className="px-3 py-3 font-medium text-slate-300">Item</th>
                                        <th className="px-3 py-3 font-medium text-slate-300">Qty</th>
                                        <th className="px-3 py-3 font-medium text-slate-300">Purpose</th>
                                        <th className="px-3 py-3 font-medium text-slate-300">Contact</th>
                                        <th className="px-3 py-3 font-medium text-slate-300">Date</th>
                                        <th className="px-3 py-3 font-medium text-slate-300">Status</th>
                                        <th className="px-3 py-3 font-medium text-slate-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((r) => (
                                        <tr key={r.id} className="border-t border-slate-700 hover:bg-slate-800/20">
                                            <td className="px-3 py-2">{r.student_id}</td>
                                            <td className="px-3 py-2">{r.student_name}</td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    {r.email}
                                                    {r.status === 'approved' && (
                                                        <button
                                                            onClick={() => openEmailModal(r.email)}
                                                            className="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors border border-blue-500"
                                                            title="Send message to student"
                                                        >
                                                            Message
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">{r.item?.name}</td>
                                            <td className="px-3 py-2">{r.quantity || 1}</td>
                                            <td className="px-3 py-2">
                                                {r.purpose ? (
                                                    <button
                                                        onClick={() => openPurposeModal(`Purpose - Request #${r.id}`, r.purpose)}
                                                        className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors border border-blue-500"
                                                        title="Click to view purpose"
                                                    >
                                                        View
                                                    </button>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-3 py-2">{r.contact_number || '—'}</td>
                                            <td className="px-3 py-2">{new Date(r.requested_at ?? r.created_at).toLocaleDateString()}</td>
                                            <td className="px-3 py-2">
                                                <span className="capitalize whitespace-nowrap" title={r.status}>{r.status}</span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={() => openAction('approve', r)}
                                                        disabled={deletingRequests.has(r.id)}
                                                        className="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                                                        title="Approve Request"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => openAction('deny', r)}
                                                        disabled={deletingRequests.has(r.id)}
                                                        className="px-2 py-1 text-xs rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                                                        title="Deny Request"
                                                    >
                                                        Deny
                                                    </button>
                                                    {r.status === 'approved' && (
                                                        <button
                                                            onClick={() => openAction('returned', r)}
                                                            disabled={deletingRequests.has(r.id)}
                                                            className="px-2 py-1 text-xs rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                                                            title="Mark as Returned"
                                                        >
                                                            Return
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteRequest(r.id)}
                                                        disabled={deletingRequests.has(r.id)}
                                                        className="px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                                                        title="Delete Request"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h3 className="text-xl font-semibold mb-3">Borrowing Logs</h3>
                    <div className="w-[1200px] rounded-lg border border-slate-700 bg-slate-900/30 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900/60">
                                <tr className="text-left">
                                    <th className="px-4 py-2">Student ID</th>
                                    <th className="px-4 py-2">Student Name</th>
                                    <th className="px-4 py-2">Email</th>
                                    <th className="px-4 py-2">Item</th>
                                    <th className="px-4 py-2">Qty</th>
                                    <th className="px-4 py-2">Purpose</th>
                                    <th className="px-4 py-2">Contact</th>
                                    <th className="px-4 py-2">Borrowed On</th>
                                    <th className="px-4 py-2">Returned On</th>
                                    <th className="px-4 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((r) => (
                                    <tr key={r.id} className="border-t border-slate-800">
                                        <td className="px-4 py-2">{r.student_id}</td>
                                        <td className="px-4 py-2">{r.student_name}</td>
                                        <td className="px-4 py-2">{r.email}</td>
                                        <td className="px-4 py-2">{r.item?.name}</td>
                                        <td className="px-4 py-2">{r.quantity || 1}</td>
                                        <td className="px-4 py-2 max-w-xs">
                                            {r.purpose ? (
                                                <button
                                                    onClick={() => openPurposeModal(`Purpose - Log #${r.id}`, r.purpose)}
                                                    className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                                                    title="Click to view purpose"
                                                >
                                                    View
                                                </button>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-2">{r.contact_number || '—'}</td>
                                        <td className="px-4 py-2">{r.approved_at ? new Date(r.approved_at).toLocaleDateString() : '—'}</td>
                                        <td className="px-4 py-2">{r.returned_at ? new Date(r.returned_at).toLocaleDateString() : '—'}</td>
                                        <td className="px-4 py-2">
                                            <span className="whitespace-nowrap" title={r.returned_at ? 'Returned' : (r.status === 'approved' ? 'Borrowed' : r.status)}>
                                                {r.returned_at ? 'Returned' : (r.status === 'approved' ? 'Borrowed' : r.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
            <Modal show={actionModal.open} onClose={closeAction} maxWidth="md">
                <div className="p-6 bg-slate-900 text-slate-100">
                    <h3 className="text-lg font-semibold mb-2 capitalize">
                        {actionModal.action === 'returned' ? 'Mark as Returned' : `${actionModal.action || 'Process'} Request`}
                    </h3>
                    {actionModal.request && (
                        <p className="mb-4 text-sm text-slate-300">For request #{actionModal.request.id} — {actionModal.request.student_name} ({actionModal.request.email}) — Item: {actionModal.request.item?.name}</p>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                        <input id="send_mail" type="checkbox" checked={actionModal.send_mail} onChange={(e)=>setActionModal((m)=>({...m, send_mail: e.target.checked}))} />
                        <label htmlFor="send_mail" className="text-sm">Send email notification</label>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm mb-1">Optional note</label>
                        <textarea value={actionModal.note} onChange={(e)=>setActionModal((m)=>({...m, note: e.target.value}))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700" rows={3} placeholder="Add a note to include in the email..." />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={closeAction} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600">Cancel</button>
                        <button onClick={submitAction} disabled={isSubmittingAction} className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmittingAction ? 'Processing...' : `Confirm ${actionModal.action ? actionModal.action.charAt(0).toUpperCase() + actionModal.action.slice(1) : 'Action'}`}
                        </button>
                    </div>
                </div>
            </Modal>
            <Modal show={deleteConfirmModal.open} onClose={() => setDeleteConfirmModal({ open: false, request: null })} maxWidth="sm">
                <div className="p-6 bg-slate-900 text-slate-100">
                    <h3 className="text-lg font-semibold mb-4">Delete Request?</h3>
                    {deleteConfirmModal.request && (
                        <div className="mb-4">
                            <p className="text-sm text-slate-300 mb-4">
                                You denied the request for <strong>{deleteConfirmModal.request.student_name}</strong> ({deleteConfirmModal.request.email}).
                            </p>
                            <p className="text-sm text-slate-400">
                                Do you want to delete this request permanently, or just keep it as denied?
                            </p>
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => handleDeleteAfterDeny(false)}
                            className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600"
                        >
                            Keep as Denied
                        </button>
                        <button
                            onClick={() => handleDeleteAfterDeny(true)}
                            className="px-4 py-2 rounded bg-red-600 hover:bg-red-500"
                        >
                            Delete Request
                        </button>
                    </div>
                </div>
            </Modal>
            <Modal show={purposeModal.open} onClose={closePurposeModal} maxWidth="lg">
                <div className="p-6 bg-slate-900 text-slate-100">
                    <h3 className="text-lg font-semibold mb-4">{purposeModal.title}</h3>
                    <div className="mb-4">
                        <div className="bg-slate-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
                                {purposeModal.content}
                            </pre>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={closePurposeModal}
                            className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
            <Modal show={emailModal.open} onClose={closeEmailModal} maxWidth="md">
                <div className="p-6 bg-slate-900 text-slate-100">
                    <h3 className="text-lg font-semibold mb-2">Send Message</h3>
                    <p className="mb-4 text-sm text-slate-300">
                        Send a message to: <strong>{emailModal.email}</strong>
                    </p>
                    <div className="mb-4">
                        <label className="block text-sm mb-1">Message</label>
                        <textarea
                            value={emailModal.message}
                            onChange={(e) => setEmailModal((m) => ({ ...m, message: e.target.value }))}
                            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700"
                            rows={4}
                            placeholder="Enter your message here..."
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={closeEmailModal}
                            className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={sendEmailMessage}
                            disabled={!emailModal.message.trim()}
                            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Send Message
                        </button>
                    </div>
                </div>
            </Modal>

        </AuthenticatedLayout>
    );
}
