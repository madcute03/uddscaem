import { Head, useForm } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';


export default function PublicComplaintForm({ events }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        department: '',
        complaint_letter: null,
        event_id: ''
    });

    const departments = [
        'School of Information Technology',
        'School of Engineering',
        'School of Teacher Education',
        'School of Business and Accountancy',
        'School of International Hospitality Management',
        'School of Humanities',
        'School of Health and Sciences',
        'School of Criminology',
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate file is selected
        if (!data.complaint_letter) {
            alert('Please upload a protest document');
            return;
        }
        
        post(route('complaints.store'), {
            forceFormData: true,
            onSuccess: () => {
                alert('Thank you for your protest. We will review it shortly.');
                reset();
            },
            onError: (errors) => {
                console.error('Submission errors:', errors);
                alert('Failed to submit protest. Please check all fields and try again.');
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
                        <div className="space-y-6">
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
                                <select
                                    value={data.department}
                                    onChange={e => setData('department', e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>
                                            {dept}
                                        </option>
                                    ))}
                                </select>
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
                            <label className="block text-sm font-medium mb-2">Upload Handwritten Protest</label>
                            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                data.complaint_letter ? 'border-green-500 bg-green-500/10' : 'border-slate-700 hover:border-blue-500'
                            }`}>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={e => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setData('complaint_letter', file);
                                        }
                                    }}
                                    className="hidden"
                                    id="complaint_file"
                                    required
                                />
                                <label htmlFor="complaint_file" className="cursor-pointer block">
                                    {data.complaint_letter ? (
                                        <>
                                            <svg className="w-12 h-12 mx-auto mb-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-green-300 mb-1 font-medium">
                                                {data.complaint_letter.name}
                                            </p>
                                            <p className="text-slate-400 text-sm">
                                                {(data.complaint_letter.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                            <p className="text-blue-400 text-sm mt-2">Click to change file</p>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <p className="text-slate-300 mb-1">
                                                Click to upload
                                            </p>
                                            <p className="text-slate-500 text-sm">PDF, JPG, JPEG or PNG (Max 10MB)</p>
                                        </>
                                    )}
                                </label>
                            </div>
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
