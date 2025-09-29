import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import ArticleCard from '../../Components/ArticleCard';
import Pagination from '../../Components/Pagination';

export default function Index() {
  const { articles, categories, search, selectedCategory, headlines, latest, popular } = usePage().props;

  return (
    <AppLayout title="Articles" headlines={headlines}>
      <Head title="Articles" />
      <div className="space-y-6">
        <form method="get" className="grid md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow">
          <input
            type="search"
            name="search"
            defaultValue={search ?? ''}
            placeholder="Search articles..."
            className="md:col-span-2 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <select
            name="category"
            defaultValue={selectedCategory ?? ''}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white font-semibold text-sm px-4 py-2 hover:bg-blue-500"
          >
            Filter
          </button>
        </form>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {articles.data.length ? (
                articles.data.map((article) => <ArticleCard key={article.id} article={article} />)
              ) : (
                <p className="text-sm text-slate-500">No articles found.</p>
              )}
            </div>
            <Pagination links={articles.links} />
          </div>
          <aside className="space-y-6">
            <div className="bg-slate-900 text-white rounded-lg p-6 space-y-3">
              <h3 className="text-lg font-semibold">Popular</h3>
              <ul className="space-y-2 text-sm">
                {popular.map((article) => (
                  <li key={article.id}>
                    <Link href={`/articles/${article.slug}`} className="hover:underline">
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">Latest</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {latest.map((article) => (
                  <li key={article.id}>
                    <Link href={`/articles/${article.slug}`} className="hover:text-blue-600">
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
