<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    public function publicIndex(Request $request): Response
    {
        $search = $request->string('search');
        $categorySlug = $request->string('category');

        $articlesQuery = Article::query()
            ->published()
            ->with(['category:id,name,slug', 'author:id,name,avatar_path'])
            ->when($search, fn ($query) => $query->where(function ($searchQuery) use ($search) {
                $searchQuery
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%");
            }))
            ->when($categorySlug, fn ($query) => $query
                ->whereHas('category', fn ($categoryQuery) => $categoryQuery->where('slug', $categorySlug)))
            ->latest('published_at');

        $articles = $articlesQuery->paginate(9)->withQueryString();

        return Inertia::render('Articles/Index', [
            'articles' => $articles,
            'categories' => Category::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
            'search' => $search,
            'selectedCategory' => $categorySlug,
            'headlines' => Article::query()
                ->published()
                ->where('is_headline', true)
                ->latest('published_at')
                ->take(10)
                ->get(['id', 'title', 'slug']),
            'latest' => Article::query()->published()->recent()->take(6)->get(['id', 'title', 'slug', 'hero_image_path', 'excerpt', 'published_at']),
            'popular' => Article::query()->published()->popular()->take(6)->get(['id', 'title', 'slug', 'hero_image_path', 'excerpt', 'views']),
        ]);
    }

    public function home(): Response
    {
        $headlines = Article::query()
            ->published()
            ->where('is_headline', true)
            ->latest('published_at')
            ->take(10)
            ->get(['id', 'title', 'slug']);

        $featured = Article::query()
            ->featured()
            ->with(['category:id,name,slug', 'author:id,name'])
            ->take(3)
            ->get(['id', 'title', 'slug', 'excerpt', 'hero_image_path', 'published_at', 'category_id', 'author_id']);

        $latest = Article::query()
            ->recent()
            ->with(['category:id,name,slug'])
            ->take(8)
            ->get(['id', 'title', 'slug', 'excerpt', 'hero_image_path', 'published_at', 'category_id', 'author_id']);

        $popular = Article::query()
            ->popular()
            ->with(['category:id,name,slug'])
            ->take(6)
            ->get(['id', 'title', 'slug', 'excerpt', 'hero_image_path', 'views', 'category_id']);

        $recent = Article::query()
            ->published()
            ->latest('published_at')
            ->take(5)
            ->get(['id', 'title', 'slug', 'published_at']);

        return Inertia::render('Home', [
            'headlines' => $headlines,
            'featured' => $featured,
            'latest' => $latest,
            'popular' => $popular,
            'recent' => $recent,
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
        ]);
    }

    public function show(Article $article): Response
    {
        if ($article->status !== 'published') {
            Gate::authorize('view', $article);
        }

        $article->load(['category:id,name,slug', 'author:id,name,bio,avatar_path']);
        $article->increment('views');

        return Inertia::render('Articles/Show', [
            'article' => $article,
            'related' => Article::query()
                ->published()
                ->where('id', '!=', $article->id)
                ->where('category_id', $article->category_id)
                ->latest('published_at')
                ->take(3)
                ->get(['id', 'title', 'slug', 'hero_image_path', 'excerpt', 'published_at']),
        ]);
    }

    public function adminIndex(Request $request): Response
    {
        $this->authorize('viewAny', Article::class);

        $filters = $request->only(['search', 'status', 'category', 'author']);

        $articles = Article::query()
            ->with(['category:id,name', 'author:id,name'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('excerpt', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['category'] ?? null, fn ($query, $category) => $query->where('category_id', $category))
            ->when($filters['author'] ?? null, fn ($query, $author) => $query->where('author_id', $author))
            ->latest('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Dashboard', [
            'articles' => $articles,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $filters,
            'stats' => [
                'drafts' => Article::query()->where('status', 'draft')->count(),
                'scheduled' => Article::query()->where('status', 'scheduled')->count(),
                'published' => Article::query()->where('status', 'published')->count(),
                'headlines' => Article::query()->where('is_headline', true)->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Article::class);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:articles,slug'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['required', 'string'],
            'hero_image' => ['nullable', 'image'],
            'status' => ['required', Rule::in(['draft', 'scheduled', 'published'])],
            'published_at' => ['nullable', 'date'],
            'category_id' => ['required', 'exists:categories,id'],
            'is_featured' => ['boolean'],
            'is_headline' => ['boolean'],
            'is_popular' => ['boolean'],
        ]);

        if ($request->hasFile('hero_image')) {
            $validated['hero_image_path'] = $request->file('hero_image')->store('articles', 'public');
        }

        $validated['author_id'] = $request->user()->id;
        $article = Article::create($validated);

        return redirect()->back()->with('success', 'Article created successfully.');
    }

    public function update(Request $request, Article $article): RedirectResponse
    {
        $this->authorize('update', $article);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('articles')->ignore($article->id)],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['sometimes', 'string'],
            'status' => ['sometimes', Rule::in(['draft', 'scheduled', 'published'])],
            'published_at' => ['nullable', 'date'],
            'category_id' => ['sometimes', 'exists:categories,id'],
            'hero_image' => ['nullable', 'image'],
            'is_featured' => ['boolean'],
            'is_headline' => ['boolean'],
            'is_popular' => ['boolean'],
        ]);

        if ($request->hasFile('hero_image')) {
            if ($article->hero_image_path) {
                Storage::disk('public')->delete($article->hero_image_path);
            }
            $validated['hero_image_path'] = $request->file('hero_image')->store('articles', 'public');
        }

        $article->update($validated);

        return redirect()->back()->with('success', 'Article updated successfully.');
    }

    public function destroy(Article $article): RedirectResponse
    {
        $this->authorize('delete', $article);

        if ($article->hero_image_path) {
            Storage::disk('public')->delete($article->hero_image_path);
        }

        $article->delete();

        return redirect()->back()->with('success', 'Article deleted successfully.');
    }

    public function toggleHeadline(Article $article): RedirectResponse
    {
        $this->authorize('update', $article);

        $article->update(['is_headline' => ! $article->is_headline]);

        return redirect()->back()->with('success', 'Headline status updated.');
    }

    public function toggleFeatured(Article $article): RedirectResponse
    {
        $this->authorize('update', $article);

        $article->update(['is_featured' => ! $article->is_featured]);

        return redirect()->back()->with('success', 'Featured status updated.');
    }

    public function togglePopular(Article $article): RedirectResponse
    {
        $this->authorize('update', $article);

        $article->update(['is_popular' => ! $article->is_popular]);

        return redirect()->back()->with('success', 'Popular status updated.');
    }

    public function uploadRichMedia(Request $request)
    {
        $this->authorize('create', Article::class);

        $validated = $request->validate([
            'file' => ['required', 'image', 'max:2048'],
        ]);

        $path = $validated['file']->store('article-editor', 'public');

        return response()->json([
            'url' => Storage::disk('public')->url($path),
        ]);
    }
}
