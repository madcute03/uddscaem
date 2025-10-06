import React from 'react';
import { Link } from '@inertiajs/react';

const formatDate = (value) => {
  if (!value) {
    return null;
  }

  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    console.warn('Failed to format date in LatestSlider:', error);
    return null;
  }
};

export default function LatestSlider({ articles = [] }) {
  if (!Array.isArray(articles) || articles.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        No latest articles yet.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Latest Headlines</h3>
        <Link href={route('articles.index')} className="text-sm text-blue-600 hover:underline">
          View all
        </Link>
      </header>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {articles.map((article) => (
          <article
            key={article.id}
            className="min-w-[280px] flex-1 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            {article.category?.name && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                {article.category.name}
              </span>
            )}
            <h4 className="mt-3 text-lg font-semibold text-slate-900">
              <Link href={route('articles.show', article.slug)} className="hover:text-blue-600">
                {article.title}
              </Link>
            </h4>
            {article.excerpt && <p className="mt-2 text-sm text-slate-600 line-clamp-3">{article.excerpt}</p>}
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{article.author?.name ? `By ${article.author.name}` : 'Editorial Team'}</span>
              {formatDate(article.published_at) && <time>{formatDate(article.published_at)}</time>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
