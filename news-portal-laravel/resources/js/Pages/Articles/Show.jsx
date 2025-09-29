import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import AppLayout from '../../Layouts/AppLayout';
import ArticleCard from '../../Components/ArticleCard';

export default function Show() {
  const { article, related } = usePage().props;

  return (
    <AppLayout title={article.title}>
      <Head title={article.title} />
      <article className="space-y-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-blue-600 font-semibold">
            <span>{article.category?.name ?? 'General'}</span>
            <span className="text-slate-400">•</span>
            <span>{dayjs(article.published_at).format('MMM D, YYYY')}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              {article.author?.avatar_path && (
                <img
                  src={article.author.avatar_path}
                  alt={article.author.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-semibold text-slate-800">{article.author?.name ?? 'Editorial Team'}</p>
                {article.author?.bio && <p className="text-xs text-slate-500">{article.author.bio}</p>}
              </div>
            </div>
            <span className="text-xs uppercase tracking-wide">{article.reading_time} min read</span>
            <span className="text-xs uppercase tracking-wide">{article.views} views</span>
          </div>
        </header>

        {article.hero_image_path && (
          <img
            src={article.hero_image_path}
            alt={article.title}
            className="w-full max-h-[480px] object-cover rounded-lg"
          />
        )}

        <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: article.body }} />

        <footer className="border-t border-slate-200 pt-6 flex items-center justify-between text-sm">
          <Link href="/articles" className="text-blue-600 hover:underline">
            ← Back to articles
          </Link>
          <span className="text-slate-500">Published {dayjs(article.published_at).format('MMM D, YYYY h:mm A')}</span>
        </footer>
      </article>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Related stories</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {related.length ? (
            related.map((item) => <ArticleCard key={item.id} article={item} />)
          ) : (
            <p className="text-sm text-slate-500">No related stories yet.</p>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
