import PublicLayout from '@/Layouts/PublicLayout';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/Components/Modal';

export default function BorrowIndex() {
    const { items = [], userRequests = [] } = usePage().props;
    const [searchData, setSearchData] = useState({ student_id: '', email: '' });
    const [isSearching, setIsSearching] = useState(false);
    const [showUserRequests, setShowUserRequests] = useState(false);
    const [resendModal, setResendModal] = useState({ open: false, request: null });
    const [isResending, setIsResending] = useState(false);
    const [resendForm, setResendForm] = useState({ student_name: '', student_id: '', email: '', contact_number: '' });

    const handleResendRequest = (request) => {
        setResendForm({
            student_name: request.student_name,
            student_id: request.student_id,
            email: request.email,
            contact_number: request.contact_number || '',
        });
        setResendModal({ open: true, request });
    };

    const closeResendModal = () => {
        setResendModal({ open: false, request: null });
        setResendForm({ student_name: '', student_id: '', email: '', contact_number: '' });
    };

    const handleResendFormChange = (field, value) => {
        setResendForm(prev => ({ ...prev, [field]: value }));
    };

    const submitResendRequest = () => {
        if (!resendModal.request || isResending) return;

        // Validate required fields
        if (!resendForm.student_name.trim() || !resendForm.student_id.trim() || !resendForm.email.trim()) {
            alert('Please fill in all fields');
            return;
        }

        setIsResending(true);
        router.post(route('borrow.store'), {
            student_name: resendForm.student_name.trim(),
            student_id: resendForm.student_id.trim(),
            email: resendForm.email.trim(),
            item_id: resendModal.request.item?.id,
            contact_number: resendForm.contact_number.trim(),
        }, {
            onFinish: () => {
                closeResendModal();
                setIsResending(false);
            },
            preserveState: false,
            preserveScroll: false,
        });
    };

    const handleSearch = () => {
        if (!searchData.student_id.trim() && !searchData.email.trim()) {
            alert('Please enter either Student ID or Email address');
            return;
        }

        setIsSearching(true);
        setShowUserRequests(true);
        router.get(route('borrow.requests.search'), {
            student_id: searchData.student_id.trim(),
            email: searchData.email.trim(),
        }, {
            onFinish: () => setIsSearching(false),
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleInputChange = (field, value) => {
        setSearchData(prev => ({ ...prev, [field]: value }));
    };
    return (
        <PublicLayout>
            <Head title="Borrow" />
            <div className="max-w-3xl mx-auto px-4 py-10">
                <h1 className="text-2xl font-bold mb-6">Available Items</h1>

                {/* Search Form */}
                <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4 text-slate-200">Find Your Requests</h2>
                    <p className="text-sm text-slate-400 mb-4">Enter your Student ID or Email address to view your borrow requests</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Student ID</label>
                            <input
                                type="text"
                                value={searchData.student_id}
                                onChange={(e) => handleInputChange('student_id', e.target.value)}
                                placeholder="Enter your student ID"
                                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={searchData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="Enter your email address"
                                className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
                        >
                            {isSearching ? 'Searching...' : 'Find My Requests'}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-900/60">
                            <tr className="text-left">
                                <th className="px-4 py-2">Item</th>
                                <th className="px-4 py-2">Available</th>
                                <th className="px-4 py-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it) => (
                                <tr key={it.id} className="border-t border-slate-800">
                                    <td className="px-4 py-2">{it.name}</td>
                                    <td className="px-4 py-2">{it.available}</td>
                                    <td className="px-4 py-2">
                                        <Link href={route('borrow.request', { item_id: it.id })} className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white">Request</Link>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td className="px-4 py-4 text-slate-400" colSpan={3}>No items available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* User Requests Section */}
                {showUserRequests && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold mb-4">Your Borrow Requests</h2>
                        <div className="overflow-x-auto rounded-lg border border-slate-800">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-900/60">
                                    <tr className="text-left">
                                        <th className="px-4 py-2">Request ID</th>
                                        <th className="px-4 py-2">Item</th>
                                        <th className="px-4 py-2">Status</th>
                                        <th className="px-4 py-2">Requested Date</th>
                                        <th className="px-4 py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userRequests.length > 0 ? (
                                        userRequests.map((request) => (
                                            <tr key={request.id} className="border-t border-slate-800">
                                                <td className="px-4 py-2">{request.id}</td>
                                                <td className="px-4 py-2">{request.item?.name || 'Unknown Item'}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        request.status === 'approved'
                                                            ? 'bg-emerald-900/50 text-emerald-300'
                                                            : request.status === 'denied'
                                                            ? 'bg-rose-900/50 text-rose-300'
                                                            : 'bg-amber-900/50 text-amber-300'
                                                    }`}>
                                                        {request.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {new Date(request.requested_at || request.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {request.status === 'pending' && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-400">Waiting for approval</span>
                                                            <button
                                                                onClick={() => handleResendRequest(request)}
                                                                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs"
                                                            >
                                                                Resend Request
                                                            </button>
                                                        </div>
                                                    )}
                                                    {request.status === 'approved' && (
                                                        <span className="text-emerald-400">Approved - Check with admin</span>
                                                    )}
                                                    {request.status === 'denied' && (
                                                        <span className="text-rose-400">Request denied</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className="px-4 py-4 text-slate-400 text-center" colSpan={5}>
                                                No requests found for the provided Student ID or Email address.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            <Modal show={resendModal.open} onClose={closeResendModal} maxWidth="md">
                <div className="p-6 bg-slate-900 text-slate-100">
                    <h3 className="text-lg font-semibold mb-4">Resend Borrow Request</h3>
                    {resendModal.request && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-300 mb-4">
                                Review and confirm your request details below. This will create a new request with the same information.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Student Name</label>
                                    <input
                                        type="text"
                                        value={resendForm.student_name}
                                        onChange={(e) => handleResendFormChange('student_name', e.target.value)}
                                        className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter student name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Student ID</label>
                                    <input
                                        type="number"
                                        value={resendForm.student_id}
                                        onChange={(e) => handleResendFormChange('student_id', e.target.value)}
                                        className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter student ID"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={resendForm.email}
                                    onChange={(e) => handleResendFormChange('email', e.target.value)}
                                    className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter email address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Contact Number</label>
                                <input
                                    type="number"
                                    value={resendForm.contact_number || ''}
                                    onChange={(e) => handleResendFormChange('contact_number', e.target.value)}
                                    className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter contact number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Item</label>
                                <input
                                    type="text"
                                    value={resendModal.request.item?.name || 'Unknown Item'}
                                    readOnly
                                    className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-100 opacity-75"
                                />
                                <p className="text-xs text-slate-400 mt-1">Item cannot be changed when resending a request</p>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    onClick={closeResendModal}
                                    className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitResendRequest}
                                    disabled={isResending}
                                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isResending ? 'Resending...' : 'Confirm Resend'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </PublicLayout>
    );
}


