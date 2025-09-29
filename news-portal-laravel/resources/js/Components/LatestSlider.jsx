import React from 'react';
import { Link } from '@inertiajs/react';

export default function LatestSlider({ articles = [] }) {
  if (!articles.length) return null;

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Latest</h2>
        <Link href="/articles" className="text-sm text-blue-600 hover:underline">
          View all
        </Link>
      </header>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.slug}`}
            className="min-w-[240px] bg-white rounded-lg shadow-sm hover:shadow transition-shadow"
          >
            {article.hero_image_path && (
              <img
                src={article.hero_image_path}
                alt={article.title}
                className="h-36 w-full object-cover rounded-t-lg"
              />
            )}
            <div className="p-4 space-y-2">
              <p className="text-xs uppercase text-blue-600 font-semibold">
                {article.category?.name ?? 'General'}
              </p>
              <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">{article.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-3">{article.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
