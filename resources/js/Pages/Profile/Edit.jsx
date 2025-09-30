import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout>
            <Head title="Profile" />

            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100 p-4 sm:p-6 md:p-8">
                <div className="max-w-4xl w-full mx-auto">
                    {/* Header Section */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">Profile Settings</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Profile Information Section */}
                        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/50 rounded-xl p-6 shadow-lg shadow-blue-950/20">
                            <h3 className="text-xl font-semibold text-slate-100 mb-4">Profile Information</h3>
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </div>

                        {/* Update Password Section */}
                        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/50 rounded-xl p-6 shadow-lg shadow-blue-950/20">
                            <h3 className="text-xl font-semibold text-slate-100 mb-4">Update Password</h3>
                            <UpdatePasswordForm className="max-w-xl" />
                        </div>

                        {/* Delete Account Section */}
                        <div className="bg-slate-900/60 backdrop-blur border border-red-800/30 rounded-xl p-6 shadow-lg shadow-red-950/20">
                            <h3 className="text-xl font-semibold text-red-300 mb-4">Delete Account</h3>
                            <DeleteUserForm className="max-w-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
