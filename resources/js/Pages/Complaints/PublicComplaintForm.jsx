import { Head, useForm } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';


export default function PublicComplaintForm({ events }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        department: '',
        complaint_letter: '',
        event_id: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('complaints.store'), {
            onSuccess: () => {
                alert('Thank you for your complaint. We will review it shortly.');
                reset();
            }
        });
    };

    return (
        <PublicLayout>
            <Head title="File a Complaint" />
            
            <div className="max-w-2xl mx-auto">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-xl p-6">
                    <h1 className="text-2xl font-bold mb-6">File a Protest</h1>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Department</label>
                                <input
                                    type="text"
                                    value={data.department}
                                    onChange={e => setData('department', e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                {errors.department && <p className="text-red-400 text-sm mt-1">{errors.department}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Related Event</label>
                                <select
                                    value={data.event_id}
                                    onChange={e => setData('event_id', e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Category</option>
                                    {events.map(event => (
                                        <option key={event.id} value={event.id}>
                                            {event.title}
                                        </option>
                                    ))}
                                </select>
                                {errors.event_id && <p className="text-red-400 text-sm mt-1">{errors.event_id}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Protest Details</label>
                            <textarea
                                value={data.complaint_letter}
                                onChange={e => setData('complaint_letter', e.target.value)}
                                rows={5}
                                className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Please describe your complaint in detail..."
                                required
                            />
                            {errors.complaint_letter && <p className="text-red-400 text-sm mt-1">{errors.complaint_letter}</p>}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Submitting...' : 'Submit Protest'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
