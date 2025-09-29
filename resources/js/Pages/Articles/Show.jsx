import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import ArticleCard from '../../Components/ArticleCard';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Show() {
  const { article, related, headlines } = usePage().props;

  return (
    <PublicLayout title={article.title} headlines={headlines}>
      <Head title={article.title} />
      <div className="space-y-10">
        <article className="rounded-3xl border border-slate-800/60 bg-slate-900/80 shadow-2xl shadow-blue-950/20 backdrop-blur overflow-hidden">
          {article.hero_image_url && (
            <div className="relative">
              <img
                src={article.hero_image_url}
                alt={article.title}
                className="w-full max-h-[460px] object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/90 to-transparent" />
            </div>
          )}

          <div className="space-y-8 px-6 py-8 sm:px-10">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide">
                <span className="inline-flex items-center rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 font-semibold text-blue-300">
                  {article.category?.name ?? 'General'}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">{dayjs(article.published_at).format('MMM D, YYYY')}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">{article.reading_time} min read</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">{article.views} views</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300/90">
                <div className="flex items-center gap-3">
                  {article.author?.avatar_path ? (
                    <img
                      src={article.author.avatar_path}
                      alt={article.author.name}
                      className="h-12 w-12 rounded-full object-cover border border-slate-800/80"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-blue-600/40 text-blue-200 flex items-center justify-center text-lg font-semibold">
                      {article.author?.name?.charAt(0) ?? 'E'}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold text-white">
                      {article.author?.name ?? 'Editorial Team'}
                    </p>
                    {article.author?.bio && (
                      <p className="text-xs text-slate-400 max-w-xs">
                        {article.author.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <div
              className="space-y-6 text-base leading-relaxed text-slate-200/90"
              dangerouslySetInnerHTML={{ __html: article.body }}
            />

            <footer className="flex flex-col gap-3 border-t border-slate-800/70 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={route('articles.index')}
                className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back
              </Link>
              <span>Published {dayjs(article.published_at).format('MMM D, YYYY h:mm A')}</span>
            </footer>
          </div>
        </article>

        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Related</h2>
            <Link
              href={route('articles.index')}
              className="text-sm text-blue-300 hover:text-blue-200 transition"
            >
              View all news
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {related.length ? (
              related.map((item) => <ArticleCard key={item.id} article={item} />)
            ) : (
              <div className="md:col-span-3 rounded-2xl border border-slate-800/60 bg-slate-900/70 p-8 text-center text-sm text-slate-400">
                No related stories yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
