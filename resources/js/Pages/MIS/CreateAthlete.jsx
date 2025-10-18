import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeftIcon, UserPlusIcon } from '@heroicons/react/24/outline';

export default function CreateAthlete({ auth }) {
    const { data, setData, post, processing, errors } = useForm({
        student_id: '',
        name: '',
        email: '',
        contact_number: '',
        department: '',
        course: '',
        year_level: '',
        age: '',
        gpa: '',
        enrolled_units: '',
        scholarship_status: '',
        sport_team: '',
        team_name: '',
        gdrive_link: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('mis.athletes.store'));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Add New Athlete" />

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href={route('mis.dashboard')}
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <UserPlusIcon className="w-10 h-10 text-blue-400" />
                            Add New Athlete
                        </h1>
                        <p className="mt-2 text-slate-400">
                            Enter student-athlete information
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
                        <div className="space-y-6">
                            {/* Personal Information Section */}
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-slate-700">
                                    Personal Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-300 mb-2">
                                            Student ID <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.student_id}
                                            onChange={(e) => setData('student_id', e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        {errors.student_id && <p className="mt-1 text-sm text-red-400">{errors.student_id}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 mb-2">
                                            Full Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 mb-2">
                                            Email <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 mb-2">
                                            Contact Number
                                        </label>
                                        <input
                                            type="text"
                                            value={data.contact_number}
                                            onChange={(e) => setData('contact_number', e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.contact_number && <p className="mt-1 text-sm text-red-400">{errors.contact_number}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 mb-2">
                                            Age <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={data.age}
                                            onChange={(e) => setData('age', e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        {errors.age && <p className="mt-1 text-sm text-red-400">{errors.age}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Academic Information Section */}
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-slate-700">
                                    Academic Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-300 mb-2">
                                            Department <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.department}
                                            onChange={(e) => setData('department', e.target.value)}
                                            placeholder="e.g., College of Engineering"
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        {errors.department && <p className="mt-1 text-sm text-red-400">{errors.department}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 mb-2">
                                            Course
                                        </label>
                                        <input
                                            type="text"
                                            value={data.course}
                                            onChange={(e) => setData('course', e.target.value)}
                                            placeholder="e.g., BS Computer Science"
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.course && <p className="mt-1 text-sm text-red-400">{errors.course}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 mb-2">
                                            Year Level
                                        </label>
                                        <select
                                            value={data.year_level}
                                            onChange={(e) => setData('year_level', e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Year Level</option>
                                            <option value="1st Year">1st Year</option>
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                            <option value="4th Year">4th Year</option>
                                            <option value="5th Year">5th Year</option>
                                        </select>
                                        {errors.year_level && <p className="mt-1 text-sm text-red-400">{errors.year_level}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 mb-2">
                                            GPA
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="4"
                                            value={data.gpa}
                                            onChange={(e) => setData('gpa', e.target.value)}
                                            placeholder="e.g., 3.50"
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.gpa && <p className="mt-1 text-sm text-red-400">{errors.gpa}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 mb-2">
                                            Enrolled Units
                                        </label>
                                        <input
                                            type="number"
                                            value={data.enrolled_units}
                                            onChange={(e) => setData('enrolled_units', e.target.value)}
                                            placeholder="e.g., 21"
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.enrolled_units && <p className="mt-1 text-sm text-red-400">{errors.enrolled_units}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 mb-2">
                                            Scholarship Status
                                        </label>
                                        <select
                                            value={data.scholarship_status}
                                            onChange={(e) => setData('scholarship_status', e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Status</option>
                                            <option value="Scholar">Scholar</option>
                                            <option value="Non-Scholar">Non-Scholar</option>
                                            <option value="Partial Scholar">Partial Scholar</option>
                                        </select>
                                        {errors.scholarship_status && <p className="mt-1 text-sm text-red-400">{errors.scholarship_status}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Sports Information Section */}
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-slate-700">
                                    Sports Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-300 mb-2">
                                            Sport/Team
                                        </label>
                                        <input
                                            type="text"
                                            value={data.sport_team}
                                            onChange={(e) => setData('sport_team', e.target.value)}
                                            placeholder="e.g., Basketball, Volleyball"
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.sport_team && <p className="mt-1 text-sm text-red-400">{errors.sport_team}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 mb-2">
                                            Team Name
                                        </label>
                                        <input
                                            type="text"
                                            value={data.team_name}
                                            onChange={(e) => setData('team_name', e.target.value)}
                                            placeholder="e.g., Varsity Team"
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.team_name && <p className="mt-1 text-sm text-red-400">{errors.team_name}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-slate-300 mb-2">
                                            Google Drive Link
                                        </label>
                                        <input
                                            type="url"
                                            value={data.gdrive_link}
                                            onChange={(e) => setData('gdrive_link', e.target.value)}
                                            placeholder="https://drive.google.com/..."
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.gdrive_link && <p className="mt-1 text-sm text-red-400">{errors.gdrive_link}</p>}
                                        <p className="text-xs text-slate-400 mt-1">
                                            Link to documents folder (Whiteform, Medical, PDS, etc.)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-4 pt-6 border-t border-slate-700">
                                <Link
                                    href={route('mis.dashboard')}
                                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? 'Creating...' : 'Create Athlete'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
