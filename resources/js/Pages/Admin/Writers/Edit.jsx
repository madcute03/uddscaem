import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function EditWriter({ auth, writer }) {
    const { data, setData, put, processing, errors } = useForm({
        name: writer.name,
        email: writer.email,
        bio: writer.writer_profile?.bio || '',
        specialization: writer.writer_profile?.specialization || '',
        status: writer.writer_profile?.status || 'active',
        role: writer.role || 'writer',
        password: '',
        password_confirmation: '',
    });
    
    const roles = [
        { value: 'admin', label: 'Administrator' },
        { value: 'writer', label: 'Writer' },
    ];

    const [isEditingPassword, setIsEditingPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.writers.update', writer.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Edit Writer" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                    <Link
                        href={route('admin.writers.index')}
                        className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Writers
                    </Link>
                </div>
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-slate-900 overflow-hidden shadow-sm sm:rounded-lg border border-slate-700">
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                                </div>

                                {/* Password (optional) */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                                            Password
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingPassword(!isEditingPassword)}
                                            className="text-sm text-blue-500 hover:text-blue-400"
                                        >
                                            {isEditingPassword ? 'Cancel' : 'Change Password'}
                                        </button>
                                    </div>
                                    {isEditingPassword && (
                                        <div className="space-y-4 mt-2">
                                            <div>
                                                <input
                                                    type="password"
                                                    id="password"
                                                    value={data.password || ''}
                                                    onChange={e => setData('password', e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Leave blank to keep current password"
                                                />
                                                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                                            </div>
                                            <div>
                                                <input
                                                    type="password"
                                                    id="password_confirmation"
                                                    value={data.password_confirmation || ''}
                                                    onChange={e => setData('password_confirmation', e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Bio */}
                                <div>
                                    <label htmlFor="bio" className="block text-sm font-medium text-slate-300 mb-2">
                                        Bio
                                    </label>
                                    <textarea
                                        id="bio"
                                        value={data.bio}
                                        onChange={e => setData('bio', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.bio && <p className="mt-1 text-sm text-red-500">{errors.bio}</p>}
                                </div>

                                {/* Specialization */}
                                <div>
                                    <label htmlFor="specialization" className="block text-sm font-medium text-slate-300 mb-2">
                                        Specialization
                                    </label>
                                    <input
                                        type="text"
                                        id="specialization"
                                        value={data.specialization}
                                        onChange={e => setData('specialization', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.specialization && <p className="mt-1 text-sm text-red-500">{errors.specialization}</p>}
                                </div>

                                {/* Role (Admin only) */}
                                {auth?.user?.role === 'admin' && (
                                    <div>
                                        <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                                            Role
                                        </label>
                                        <select
                                            id="role"
                                            value={data.role}
                                            onChange={e => setData('role', e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {roles.map((role) => (
                                                <option key={role.value} value={role.value}>
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
                                    </div>
                                )}

                                {/* Status (Admin only) */}
                                {auth?.user?.role === 'admin' && (
                                    <div>
                                        <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-2">
                                            Status
                                        </label>
                                        <select
                                            id="status"
                                            value={data.status}
                                            onChange={e => setData('status', e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        {errors.status && <p className="mt-1 text-sm text-red-500">{errors.status}</p>}
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3 pt-4">
                                    <a
                                        href={route('admin.writers.index')}
                                        className="px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                    >
                                        Cancel
                                    </a>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {processing ? 'Updating...' : 'Update Writer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
