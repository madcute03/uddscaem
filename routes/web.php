<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use Inertia\Inertia;

use App\Http\Controllers\NewsController;
use App\Http\Controllers\WriterController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\BracketController;
use App\Http\Controllers\CreateBracketController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\EventRegistrationController;
use App\Http\Controllers\DoubleEliminationController;
use App\Http\Controllers\SingleEliminationController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\ProfileController;
use App\Models\Event;

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
        'events'         => \App\Models\Event::with('images')->orderBy('event_date')->get(),
    ]);
})->name('home');

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

// News (Public)
Route::get('/news', [NewsController::class, 'publicIndex'])->name('news.index');
Route::get('/news/{slug}', [NewsController::class, 'publicShow'])->name('news.show');

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
    })->name('dashboard.create-tryouts');

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

    Route::post('/events', [EventController::class, 'store'])->name('events.store');
    Route::put('/events/{id}', [EventController::class, 'update'])->name('events.update');
    Route::delete('/events/{id}', [EventController::class, 'destroy'])->name('events.destroy');
    Route::post('/events/{id}/mark-done', [EventController::class, 'markDone'])->name('events.markDone');

    Route::post('/events/{id}/mark-undone', [EventController::class, 'markUndone'])->name('events.markUndone');
    // Bracket Management
    Route::get('/dashboard/bracket', [CreateBracketController::class, 'bracket'])->name('bracket');
    Route::post('/events/{event}/bracket-settings', [BracketController::class, 'storeBracketSettings'])->name('bracket.storeSettings');
    Route::post('/single-elimination/save', [SingleEliminationController::class, 'save'])->name('single-elimination.save');
    Route::post('/double-elimination/save', [DoubleEliminationController::class, 'save'])->name('double-elimination.save');
    Route::post('/brackets/save', [BracketController::class, 'save'])->name('bracket.save');

    // Complaints Management
    Route::prefix('admin')->group(function () {
        Route::get('/complaints', [ComplaintController::class, 'adminIndex'])->name('admin.complaints.index');
        Route::delete('/complaints/{complaint}', [ComplaintController::class, 'destroy'])->name('admin.complaints.destroy');
    });

    // News Management
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::resource('news', NewsController::class)->except(['show']);
        Route::resource('writers', WriterController::class);
        Route::patch('/writers/{writer}/toggle-status', [WriterController::class, 'toggleStatus'])->name('writers.toggle-status');
    });

    // Player Management
    Route::post('/player/update-status', [PlayerController::class, 'updateStatus'])->name('player.updateStatus');

    // User Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
