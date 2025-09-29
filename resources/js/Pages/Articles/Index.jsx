import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import ArticleCard from '../../Components/ArticleCard';
import Pagination from '../../Components/Pagination';
import PublicLayout from '@/Layouts/PublicLayout';
import HeadlinesTicker from '@/Components/HeadlinesTicker';

export default function Index() {
  const { articles, categories, search, selectedCategory, headlines, latest, popular } = usePage().props;

  const fallbackArticles = useMemo(() => {
    const combined = [...(latest ?? []), ...(popular ?? [])];
    const seen = new Set();

    return combined.filter((article) => {
      if (seen.has(article.id)) {
        return false;
      }

      seen.add(article.id);
      return true;
    });
  }, [latest, popular]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const currentArticle = fallbackArticles[currentSlide] ?? null;

  useEffect(() => {
    setCurrentSlide(0);
    setShowDetailModal(false);
    setSelectedArticle(null);
  }, [fallbackArticles]);

  useEffect(() => {
    if (!fallbackArticles.length || showDetailModal) {
      return undefined;
    }

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % fallbackArticles.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [fallbackArticles, fallbackArticles.length, showDetailModal]);

  const handlePrev = () => {
    if (!fallbackArticles.length) return;
    setCurrentSlide((prev) => (prev - 1 + fallbackArticles.length) % fallbackArticles.length);
  };

  const handleNext = () => {
    if (!fallbackArticles.length) return;
    setCurrentSlide((prev) => (prev + 1) % fallbackArticles.length);
  };

  const openArticleDetails = (article) => {
    if (!article) return;
    setSelectedArticle(article);
    setShowDetailModal(true);
  };

  const closeArticleDetails = () => {
    setShowDetailModal(false);
    setSelectedArticle(null);
  };

  return (
    <PublicLayout title="News" headlines={headlines} showHeadlinesInHeader={false}>
      <Head title="News" />
      <div className="space-y-8">
        <div className="flex flex-col gap-4 text-slate-100">
          <div className="flex items-center gap-4">
            <img
              src="/images/sems.png"
              alt="SCAEMS logo"
              className="h-16 w-16 rounded-full border border-slate-800 object-cover"
            />
            <h1 className="text-3xl font-semibold uppercase tracking-[0.3em]">SCAEMS News</h1>
            {headlines?.length ? (
            <div className="w-full">
              <HeadlinesTicker headlines={headlines} />
            </div>
          ) : null}
          </div>
        </div>
        <section className="bg-slate-900/80 border border-slate-800/50 rounded-2xl backdrop-blur shadow-lg shadow-blue-950/30 overflow-hidden">
          <form
            method="get"
            className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-end md:justify-between md:gap-3"
          >
            <div className="md:flex-1">
              <label className="text-[11px] uppercase tracking-wide text-slate-400 mb-1 block">Search</label>
              <input
                type="search"
                defaultValue={search ?? ''}
                placeholder="Search news..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="md:w-56">
              <label className="text-[11px] uppercase tracking-wide text-slate-400 mb-1 block">Category</label>
              <select
                name="category"
                defaultValue={selectedCategory ?? ''}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="" className="bg-slate-950">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug} className="bg-slate-950">
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:w-auto">
              <button
                type="submit"
                className="w-full rounded-lg bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 md:px-5"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {articles.data.length ? (
                articles.data.map((article) => <ArticleCard key={article.id} article={article} />)
              ) : (
                <div className="sm:col-span-2 space-y-6 rounded-2xl border border-slate-800/60 bg-slate-900/70 p-8 text-slate-300">
                  <div className="text-center">
                  </div>

                  {fallbackArticles.length ? (
                    <div className="space-y-4">
                      <div className="relative">
                        {currentArticle ? (
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => openArticleDetails(currentArticle)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                openArticleDetails(currentArticle);
                              }
                            }}
                            className="group relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/70 shadow-lg shadow-blue-950/20 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          >
                            {currentArticle.hero_image_url && (
                              <div className="aspect-[16/9] w-full overflow-hidden">
                                <img
                                  src={currentArticle.hero_image_url}
                                  alt={currentArticle.title}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              </div>
                            )}
                            <div className="p-5 space-y-4 text-slate-200">
                              <div className="flex items-center justify-between gap-3">
                                {currentArticle.category?.name && (
                                  <span className="inline-flex items-center rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">
                                    {currentArticle.category.name}
                                  </span>
                                )}
                                {currentArticle.published_at && (
                                  <span className="text-xs text-slate-400">
                                    {new Date(currentArticle.published_at).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-xl font-semibold text-white leading-snug group-hover:text-blue-300">
                                {currentArticle.title}
                              </h3>
                              {currentArticle.excerpt && (
                                <p className="text-sm text-slate-300/90 line-clamp-3">
                                  {currentArticle.excerpt}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>
                                  {currentArticle.author?.name ? `By ${currentArticle.author.name}` : 'Editorial Team'}
                                </span>
                                {typeof currentArticle.reading_time === 'number' && (
                                  <span>{currentArticle.reading_time} min read</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-4 flex items-center justify-center gap-4">
                          <button
                            type="button"
                            onClick={handlePrev}
                            className="rounded-full border border-slate-700/60 bg-slate-800/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-blue-500/60 hover:bg-slate-800"
                          >
                            Previous
                          </button>
                          <span className="text-xs text-slate-400">
                            {fallbackArticles.length ? currentSlide + 1 : 0} of {fallbackArticles.length}
                          </span>
                          <button
                            type="button"
                            onClick={handleNext}
                            className="rounded-full border border-slate-700/60 bg-slate-800/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-blue-500/60 hover:bg-slate-800"
                          >
                            Next
                          </button>
                        </div>

                        <div className="mt-3 flex justify-center gap-2">
                          {fallbackArticles.map((article, index) => (
                            <button
                              key={`indicator-${article.id}`}
                              type="button"
                              onClick={() => setCurrentSlide(index)}
                              className={`h-2.5 w-2.5 rounded-full transition ${
                                index === currentSlide ? 'bg-blue-400' : 'bg-slate-600/80 hover:bg-slate-500'
                              }`}
                              aria-label={`View article ${index + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-slate-400">Please check back soon for new updates.</p>
                  )}
                </div>
              )}
            </div>
            <Pagination links={articles.links} />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/80 p-6 shadow-lg shadow-blue-950/20">
              <h3 className="text-lg font-semibold text-white">Popular News</h3>
              <p className="text-xs text-slate-400 mb-4">Most read stories this week.</p>
              <ul className="space-y-3 text-sm text-slate-300">
                {popular.map((article) => (
                  <li key={article.id} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400"></span>
                    <Link href={route('articles.show', article.slug)} className="hover:text-blue-300 transition">
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/80 p-6 shadow-lg shadow-blue-950/20">
              <h3 className="text-lg font-semibold text-white">Latest Updates</h3>
              <p className="text-xs text-slate-400 mb-4">Fresh stories just published.</p>
              <ul className="space-y-3 text-sm text-slate-300">
                {latest.map((article) => (
                  <li key={article.id} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400"></span>
                    <Link href={route('articles.show', article.slug)} className="hover:text-emerald-300 transition">
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {showDetailModal && selectedArticle ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl">
            <button
              type="button"
              onClick={closeArticleDetails}
              className="absolute right-4 top-4 z-10 rounded-full border border-slate-700/60 bg-slate-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-blue-500/60 hover:bg-slate-800"
            >
              Close
            </button>

            {selectedArticle.hero_image_url && (
              <div className="h-56 w-full overflow-hidden">
                <img
                  src={selectedArticle.hero_image_url}
                  alt={selectedArticle.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="space-y-4 p-8 text-slate-200">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">{selectedArticle.title}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {selectedArticle.category?.name && (
                    <span className="inline-flex items-center rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-300">
                      {selectedArticle.category.name}
                    </span>
                  )}
                  {selectedArticle.published_at && (
                    <span>
                      {new Date(selectedArticle.published_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                  <span>
                    {selectedArticle.author?.name ? `By ${selectedArticle.author.name}` : 'Editorial Team'}
                  </span>
                  {typeof selectedArticle.reading_time === 'number' && (
                    <span>{selectedArticle.reading_time} min read</span>
                  )}
                </div>
              </div>

              {selectedArticle.excerpt && (
                <p className="text-sm leading-relaxed text-slate-300">{selectedArticle.excerpt}</p>
              )}

              {selectedArticle.body ? (
                <div
                  className="prose prose-invert max-h-80 overflow-y-auto prose-p:text-slate-200"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.body }}
                />
              ) : (
                <p className="text-xs text-slate-400">
                  Read More.
                </p>
              )}

              <div className="flex flex-wrap justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeArticleDetails}
                  className="rounded-full border border-slate-700/60 bg-slate-800/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-blue-500/60 hover:bg-slate-800"
                >
                  Back
                </button>
                {selectedArticle.slug ? (
                  <Link
                    href={route('articles.show', selectedArticle.slug)}
                    className="inline-flex items-center gap-2 rounded-full border border-blue-500/60 bg-blue-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-200 transition hover:border-blue-400 hover:bg-blue-500/30"
                  >
                    Read More
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L12.586 11H4a1 1 0 110-2h8.586l-2.293-2.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PublicLayout>
  );
}
