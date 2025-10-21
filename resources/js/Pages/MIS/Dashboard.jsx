import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    ChartBarIcon,
    DocumentArrowDownIcon,
    UserGroupIcon,
    AcademicCapIcon,
    PlusIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

export default function MISDashboard({ auth, athletes, stats }) {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter athletes based on search term
    const filteredAthletes = useMemo(() => {
        if (!searchTerm.trim()) return athletes.data;
        const term = searchTerm.toLowerCase();
        return athletes.data.filter(athlete => 
            athlete.name?.toLowerCase().includes(term) ||
            athlete.student_id?.toLowerCase().includes(term) ||
            athlete.email?.toLowerCase().includes(term) ||
            athlete.course?.toLowerCase().includes(term) ||
            athlete.department?.toLowerCase().includes(term) ||
            athlete.sport_team?.toLowerCase().includes(term)
        );
    }, [athletes.data, searchTerm]);

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this athlete profile?')) {
            router.delete(route('mis.athletes.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    const handleExport = () => {
        window.location.href = route('mis.export.csv');
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="MIS Dashboard - Athlete Management" />

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                    <ChartBarIcon className="w-10 h-10 text-blue-400" />
                                    MIS Dashboard
                                </h1>
                                <p className="mt-2 text-slate-400">
                                    Student-Athlete Management Information System
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExport}
                                    className="w-[141px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#008000] to-[#008000]/0 
                                                               bg-[#008000]/20 flex items-center justify-center 
                                                               hover:bg-[#008000]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#008000]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                >
                                    <DocumentArrowDownIcon className="w-5 h-5" />
                                    Export CSV
                                </button>
                                <Link
                                    href={route('mis.athletes.create')}
                                    className="w-[141px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    Add Athlete
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Total Athletes"
                            value={stats.total_athletes}
                            icon={UserGroupIcon}
                            color="blue"
                        />
                        <StatCard
                            title="Active Athletes"
                            value={stats.active_athletes || 0}
                            icon={UserGroupIcon}
                            color="green"
                        />
                        <StatCard
                            title="Total Enrolled Units"
                            value={stats.total_enrolled_units || 0}
                            icon={ChartBarIcon}
                            color="purple"
                        />
                        <StatCard
                            title="Departments"
                            value={stats.by_department?.length || 0}
                            icon={AcademicCapIcon}
                            color="orange"
                        />
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 text-sm border border-slate-600 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                                placeholder="Search by name, student ID, email, course, department, or sport..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label="Search athletes"
                            />
                        </div>
                    </div>

                    {/* Athletes Table */}
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-700/50">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-slate-300 font-semibold">Student ID</th>
                                        <th className="text-left py-4 px-6 text-slate-300 font-semibold">Name</th>
                                        <th className="text-left py-4 px-6 text-slate-300 font-semibold">Course</th>
                                        <th className="text-left py-4 px-6 text-slate-300 font-semibold">Year</th>
                                        <th className="text-left py-4 px-6 text-slate-300 font-semibold">Sport/Team</th>
                                        <th className="text-left py-4 px-6 text-slate-300 font-semibold">Scholarship</th>
                                        <th className="text-right py-4 px-6 text-slate-300 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAthletes.length > 0 ? (
                                        filteredAthletes.map((athlete) => (
                                            <tr key={athlete.id} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                                                <td className="py-4 px-6 text-white">{athlete.student_id}</td>
                                                <td className="py-4 px-6 text-white">{athlete.name}</td>
                                                <td className="py-4 px-6 text-slate-300">{athlete.course || 'N/A'}</td>
                                                <td className="py-4 px-6 text-slate-300">{athlete.year_level || 'N/A'}</td>
                                                <td className="py-4 px-6 text-slate-300">{athlete.sport_team || 'N/A'}</td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        athlete.scholarship_status === 'Scholar' 
                                                            ? 'bg-green-500/20 text-green-400' 
                                                            : 'bg-slate-500/20 text-slate-400'
                                                    }`}>
                                                        {athlete.scholarship_status || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex justify-end gap-3">
                                                        <Link
                                                            href={route('mis.athletes.edit', athlete.id)}
                                                            className="text-blue-400 hover:text-blue-200 transition-colors duration-200"
                                                            title="Edit"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </Link>
                                                        <Link
                                                            href={route('mis.athletes.show', athlete.id)}
                                                            className="text-green-400 hover:text-green-200 transition-colors duration-200"
                                                            title="View"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(athlete.id)}
                                                            className="text-red-600 hover:text-red-400 transition-colors duration-200"
                                                            title="Delete"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="py-8 px-6 text-center text-slate-400">
                                                {searchTerm ? (
                                                    <>
                                                        <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-slate-500 mb-2" />
                                                        <p>No athletes found matching "{searchTerm}"</p>
                                                        <p className="text-sm mt-1">Try adjusting your search</p>
                                                    </>
                                                ) : (
                                                    'No athletes found. Add your first athlete to get started.'
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {athletes.links && athletes.links.length > 3 && (
                            <div className="flex justify-center gap-2 py-4 px-6 border-t border-slate-700">
                                {athletes.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-4 py-2 rounded-lg transition-colors ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : link.url
                                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ title, value, icon: Icon, color }) {
    const colorClasses = {
        blue: 'bg-blue-500/20 text-blue-400',
        green: 'bg-green-500/20 text-green-400',
        purple: 'bg-purple-500/20 text-purple-400',
        orange: 'bg-orange-500/20 text-orange-400',
    };

    return (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm mb-1">{title}</p>
                    <p className="text-3xl font-bold text-white">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-8 h-8" />
                </div>
            </div>
        </div>
    );
}
