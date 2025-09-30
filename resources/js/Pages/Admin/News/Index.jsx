import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function NewsIndex({ news, stats }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">News Management</h2>
                    <div className="space-x-4">
                        <Link
                            href={route('admin.writers.create')}
                            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Create Writer
                        </Link>
                        <Link
                            href={route('admin.news.create')}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Create News
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="News Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                        <div className="bg-slate-900 overflow-hidden shadow-sm sm:rounded-lg border border-slate-700">
                            <div className="p-6 text-slate-100">
                                <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
                                <div className="text-sm text-slate-400">Total News</div>
                            </div>
                        </div>
                        <div className="bg-slate-900 overflow-hidden shadow-sm sm:rounded-lg border border-slate-700">
                            <div className="p-6 text-slate-100">
                                <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
                                <div className="text-sm text-slate-400">Pending</div>
                            </div>
                        </div>
                        <div className="bg-slate-900 overflow-hidden shadow-sm sm:rounded-lg border border-slate-700">
                            <div className="p-6 text-slate-100">
                                <div className="text-2xl font-bold text-green-400">{stats.active}</div>
                                <div className="text-sm text-slate-400">Active</div>
                            </div>
                        </div>
                        <div className="bg-slate-900 overflow-hidden shadow-sm sm:rounded-lg border border-slate-700">
                            <div className="p-6 text-slate-100">
                                <div className="text-2xl font-bold text-red-400">{stats.inactive}</div>
                                <div className="text-sm text-slate-400">Inactive</div>
                            </div>
                        </div>
                        <div className="bg-slate-900 overflow-hidden shadow-sm sm:rounded-lg border border-slate-700">
                            <div className="p-6 text-slate-100">
                                <div className="text-2xl font-bold text-purple-400">{stats.writers}</div>
                                <div className="text-sm text-slate-400">Writers</div>
                            </div>
                        </div>
                    </div>

                    {/* News Table */}
                    <div className="bg-slate-900 overflow-hidden shadow-sm sm:rounded-lg border border-slate-700">
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto">
                                    <thead className="bg-slate-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                Title
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                Writer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                Views
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-slate-900 divide-y divide-slate-700">
                                        {news.map((article) => (
                                            <tr key={article.id} className="hover:bg-slate-800">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <img
                                                            className="h-10 w-10 rounded-lg object-cover border border-slate-600"
                                                            src={`/storage/${article.image}`}
                                                            alt={article.title}
                                                        />
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-slate-100">
                                                                {article.title}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                        {article.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        article.status === 'active'
                                                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                            : article.status === 'pending'
                                                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                    }`}>
                                                        {article.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    {article.writer_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    {new Date(article.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    {article.count}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <Link
                                                            href={route('admin.news.edit', article.id)}
                                                            className="text-blue-400 hover:text-blue-300"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <Link
                                                            href={route('admin.news.destroy', article.id)}
                                                            method="delete"
                                                            as="button"
                                                            className="text-red-400 hover:text-red-300"
                                                        >
                                                            Delete
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
