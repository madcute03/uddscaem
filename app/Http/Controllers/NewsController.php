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
        // Default categories
        $defaultCategories = ['Sports', 'Culture', 'Arts'];
        
        // Get all unique categories from existing news (excluding 'education') and merge with defaults
        $dbCategories = News::select('category')
            ->where('category', '!=', 'education')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->toArray();
            
        $categories = array_unique(array_merge($defaultCategories, $dbCategories));

        return inertia('Admin/News/Create', [
            'existingCategories' => $categories,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Debug logging
        \Log::info('News store request received', [
            'all_data' => $request->all(),
            'title' => $request->title,
            'title_length' => strlen($request->title ?? ''),
            'description_length' => strlen($request->description ?? ''),
            'has_title' => $request->has('title'),
            'has_description' => $request->has('description'),
        ]);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required_without:newCategory|string|nullable',
            'newCategory' => 'required_without:category|string|nullable',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        // Use new category if provided, otherwise use the selected category
        $category = $request->filled('newCategory') ? $request->newCategory : $request->category;

        $newsData = [
            'writer_id' => Auth::id(),
            'writer_name' => Auth::user()->name,
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'category' => $category,
            'description' => $request->description,
            'date' => now()->format('F j, Y'),
            'status' => 'pending',
        ];

        // Handle image upload if present
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('news', 'public');
            $newsData['image'] = $imagePath;
        }

        $news = News::create($newsData);

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

        // Default categories
        $defaultCategories = ['Sports', 'Culture', 'Arts'];
        
        // Get all unique categories from existing news (excluding 'education') and merge with defaults
        $dbCategories = News::select('category')
            ->where('category', '!=', 'education')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->toArray();
            
        $categories = array_unique(array_merge($defaultCategories, $dbCategories));

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

    // Log the request for debugging
    \Log::info('Update request:', $request->all());
    \Log::info('Has file image:', [$request->hasFile('image')]);

    // Validate input
    $validated = $request->validate([
        'title' => 'nullable|string|max:255',
        'description' => 'nullable|string',
        'category' => 'nullable|string',
        'newCategory' => 'nullable|string',
        'status' => 'nullable|in:pending,active,inactive',
        'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
    ]);

    // Prepare data to update
    $updateData = [];

    if ($request->filled('title')) {
        $updateData['title'] = $request->title;
        $updateData['slug'] = \Str::slug($request->title);
    }

    if ($request->filled('description')) {
        $updateData['description'] = $request->description;
    }

    // Category: use new one if provided
    if ($request->filled('newCategory')) {
        $updateData['category'] = $request->newCategory;
    } elseif ($request->filled('category')) {
        $updateData['category'] = $request->category;
    }

    if ($request->filled('status')) {
        $updateData['status'] = $request->status;
    }

    // ✅ Handle Image Upload
    if ($request->hasFile('image')) {
        // Delete old image if exists
        if ($news->image && \Storage::disk('public')->exists($news->image)) {
            \Storage::disk('public')->delete($news->image);
        }

        // Store new image
        $path = $request->file('image')->store('news', 'public');
        $updateData['image'] = $path;
    } elseif ($request->input('remove_image') === '1') {
        // Handle image removal if user deletes it
        if ($news->image && \Storage::disk('public')->exists($news->image)) {
            \Storage::disk('public')->delete($news->image);
        }
        $updateData['image'] = null;
    }

    // ✅ Save updated data
    $news->update($updateData);

    return redirect()
        ->route('admin.news.index')
        ->with('success', 'News updated successfully!');
}


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(News $news)
    {
        $this->authorize('delete', $news);
        
        // Delete the associated image file if it exists
        if ($news->image) {
            // Get the filename from the stored path
            $filename = basename($news->image);
            
            // Path where the image is actually stored
            $storagePath = 'public/news/' . $filename;
            
            // Delete from storage
            if (Storage::exists($storagePath)) {
                Storage::delete($storagePath);
            }
            
            // Also try to delete the symlinked version in public/storage
            $publicPath = public_path('storage/news/' . $filename);
            if (file_exists($publicPath)) {
                unlink($publicPath);
            }
            
            // Try direct path in case the above doesn't work
            $directPath = storage_path('app/public/news/' . $filename);
            if (file_exists($directPath)) {
                unlink($directPath);
            }
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
    
    /**
     * Handle image upload from rich text editor
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('news/editor', 'public');
            return response()->json([
                'success' => true,
                'url' => asset('storage/' . $path)
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Image upload failed.'
        ], 400);
    }
}
