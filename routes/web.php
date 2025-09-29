<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use Inertia\Inertia;

// Controllers
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\EventRegistrationController;
use App\Http\Controllers\CreateBracketController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\BracketController;
use App\Http\Controllers\DoubleEliminationController;
use App\Http\Controllers\SingleEliminationController;
use App\Http\Controllers\WriterController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\ComplaintController;
use App\Models\Event;
use App\Models\News;

// ============================================
// Public Routes
// ============================================

// Homepage
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion'     => PHP_VERSION,
        'events'         => Event::with('images')->orderBy('event_date')->get(),
        'news'           => News::orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->take(10)
            ->get(),
    ]);
})->name('home');

// News
Route::get('/news', [NewsController::class, 'publicIndex'])->name('news.index');
Route::get('/news/{news}', [NewsController::class, 'show'])->name('news.show');

// Articles (News Portal)
Route::get('/articles', [ArticleController::class, 'publicIndex'])->name('articles.index');
Route::get('/articles/{article:slug}', [ArticleController::class, 'show'])->name('articles.show');

// Events
Route::get('/events/{event}', [EventController::class, 'show'])->name('events.show');
Route::get('/bracket/{event}/show', [BracketController::class, 'ShowBracket'])->name('bracket.show');
Route::get('/standing/{event}/show', [BracketController::class, 'ShowStanding'])->name('standing.show');

// Bracket Data (Public JSON endpoints)
Route::get('/double-elimination/{event}', [DoubleEliminationController::class, 'show'])
    ->name('double-elimination.show');
Route::get('/single-elimination/{event}', [SingleEliminationController::class, 'show'])
    ->name('single-elimination.show');

// Event Registration
Route::get('/events/{event}/register', [EventRegistrationController::class, 'create'])
    ->name('events.register');
Route::post('/events/{event}/register', [EventRegistrationController::class, 'store'])
    ->name('eventregistrations.store');
Route::get('/events/{event}/registrations', [EventRegistrationController::class, 'showTeamRegistrations'])
    ->name('events.registrations');

// Complaints
Route::get('/complaints', [ComplaintController::class, 'index'])->name('complaints.index');
Route::post('/complaints', [ComplaintController::class, 'store'])->name('complaints.store');

// Bracket Previews
Route::get('/bracket/single/{teams}', function ($teams) {
    $componentMap = [
        2 => 'Bracket/SingleEliminationBracket/Bracket2',
        3 => 'Bracket/SingleEliminationBracket/Bracket3',
        4 => 'Bracket/SingleEliminationBracket/Bracket4',
        5 => 'Bracket/SingleEliminationBracket/Bracket5',
        6 => 'Bracket/SingleEliminationBracket/Bracket6',
        7 => 'Bracket/SingleEliminationBracket/Bracket7',
        8 => 'Bracket/SingleEliminationBracket/Bracket8',
    ];

    if (!isset($componentMap[$teams])) abort(404);

    return Inertia::render($componentMap[$teams], ['teams' => $teams]);
})->name('bracket.single');

Route::get('/bracket/double/{teams}', function ($teams) {
    $componentMap = [
        3 => 'Bracket/DoubleEliminationBracket/Bracket3/Bracket',
        4 => 'Bracket/DoubleEliminationBracket/Bracket4/Bracket',
        5 => 'Bracket/DoubleEliminationBracket/Bracket5/Bracket',
        6 => 'Bracket/DoubleEliminationBracket/Bracket6/Bracket',
        7 => 'Bracket/DoubleEliminationBracket/Bracket7/Bracket',
        8 => 'Bracket/DoubleEliminationBracket/Bracket8/Bracket',
    ];

    if (!isset($componentMap[$teams])) abort(404);

    return Inertia::render($componentMap[$teams], ['teams' => $teams]);
})->name('bracket.double');

// ============================================
// Admin Routes (Authenticated & Verified)
// ============================================
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [EventController::class, 'dashboard'])->name('dashboard');
    Route::get('/dashboard/create-competition', function () {
        return Inertia::render('createEvents/CreateCompetition', [
            'auth' => [
                'user' => auth()->user()
            ],
            'events' => [],
        ]);
    })->name('dashboard.create-competition');

    Route::get('/dashboard/create-tryouts', function () {
        return Inertia::render('createEvents/CreateTryouts', [
            'auth' => [
                'user' => auth()->user()
            ],
            'events' => []
        ]);
    })->name('dashboard.reate-tryouts');

    Route::get('/dashboard/create-intramurals', function () {
        return Inertia::render('createEvents/CreateIntramurals', [
            'auth' => [
                'user' => auth()->user()
            ],
            'events' => []
        ]);
    })->name('dashboard.create-intramurals');

    Route::get('/dashboard/create-other-event', function () {
        return Inertia::render('createEvents/CreateOtherEvent', [
            'auth' => [
                'user' => auth()->user()
            ],
            'events' => []
        ]);
    })->name('dashboard.create-other-event');

    Route::middleware(['auth:sanctum'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [ArticleController::class, 'adminIndex'])->name('dashboard');

        Route::get('/articles/create', [ArticleController::class, 'create'])->name('articles.create');

        Route::post('/articles', [ArticleController::class, 'store'])->name('articles.store');
        Route::put('/articles/{article}', [ArticleController::class, 'update'])->name('articles.update');
        Route::delete('/articles/{article}', [ArticleController::class, 'destroy'])->name('articles.destroy');
        Route::post('/articles/{article}/toggle-headline', [ArticleController::class, 'toggleHeadline'])->name('articles.toggle-headline');
        Route::post('/articles/{article}/toggle-featured', [ArticleController::class, 'toggleFeatured'])->name('articles.toggle-featured');
        Route::post('/articles/{article}/toggle-popular', [ArticleController::class, 'togglePopular'])->name('articles.toggle-popular');
        Route::post('/articles/upload', [ArticleController::class, 'uploadRichMedia'])->name('articles.upload');

        Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::put('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

        Route::get('/writers', [WriterController::class, 'index'])->name('writers.index');
        Route::post('/writers', [WriterController::class, 'store'])->name('writers.store');
        Route::put('/writers/{writer}', [WriterController::class, 'update'])->name('writers.update');
        Route::delete('/writers/{writer}', [WriterController::class, 'destroy'])->name('writers.destroy');
    });
    Route::post('/events/{id}/mark-undone', [EventController::class, 'markUndone'])->name('events.markUndone');

    // Bracket Management
    Route::get('/dashboard/bracket', [CreateBracketController::class, 'bracket'])->name('bracket');
    Route::post('/events/{event}/bracket-settings', [BracketController::class, 'storeBracketSettings'])->name('bracket.storeSettings');
    Route::post('/single-elimination/save', [SingleEliminationController::class, 'save'])->name('single-elimination.save');
    Route::post('/brackets/save', [BracketController::class, 'save'])->name('bracket.save');


    // News Management
    Route::get('/dashboard/createnews', [NewsController::class, 'index'])->name('dashboard.createnews');
    Route::post('/news', [NewsController::class, 'store'])->name('news.store');
    Route::put('/news/{news}', [NewsController::class, 'update'])->name('news.update');
    Route::delete('/news/{news}', [NewsController::class, 'destroy'])->name('news.destroy');

    // Complaints Management
    Route::prefix('admin')->group(function () {
        Route::get('/complaints', [ComplaintController::class, 'adminIndex'])->name('admin.complaints.index');
        Route::delete('/complaints/{complaint}', [ComplaintController::class, 'destroy'])->name('admin.complaints.destroy');
    });

    // Player Management
    Route::post('/player/update-status', [PlayerController::class, 'updateStatus'])->name('player.updateStatus');

    // User Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
