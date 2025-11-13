import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

export default function EditAthlete({ auth, athlete }) {
    // Format birthdate to yyyy-MM-dd for HTML5 date input
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const { data, setData, put, processing, errors } = useForm({
        student_id: athlete.student_id || '',
        name: athlete.name || '',
        email: athlete.email || '',
        contact_number: athlete.contact_number || '',
        birthdate: formatDate(athlete.birthdate),
        department: athlete.department || '',
        course: athlete.course || '',
        year_level: athlete.year_level || '',
        age: athlete.age || '',
        enrolled_units: athlete.enrolled_units || '',
        scholarship_status: athlete.scholarship_status || '',
        sport_team: athlete.sport_team || '',
        team_name: athlete.team_name || '',
        gdrive_link: athlete.gdrive_link || '',
        status: athlete.status || 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('mis.athletes.update', athlete.id));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Edit Athlete" />
            <div className="py-12 px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <Link href={route('mis.dashboard')} className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4">
                            <ArrowLeftIcon className="w-5 h-5" />Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <PencilSquareIcon className="w-10 h-10 text-blue-400" />Edit Athlete Profile
                        </h1>
                    </div>
                    <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-slate-300 mb-2">Student ID *</label>
                                <input type="text" value={data.student_id} onChange={(e) => setData('student_id', e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg" required />
                                {errors.student_id && <p className="text-red-400 text-sm">{errors.student_id}</p>}
                            </div>
                            <div><label className="block text-slate-300 mb-2">Name *</label>
                                <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg" required />
                            </div>
                            <div><label className="block text-slate-300 mb-2">Email *</label>
                                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg" required />
                            </div>
                            <div><label className="block text-slate-300 mb-2">Contact</label>
                                <input type="text" value={data.contact_number} onChange={(e) => setData('contact_number', e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg" />
                            </div>
                            <div><label className="block text-slate-300 mb-2">Birthdate *</label>
                                <input type="date" value={data.birthdate} onChange={(e) => setData('birthdate', e.target.value)} className="w-full px-4 py-2 bg-slate-800/60 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-colors [color-scheme:dark]" required />
                            </div>
                            <div><label className="block text-slate-300 mb-2">Department *</label>
                                <input type="text" value={data.department} onChange={(e) => setData('department', e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg" required />
                            </div>
                            <div><label className="block text-slate-300 mb-2">Course</label>
                                <input type="text" value={data.course} onChange={(e) => setData('course', e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg" />
                            </div>
                            <div><label className="block text-slate-300 mb-2">Year Level</label>
                                <select value={data.year_level} onChange={(e) => setData('year_level', e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg">
                                    <option value="">Select</option><option value="1st Year">1st Year</option><option value="2nd Year">2nd Year</option><option value="3rd Year">3rd Year</option><option value="4th Year">4th Year</option>
                                </select>
                            </div>
                            <div><label className="block text-slate-300 mb-2">Age *</label>
                                <input type="number" value={data.age} onChange={(e) => setData('age', e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg" required />
                            </div>
                            <div><label className="block text-slate-300 mb-2">Enrolled Units</label>
                                <input type="number" value={data.enrolled_units} onChange={(e) => setData('enrolled_units', e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg" />
                            </div>
                            <div><label className="block text-slate-300 mb-2">Scholarship</label>
                                <select value={data.scholarship_status} onChange={(e) => setData('scholarship_status', e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg">
                                    <option value="">Select</option><option value="25%">25%</option><option value="50%">50%</option><option value="75%">75%</option><option value="100%">100%</option>
                                </select>
                            </div>
                            <div><label className="block text-slate-300 mb-2">Sport/Team</label>
                                <input type="text" value={data.sport_team} onChange={(e) => setData('sport_team', e.target.value)} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-slate-300 mb-2">Status *</label>
                                <select 
                                    value={data.status} 
                                    onChange={(e) => setData('status', e.target.value)} 
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="graduated">Graduated</option>
                                </select>
                                {errors.status && <p className="text-red-400 text-sm mt-1">{errors.status}</p>}
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 pt-6 border-t border-slate-700">
                            <Link href={route('mis.dashboard')} className="w-[120px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#C90808] to-[#C90808]/0 
                                                               bg-[#C90808]/20 flex items-center justify-center 
                                                               hover:bg-[#C90808]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#C90808]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]">Cancel</Link>
                            <button type="submit" disabled={processing} className="w-[121px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]">{processing ? 'Updating...' : 'Update'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
