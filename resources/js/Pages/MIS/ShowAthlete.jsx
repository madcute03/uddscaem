import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeftIcon, UserIcon, AcademicCapIcon, TrophyIcon } from '@heroicons/react/24/outline';

export default function ShowAthlete({ auth, athlete }) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`View Athlete - ${athlete.name}`} />

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
                            <UserIcon className="w-10 h-10 text-blue-400" />
                            Athlete Profile
                        </h1>
                    </div>

                    {/* Profile Card */}
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 space-y-6">
                        {/* Personal Information */}
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-slate-700 flex items-center gap-2">
                                <UserIcon className="w-6 h-6 text-blue-400" />
                                Personal Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoItem label="Student ID" value={athlete.student_id} />
                                <InfoItem label="Full Name" value={athlete.name} />
                                <InfoItem label="Email" value={athlete.email} />
                                <InfoItem label="Contact Number" value={athlete.contact_number || 'N/A'} />
                                <InfoItem label="Birthdate" value={athlete.birthdate ? new Date(athlete.birthdate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} />
                                <InfoItem label="Age" value={athlete.age} />
                                <InfoItem label="Department" value={athlete.department} />
                            </div>
                        </div>

                        {/* Academic Information */}
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-slate-700 flex items-center gap-2">
                                <AcademicCapIcon className="w-6 h-6 text-green-400" />
                                Academic Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoItem label="Course" value={athlete.course || 'N/A'} />
                                <InfoItem label="Year Level" value={athlete.year_level || 'N/A'} />
                                <InfoItem label="Enrolled Units" value={athlete.enrolled_units || 'N/A'} />
                                <InfoItem 
                                    label="Scholarship Status" 
                                    value={athlete.scholarship_status || 'N/A'}
                                    badge={athlete.scholarship_status === 'Scholar'}
                                />
                            </div>
                        </div>

                        {/* Sports Information */}
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-slate-700 flex items-center gap-2">
                                <TrophyIcon className="w-6 h-6 text-yellow-400" />
                                Sports Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoItem label="Sport/Team" value={athlete.sport_team || 'N/A'} />
                                <InfoItem label="Team Name" value={athlete.team_name || 'N/A'} />
                                {athlete.gdrive_link && (
                                    <div className="md:col-span-2">
                                        <label className="block text-slate-400 text-sm mb-1">Documents Link</label>
                                        <a 
                                            href={athlete.gdrive_link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 underline break-all"
                                        >
                                            {athlete.gdrive_link}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Registration Info */}
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-slate-700">
                                Registration Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoItem 
                                    label="Status" 
                                    value={athlete.status}
                                    badge={true}
                                />
                                <InfoItem 
                                    label="Registered At" 
                                    value={new Date(athlete.registered_at).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })} 
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-4 pt-6 border-t border-slate-700">
                            <Link
                                href={route('mis.dashboard')}
                                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                Back
                            </Link>
                            <Link
                                href={route('mis.athletes.edit', athlete.id)}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Edit Profile
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function InfoItem({ label, value, badge = false }) {
    return (
        <div>
            <label className="block text-slate-400 text-sm mb-1">{label}</label>
            {badge ? (
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    value === 'Scholar' || value === 'approved'
                        ? 'bg-green-500/20 text-green-400'
                        : value === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-slate-500/20 text-slate-400'
                }`}>
                    {value}
                </span>
            ) : (
                <p className="text-white text-base">{value}</p>
            )}
        </div>
    );
}
