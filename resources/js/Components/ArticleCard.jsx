import React from 'react';
import { Link } from '@inertiajs/react';

export default function ArticleCard({ article }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/70 shadow-lg shadow-blue-950/20 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-900/40">
      {article.hero_image_url && (
        <div className="aspect-[16/9] w-full overflow-hidden">
          <img
            src={article.hero_image_url}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-5 space-y-4 text-slate-200">
        <div className="flex items-center justify-between gap-3">
          {article.category?.name && (
            <span className="inline-flex items-center rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
              {article.category.name}
            </span>
          )}
          {article.published_at && (
            <span className="text-xs text-slate-400">
              {new Date(article.published_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
        <h3 className="text-xl font-semibold text-white leading-snug">
          <Link
            href={`/articles/${article.slug}`}
            className="transition-colors duration-200 hover:text-blue-300"
          >
            {article.title}
          </Link>
        </h3>
        {article.excerpt && (
          <p className="text-sm text-slate-300/90 line-clamp-3">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {article.author?.name ? `By ${article.author.name}` : 'Editorial Team'}
          </span>
          {typeof article.reading_time === 'number' && (
            <span>{article.reading_time} min read</span>
          )}
        </div>
      </div>
    </article>
  );
}
