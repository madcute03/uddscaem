import React from 'react';
import { Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function ArticleCard({ article }) {
  return (
    <article className="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {article.hero_image_path && (
        <img
          src={article.hero_image_path}
          alt={article.title}
          className="h-48 w-full object-cover"
        />
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
          {article.category?.name ?? 'General'}
        </div>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">
          <Link href={`/articles/${article.slug}`} className="hover:text-blue-600">
            {article.title}
          </Link>
        </h3>
        <p className="mt-3 text-sm text-slate-600 line-clamp-3">{article.excerpt}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>By {article.author?.name ?? 'Editorial Team'}</span>
          <span>{article.published_at ? dayjs(article.published_at).fromNow() : 'Draft'}</span>
        </div>
      </div>
    </article>
  );
}
