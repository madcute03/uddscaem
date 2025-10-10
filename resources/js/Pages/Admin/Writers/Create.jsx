import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function CreateWriter() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        bio: '',
        specialization: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.writers.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">Add Writer</h2>
            }
        >
            <Head title="Add Writer" />

            <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex justify-end">
                        <Link
                            href={route('admin.writers.index')}
                            className="bg-slate-700/50 border border-slate-600 hover:bg-slate-600/60 text-slate-200 font-medium py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center hover:text-white"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37 1 .608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Writers
                        </Link>
                    </div>
                    <div className="bg-slate-800/60 backdrop-blur-md overflow-hidden shadow-sm sm:rounded-lg border border-slate-700/50">
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1 block w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-700/70 transition-colors duration-200"
                                        required
                                    />
                                    {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="mt-1 block w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-700/70 transition-colors duration-200"
                                        required
                                    />
                                    {errors.email && <div className="text-red-600 text-sm mt-1">{errors.email}</div>}
                                </div>

                                {/* Password */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="mt-1 block w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-700/70 transition-colors duration-200"
                                        required
                                    />
                                    {errors.password && <div className="text-red-600 text-sm mt-1">{errors.password}</div>}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-slate-300">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="mt-1 block w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-700/70 transition-colors duration-200"
                                        required
                                    />
                                    {errors.password_confirmation && <div className="text-red-600 text-sm mt-1">{errors.password_confirmation}</div>}
                                </div>

                                {/* Bio */}
                                <div>
                                    <label htmlFor="bio" className="block text-sm font-medium text-slate-300">
                                        Bio
                                    </label>
                                    <textarea
                                        id="bio"
                                        rows={4}
                                        value={data.bio}
                                        onChange={(e) => setData('bio', e.target.value)}
                                        className="mt-1 block w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-700/70 transition-colors duration-200"
                                        placeholder="Brief bio about the writer..."
                                    />
                                    {errors.bio && <div className="text-red-600 text-sm mt-1">{errors.bio}</div>}
                                </div>

                                {/* Specialization */}
                                <div>
                                    <label htmlFor="specialization" className="block text-sm font-medium text-slate-300">
                                        Specialization
                                    </label>
                                    <input
                                        type="text"
                                        id="specialization"
                                        value={data.specialization}
                                        onChange={(e) => setData('specialization', e.target.value)}
                                        className="mt-1 block w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-700/70 transition-colors duration-200"
                                        placeholder="e.g., Sports, Technology, Politics"
                                    />
                                    {errors.specialization && <div className="text-red-600 text-sm mt-1">{errors.specialization}</div>}
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end space-x-3">
                                    <Link
                                        href={route('admin.writers.index')}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                    >
                                        {processing ? 'Creating...' : 'Add User'}
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
