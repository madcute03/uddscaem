import React from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import ArticleCard from '../Components/ArticleCard';
import LatestSlider from '../Components/LatestSlider';

export default function Home({ headlines = [], featured = [], latest = [], popular = [], recent = [], categories = [] }) {
  return (
    <AppLayout title="Home" headlines={headlines}>
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <header className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Featured Stories</h2>
            <Link href="/articles" className="text-sm text-blue-600 hover:underline">
              Browse all articles
            </Link>
          </header>
          <div className="grid md:grid-cols-3 gap-4">
            {featured.length ? (
              featured.map((article) => <ArticleCard key={article.id} article={article} />)
            ) : (
              <p className="text-sm text-slate-500 col-span-full">No featured articles yet.</p>)
            }
          </div>
          <LatestSlider articles={latest} />
        </div>
        <aside className="space-y-6">
          <div className="bg-slate-900 text-white rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Popular</h3>
            <ul className="space-y-3 text-sm">
              {popular.length ? (
                popular.map((article) => (
                  <li key={article.id}>
                    <Link href={`/articles/${article.slug}`} className="hover:underline">
                      {article.title}
                    </Link>
                    <p className="text-slate-300 text-xs line-clamp-2">{article.excerpt}</p>
                  </li>
                ))
              ) : (
                <li>No popular articles yet.</li>
              )}
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Recent</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              {recent.length ? (
                recent.map((article) => (
                  <li key={article.id}>
                    <Link href={`/articles/${article.slug}`} className="hover:text-blue-600">
                      {article.title}
                    </Link>
                  </li>
                ))
              ) : (
                <li>No recent articles yet.</li>
              )}
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Categories</h3>
            <div className="flex flex-wrap gap-2 text-sm">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/articles?category=${category.slug}`}
                  className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </AppLayout>
  );
}
