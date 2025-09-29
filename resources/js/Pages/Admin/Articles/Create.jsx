import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import PrimaryButton from '../../../Components/PrimaryButton';
import SecondaryButton from '../../../Components/SecondaryButton';
import InputLabel from '../../../Components/InputLabel';
import TextInput from '../../../Components/TextInput';
import InputError from '../../../Components/InputError';
import AuthenticatedLayout from '../../../Layouts/AuthenticatedLayout';

export default function Create({ categories = [], statusOptions = [] }) {
  const {
    data,
    setData,
    post,
    processing,
    errors,
    reset,
  } = useForm({
    title: '',
    slug: '',
    excerpt: '',
    body: '',
    hero_image: null,
    status: statusOptions[0]?.value ?? 'draft',
    published_at: '',
    category_id: categories[0]?.id ?? '',
    is_featured: false,
    is_headline: false,
    is_popular: false,
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    post(route('admin.articles.store'), {
      preserveState: false,
      forceFormData: true,
      onSuccess: () => {
        reset('title', 'slug', 'excerpt', 'body', 'hero_image', 'status', 'published_at', 'category_id', 'is_featured', 'is_headline', 'is_popular');
      },
    });
  };

  return (
    <AuthenticatedLayout title="Create News">
      <Head title="Create News" />

      <div className="space-y-6 text-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Create News</h1>
            <p className="text-sm text-slate-400">Publish new.</p>
          </div>
          <SecondaryButton as={Link} href={route('admin.dashboard')}>
            Back
          </SecondaryButton>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-blue-950/30"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <InputLabel htmlFor="title" value="Title" className="text-slate-300" />
              <TextInput
                id="title"
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                className="mt-1 w-full border-slate-700 bg-slate-800 text-slate-100 focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <InputError message={errors.title} className="mt-2" />
            </div>
            <div>
              <InputLabel htmlFor="slug" value="Slug" className="text-slate-300" />
              <TextInput
                id="slug"
                value={data.slug}
                onChange={(e) => setData('slug', e.target.value)}
                className="mt-1 w-full border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Optional"
              />
              <InputError message={errors.slug} className="mt-2" />
            </div>
            <div>
              <InputLabel htmlFor="category_id" value="Category" className="text-slate-300" />
              <select
                id="category_id"
                name="category_id"
                value={data.category_id}
                onChange={(e) => setData('category_id', e.target.value)}
                className="mt-1 w-full rounded-md border-slate-700 bg-slate-800 text-slate-100 focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="" disabled>
                  Select category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <InputError message={errors.category_id} className="mt-2" />
            </div>
            <div>
              <InputLabel htmlFor="status" value="Status" className="text-slate-300" />
              <select
                id="status"
                name="status"
                value={data.status}
                onChange={(e) => setData('status', e.target.value)}
                className="mt-1 w-full rounded-md border-slate-700 bg-slate-800 text-slate-100 focus:border-blue-500 focus:ring-blue-500"
                required
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <InputError message={errors.status} className="mt-2" />
            </div>
            <div>
              <InputLabel htmlFor="published_at" value="Publish date" className="text-slate-300" />
              <TextInput
                id="published_at"
                type="datetime-local"
                value={data.published_at ?? ''}
                onChange={(e) => setData('published_at', e.target.value)}
                className="mt-1 w-full border-slate-700 bg-slate-800 text-slate-100 focus:border-blue-500 focus:ring-blue-500"
              />
              <InputError message={errors.published_at} className="mt-2" />
            </div>
            <div>
              <InputLabel htmlFor="hero_image" value="image" className="text-slate-300" />
              <input
                id="hero_image"
                type="file"
                accept="image/*"
                onChange={(e) => setData('hero_image', e.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-blue-500/10 file:px-4 file:py-2 file:text-blue-300 hover:file:bg-blue-500/20"
              />
              <InputError message={errors.hero_image} className="mt-2" />
            </div>
          </div>

          <div>
            <InputLabel htmlFor="excerpt" value="Excerpt" className="text-slate-300" />
            <textarea
              id="excerpt"
              value={data.excerpt}
              onChange={(e) => setData('excerpt', e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border-slate-700 bg-slate-800 text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Short summary (optional)"
            />
            <InputError message={errors.excerpt} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="body" value="Body" className="text-slate-300" />
            <textarea
              id="body"
              value={data.body}
              onChange={(e) => setData('body', e.target.value)}
              rows={10}
              className="mt-1 w-full rounded-md border-slate-700 bg-slate-800 text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
            <InputError message={errors.body} className="mt-2" />
          </div>

          <fieldset className="grid gap-3 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <legend className="px-2 text-sm font-semibold text-slate-200">Prominence</legend>
            <label className="flex items-center gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={data.is_headline}
                onChange={(e) => setData('is_headline', e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
              />
              <span>Headline</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={data.is_featured}
                onChange={(e) => setData('is_featured', e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
              />
              <span>Featured</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={data.is_popular}
                onChange={(e) => setData('is_popular', e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
              />
              <span>Popular</span>
            </label>
          </fieldset>

          <div className="flex items-center justify-end gap-3">
            <SecondaryButton type="button" onClick={() => window.history.back()} disabled={processing}>
              Cancel
            </SecondaryButton>
            <PrimaryButton disabled={processing}>Save News</PrimaryButton>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
