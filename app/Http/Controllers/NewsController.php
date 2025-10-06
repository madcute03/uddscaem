<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class NewsController extends Controller
{
    /**
     * Display a listing of the resource (Admin dashboard).
     */
    public function index()
    {
        $news = News::with('writer')->latest()->get();

        $stats = [
            'total' => News::count(),
            'pending' => News::where('status', 'pending')->count(),
            'active' => News::where('status', 'active')->count(),
            'inactive' => News::where('status', 'inactive')->count(),
            'writers' => User::where('role', 'writer')->count(),
        ];

        return inertia('Admin/News/Index', [
            'news' => $news,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $categories = ['Sports', 'Technology', 'Entertainment', 'Politics', 'Health', 'Travel', 'Business', 'Education'];

        return inertia('Admin/News/Create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'category' => 'required|string',
        ]);

        $imagePath = $request->file('image')->store('news', 'public');

        $news = News::create([
            'writer_id' => Auth::id(),
            'writer_name' => Auth::user()->name,
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'image' => $imagePath,
            'category' => $request->category,
            'description' => $request->description,
            'date' => now()->format('F j, Y'),
            'status' => 'pending',
        ]);

        return redirect()->route('admin.news.index')->with('success', 'News created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(News $news)
    {
        $news->increment('count');

        return inertia('Admin/News/Show', [
            'news' => $news->load('writer'),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(News $news)
    {
        $this->authorize('update', $news);

        $categories = ['Sports', 'Technology', 'Entertainment', 'Politics', 'Health', 'Travel', 'Business', 'Education'];

        return inertia('Admin/News/Edit', [
            'news' => $news,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, News $news)
    {
        $this->authorize('update', $news);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'category' => 'required|string',
            'status' => 'required|in:pending,active,inactive',
        ]);

        $data = [
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'category' => $request->category,
            'description' => $request->description,
            'status' => $request->status,
        ];

        if ($request->hasFile('image')) {
            // Delete old image
            if ($news->image) {
                Storage::disk('public')->delete($news->image);
            }
            $data['image'] = $request->file('image')->store('news', 'public');
        }

        $news->update($data);

        return redirect()->route('admin.news.index')->with('success', 'News updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(News $news)
    {
        $this->authorize('delete', $news);

        // Delete image file
        if ($news->image) {
            Storage::disk('public')->delete($news->image);
        }

        $news->delete();

        return redirect()->route('admin.news.index')->with('success', 'News deleted successfully!');
    }

    /**
     * Get public news for frontend.
     */
    public function publicIndex()
    {
        $news = News::where('status', 'active')
            ->latest()
            ->paginate(12);

        return inertia('News/Index', [
            'news' => $news,
        ]);
    }

    /**
     * Show single public news.
     */
    public function publicShow($slug)
    {
        $news = News::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        $news->increment('count');

        $relatedNews = News::where('category', $news->category)
            ->where('id', '!=', $news->id)
            ->where('status', 'active')
            ->latest()
            ->take(3)
            ->get();

        return inertia('News/Show', [
            'news' => $news,
            'relatedNews' => $relatedNews,
        ]);
    }
}
