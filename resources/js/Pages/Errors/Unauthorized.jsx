import React from 'react';
import { Head } from '@inertiajs/inertia-react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Unauthorized({ status }) {
    const title = {
        403: '403 Forbidden',
        404: '404 Not Found',
        419: 'Page Expired',
        500: 'Server Error',
        503: 'Service Unavailable',
    }[status] || 'An error occurred';

    const description = {
        403: 'Sorry, you are not authorized to access this page.',
        404: 'Sorry, the page you are looking for could not be found.',
        419: 'The page expired, please try again.',
        500: 'Whoops, something went wrong on our servers.',
        503: 'Sorry, we are doing some maintenance. Please check back soon.',
    }[status] || 'An error occurred while processing your request.';

    return (
        <GuestLayout>
            <Head title={title} />
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 text-red-100 bg-red-600 rounded-full">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                        <p className="mt-2 text-gray-600">{description}</p>
                        <div className="mt-6">
                            <a
                                href="/dashboard"
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Go to Dashboard
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
