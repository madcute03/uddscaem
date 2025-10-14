import { Head, useForm, Link, router } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function RegisterEvent({ event }) {
    const { data, setData, post, errors, reset } = useForm({
        student_id: '',
        name: '',
        email: '',
        department: '',
        age: '',
        gdrive_link: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Simple email check before submission
        if (!data.email.endsWith('@cdd.edu.ph')) {
            alert('Email must end with @cdd.edu.ph');
            return;
        }

        post(route('eventregistrations.store', event.id), {
            onSuccess: () => {
                router.visit(route('events.show', event.id), {
                    only: ['event'],
                    data: { success: 'Registration successful!' },
                    onFinish: () => reset()
                });
            },
            onError: (errors) => {
                console.error('Registration error:', errors);
            }
        });
    };

    return (
        <PublicLayout>
            <Head title={`Register: ${event.title}`}>
                <style>
                    {`
                        select option {
                            background-color: #1e293b;
                            color: #f1f5f9;
                            padding: 8px;
                        }
                        select option:checked {
                            background-color: #334155;
                            font-weight: 500;
                        }
                    `}
                </style>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100 py-8 px-4">
                <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl shadow-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 md:p-8">
                    <h1 className="text-2xl font-semibold text-center mb-2">
                        Register for {event.title}
                    </h1>
                    <p className="text-lg text-slate-300 text-center mb-6">
                        Fill in your registration details below
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Student ID"
                            value={data.student_id}
                            onChange={(e) => setData('student_id', e.target.value)}
                            className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            pattern="[0-9\-]+"
                            title="Only numbers and dashes allowed, e.g., 2025-001"
                            required
                        />
                        {errors.student_id && (
                            <p className="text-red-400 text-sm mt-1">{errors.student_id}</p>
                        )}

                        <input
                            type="text"
                            placeholder="Full Name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            required
                        />

                        <input
                            type="email"
                            placeholder="Email (must end with @cdd.edu.ph)"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            pattern="^[a-zA-Z0-9._%+-]+@cdd\\.edu\\.ph$"
                            title="Email must be a valid @cdd.edu.ph address"
                            required
                        />
                        {errors.email && (
                            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                        )}

                        <div className="space-y-2">
                            <select
                                value={data.department.startsWith('Other: ') ? 'Other' : data.department}
                                onChange={(e) => {
                                    const value =
                                        e.target.value === 'Other' ? 'Other: ' : e.target.value;
                                    setData('department', value);
                                }}
                                className="w-full bg-white/10 border border-white/20 text-slate-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                required
                            >
                                <option value="">Select Department</option>
                                <option value="School of Information Technology">
                                    School of Information Technology
                                </option>
                                <option value="School of Engineering">
                                    School of Engineering
                                </option>
                                <option value="School of Teacher Education">
                                    School of Teacher Education
                                </option>
                                <option value="School of Business and Accountancy">
                                    School of Business and Accountancy
                                </option>
                                <option value="School of International Hospitality Management">
                                    School of International Hospitality Management
                                </option>
                                <option value="School of Humanities">
                                    School of Humanities
                                </option>
                                <option value="School of Health and Sciences">
                                    School of Health and Sciences
                                </option>
                                <option value="School of Criminology">
                                    School of Criminology
                                </option>
                                <option value="Other">Other (Please specify)</option>
                            </select>

                            {data.department.startsWith('Other: ') || data.department === 'Other' ? (
                                <input
                                    type="text"
                                    placeholder="Please specify department"
                                    value={
                                        data.department.startsWith('Other: ')
                                            ? data.department.substring(8)
                                            : ''
                                    }
                                    onChange={(e) =>
                                        setData('department', 'Other: ' + e.target.value)
                                    }
                                    className="w-full mt-2 bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    required
                                />
                            ) : null}
                        </div>

                        <input
                            type="number"
                            placeholder="Age"
                            value={data.age}
                            onChange={(e) => setData('age', e.target.value)}
                            className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            required
                        />

                        <div>
                            <label className="block mb-1 text-slate-200">
                                Google Drive link (Whiteform/PDS/Medical in one folder)
                            </label>
                            <input
                                type="url"
                                placeholder="https://drive.google.com/..."
                                value={data.gdrive_link}
                                onChange={(e) => setData('gdrive_link', e.target.value)}
                                className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                pattern="https?://.+"
                                title="Enter a valid link (include https://)"
                                required
                            />
                            {errors.gdrive_link && (
                                <p className="text-red-400 text-sm mt-1">{errors.gdrive_link}</p>
                            )}
                            <p className="text-xs text-slate-300 mt-1">
                                Make sure sharing is set to “Anyone with the link can view.”
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="w-full justify-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition"
                        >
                            Submit Registration
                        </button>
                    </form>

                    <Link
                        href={route('home')}
                        className="mt-6 inline-block text-blue-300 hover:text-blue-200 hover:underline"
                    >
                        ← Back to Events
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
}
