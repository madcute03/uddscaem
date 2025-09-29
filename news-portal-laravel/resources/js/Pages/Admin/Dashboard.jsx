import React, { useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Pagination from '../../Components/Pagination';

export default function Dashboard() {
  const { articles, categories, filters, stats } = usePage().props;

  const statusBadges = useMemo(
    () => ({
      draft: 'bg-slate-200 text-slate-700',
      scheduled: 'bg-amber-200 text-amber-800',
      published: 'bg-green-200 text-green-800',
    }),
    []
  );

  const handleToggle = (article, type) => {
    const endpoints = {
      headline: `/admin/articles/${article.id}/toggle-headline`,
      featured: `/admin/articles/${article.id}/toggle-featured`,
      popular: `/admin/articles/${article.id}/toggle-popular`,
    };

    router.post(endpoints[type], {}, { preserveScroll: true });
  };

  const handleDelete = (article) => {
    if (confirm(`Delete "${article.title}"?`)) {
      router.delete(`/admin/articles/${article.id}`, { preserveScroll: true });
    }
  };

  return (
    <AppLayout title="Admin Dashboard">
      <Head title="Admin Dashboard" />
      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Drafts" value={stats.drafts} tone="bg-slate-900" />
          <StatCard label="Scheduled" value={stats.scheduled} tone="bg-amber-500" />
          <StatCard label="Published" value={stats.published} tone="bg-emerald-500" />
          <StatCard label="Headlines" value={stats.headlines} tone="bg-blue-600" />
        </section>

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Articles</h2>
              <p className="text-sm text-slate-500">Manage content, scheduling, and prominence.</p>
            </div>
            <Link
              href="/admin/articles/create"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white text-sm font-semibold px-4 py-2 hover:bg-blue-500"
            >
              New article
            </Link>
          </header>

          <Filters categories={categories} filters={filters} />

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Title</Th>
                  <Th>Status</Th>
                  <Th>Category</Th>
                  <Th>Author</Th>
                  <Th className="text-center">Promote</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {articles.data.length ? (
                  articles.data.map((article) => (
                    <tr key={article.id}>
                      <Td>
                        <div className="space-y-1">
                          <Link href={`/articles/${article.slug}`} className="font-semibold text-slate-900 hover:text-blue-600">
                            {article.title}
                          </Link>
                          <p className="text-xs text-slate-500 line-clamp-1">{article.excerpt}</p>
                        </div>
                      </Td>
                      <Td>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusBadges[article.status] || 'bg-slate-200 text-slate-700'
                        }`}>
                          {article.status}
                        </span>
                      </Td>
                      <Td>{article.category?.name ?? '—'}</Td>
                      <Td>{article.author?.name ?? 'Editorial Team'}</Td>
                      <Td>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggle(article, 'headline')}
                            className={`px-2 py-1 rounded text-xs font-semibold border ${
                              article.is_headline ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600'
                            }`}
                          >
                            Headline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(article, 'featured')}
                            className={`px-2 py-1 rounded text-xs font-semibold border ${
                              article.is_featured ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 text-slate-600'
                            }`}
                          >
                            Featured
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(article, 'popular')}
                            className={`px-2 py-1 rounded text-xs font-semibold border ${
                              article.is_popular ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-300 text-slate-600'
                            }`}
                          >
                            Popular
                          </button>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/articles/${article.id}/edit`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(article)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <Td colSpan={6} className="text-center text-slate-500 py-10">
                      No articles found.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination links={articles.links} />
        </section>
      </div>
    </AppLayout>
  );
}

function Th({ children, className = '' }) {
  return (
    <th scope="col" className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = '', ...props }) {
  return (
    <td className={`px-4 py-3 align-top text-sm text-slate-700 ${className}`} {...props}>
      {children}
    </td>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className={`rounded-xl px-5 py-4 text-white shadow-sm ${tone}`}>
      <p className="text-sm uppercase tracking-wide text-white/70">{label}</p>
      <p className="text-2xl font-semibold mt-2">{value}</p>
    </div>
  );
}

function Filters({ categories, filters }) {
  return (
    <form method="get" className="grid gap-4 sm:grid-cols-5 bg-slate-50 border border-slate-200 rounded-lg p-4">
      <input
        type="search"
        name="search"
        defaultValue={filters.search ?? ''}
        placeholder="Search title or excerpt..."
        className="sm:col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <select
        name="status"
        defaultValue={filters.status ?? ''}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      >
        <option value="">All statuses</option>
        <option value="draft">Draft</option>
        <option value="scheduled">Scheduled</option>
        <option value="published">Published</option>
      </select>
      <select
        name="category"
        defaultValue={filters.category ?? ''}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white text-sm font-semibold px-4 py-2 hover:bg-blue-500"
      >
        Apply
      </button>
    </form>
  );
}
