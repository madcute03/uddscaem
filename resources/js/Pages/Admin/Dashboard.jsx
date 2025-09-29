import React, { useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '../../Components/Pagination';

export default function Dashboard() {
  const { articles, categories, filters, stats, statusOptions = [] } = usePage().props;

  const statusBadges = useMemo(
    () => ({
      draft: 'bg-slate-200 text-slate-700',
      scheduled: 'bg-amber-200 text-amber-800',
      published: 'bg-green-200 text-green-800',
    }),
    []
  );

  const featureLinks = useMemo(() => [
      {
        label: 'Create News',
        description: 'Draft and publish new stories for the portal.',
        href: route('admin.articles.create'),
        accent: 'from-blue-500/30 via-cyan-400/30 to-blue-500/30',
      },
      {
        label: 'Manage Categories',
        description: 'Organize article categories and topics.',
        href: route('admin.categories.index'),
        accent: 'from-emerald-500/30 via-teal-400/30 to-emerald-500/30',
      },
      {
        label: 'Manage Writers',
        description: 'Invite and manage newsroom contributors.',
        href: route('admin.writers.index'),
        accent: 'from-purple-500/30 via-indigo-400/30 to-purple-500/30',
      },
    ], []);

  const handleToggle = (article, type) => {
    const routes = {
      headline: route('admin.articles.toggle-headline', { article: article.slug }),
      featured: route('admin.articles.toggle-featured', { article: article.slug }),
      popular: route('admin.articles.toggle-popular', { article: article.slug }),
    };

    router.post(routes[type], {}, { preserveScroll: true });
  };

  const handleDelete = (article) => {
    if (confirm(`Delete "${article.title}"?`)) {
      router.delete(route('admin.articles.destroy', { article: article.slug }), { preserveScroll: true });
    }
  };

  const handleStatusChange = (article, status) => {
    const formData = new FormData();
    formData.append('_method', 'put');
    formData.append('status', status);

    if (status === 'published' && !article.published_at) {
      formData.append('published_at', new Date().toISOString());
    }

    if (status !== 'published') {
      formData.append('published_at', '');
    }

    router.post(route('admin.articles.update', { article: article.slug }), formData, {
      preserveScroll: true,
      forceFormData: true,
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-2xl font-semibold text-slate-100">News Dashboard</h2>
      }
    >
      <Head title="News Dashboard" />
      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Drafts" value={stats.drafts} tone="bg-slate-900" />
          <StatCard label="Scheduled" value={stats.scheduled} tone="bg-amber-500" />
          <StatCard label="Published" value={stats.published} tone="bg-emerald-500" />
          <StatCard label="Headlines" value={stats.headlines} tone="bg-blue-600" />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-4 transition hover:border-slate-700 hover:bg-slate-900"
            >
              <div
                className={`pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-gradient-to-r ${link.accent}`}
              />
              <div className="relative flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-slate-100 group-hover:text-white">
                    {link.label}
                  </h3>
                  <p className="text-sm text-slate-400 group-hover:text-slate-200/90">
                    {link.description}
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition group-hover:border-slate-500 group-hover:text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/80 shadow-lg backdrop-blur-sm space-y-4 p-6">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">News</h2>
              <p className="text-sm text-slate-300">Manage content, scheduling, and prominence.</p>
            </div>
            <Link
              href={route('admin.articles.create')}
              className="inline-flex items-center justify-center rounded-md bg-blue-500 text-white text-sm font-semibold px-4 py-2 transition hover:bg-blue-400"
            >
              New News
            </Link>
          </header>

          <Filters categories={categories} filters={filters} />

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
              <thead className="bg-slate-800/60">
                <tr>
                  <Th>Title</Th>
                  <Th>Status</Th>
                  <Th>Category</Th>
                  <Th>Author</Th>
                  <Th className="text-center">Promote</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {articles.data.length ? (
                  articles.data.map((article) => (
                    <tr key={article.id}>
                      <Td>
                        <div className="space-y-1">
                          <Link href={route('articles.show', article.slug)} className="font-semibold text-white hover:text-blue-400">
                            {article.title}
                          </Link>
                          <p className="text-xs text-slate-400 line-clamp-1">{article.excerpt}</p>
                        </div>
                      </Td>
                      <Td>
                        <select
                          defaultValue={article.status}
                          onChange={(event) => handleStatusChange(article, event.target.value)}
                          className={`rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            statusBadges[article.status] ?? 'text-slate-700'
                          }`}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
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
                          <Link href={route('articles.show', article.slug)} className="text-sm text-blue-600 hover:underline">
                            View
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
                      No news found.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination links={articles.links} />
        </section>
      </div>
    </AuthenticatedLayout>
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
    <td className={`px-4 py-3 align-top text-sm text-slate-200 ${className}`} {...props}>
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
    <form
      method="get"
      className="grid gap-4 sm:grid-cols-5 rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-slate-200 backdrop-blur"
    >
      <input
        type="search"
        name="search"
        defaultValue={filters.search ?? ''}
        placeholder="Search title or excerpt..."
        className="sm:col-span-2 rounded-md border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
      />
      <select
        name="status"
        defaultValue={filters.status ?? ''}
        className="rounded-md border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
      >
        <option value="">All statuses</option>
        <option value="draft">Draft</option>
        <option value="scheduled">Scheduled</option>
        <option value="published">Published</option>
      </select>
      <select
        name="category"
        defaultValue={filters.category ?? ''}
        className="rounded-md border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
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
        className="inline-flex items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
      >
        Apply
      </button>
    </form>
  );
}
