<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use Inertia\Inertia;

use App\Http\Controllers\NewsController;
use App\Http\Controllers\WriterController;
use App\Http\Controllers\BorrowController;
use App\Http\Controllers\AthleteController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\BorrowersController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\BracketController;
use App\Http\Controllers\CreateBracketController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\RequirementsController;
use App\Http\Controllers\EventRegistrationController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\TournamentController;
use App\Http\Controllers\ChallongeDoubleEliminationController;

// ============================================
// Public Routes
// ============================================

// Homepage - New Landing Page
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
    ]);
})->name('home');

// Test route for visualization
Route::get('bracket/visualize', function () {
    return Inertia::render('BracketVisualize');
});

// Test route for bracket visualization fixes
Route::get('bracket/test', function () {
    return Inertia::render('BracketTest');
})->middleware(['auth']);

// Test route for double elimination logic validation
Route::get('bracket/double-elim-test', function () {
    return Inertia::render('DoubleElimTest');
})->middleware(['auth']);

// Events Page - List all events
Route::get('/events', function () {
    return Inertia::render('Events', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
        'events'         => \App\Models\Event::with('images')->orderBy('event_date')->get(),
    ]);
})->name('events.list');

// ============================================
// Event Viewing & Brackets
// ============================================

Route::get('/events/{event}', [EventController::class, 'show'])->name('events.show');
Route::get('/events/{event}/bracket/view', [TournamentController::class, 'publicViewBracket'])->name('events.publicViewBracket');

// ============================================
// Event Registration (Single Player Version)
// ============================================

// Registration form
Route::get('/events/{event}/register', [EventRegistrationController::class, 'create'])
    ->name('events.register');

// Registration submission
Route::post('/events/{event}/register', [EventRegistrationController::class, 'store'])
    ->name('eventregistrations.store');

// View registered players (per event)
Route::get('/events/{event}/registrations', [EventRegistrationController::class, 'showPlayers'])
    ->name('events.players');

// ============================================
// Complaints (Public)
// ============================================
Route::get('/complaints', [ComplaintController::class, 'index'])->name('complaints.index');
Route::post('/complaints', [ComplaintController::class, 'store'])->name('complaints.store');

// ============================================
// Requirements (Public)
// ============================================
Route::get('/requirements', [RequirementsController::class, 'index'])->name('requirements.index');

// ============================================
// News (Public)
// ============================================
Route::get('/news', [NewsController::class, 'publicIndex'])->name('news.index');
Route::get('/news/{slug}', [NewsController::class, 'publicShow'])->name('news.show');

// News Image Upload (Authenticated)
Route::middleware(['auth'])->group(function () {
    Route::post('/news/upload-image', [NewsController::class, 'uploadImage'])->name('news.upload-image');
});

// ============================================
// Public Borrowing
// ============================================
Route::get('/borrow', [BorrowController::class, 'index'])->name('borrow.index');
Route::get('/borrow/request', [BorrowController::class, 'create'])->name('borrow.request');
Route::post('/borrow/request', [BorrowController::class, 'store'])->name('borrow.store');
Route::get('/borrow/requests/search', [BorrowController::class, 'search'])->name('borrow.requests.search');

// ============================================
// Bracket Previews
// ============================================
Route::get('/bracket/single/{teams}', function ($teams) {
    $map = [
        2 => 'Bracket/SingleEliminationBracket/Bracket2',
        3 => 'Bracket/SingleEliminationBracket/Bracket3',
        4 => 'Bracket/SingleEliminationBracket/Bracket4',
        5 => 'Bracket/SingleEliminationBracket/Bracket5',
        6 => 'Bracket/SingleEliminationBracket/Bracket6',
        7 => 'Bracket/SingleEliminationBracket/Bracket7',
        8 => 'Bracket/SingleEliminationBracket/Bracket8',
    ];
    abort_unless(isset($map[$teams]), 404);
    return Inertia::render($map[$teams], ['teams' => $teams]);
})->name('bracket.single');

Route::get('/bracket/double/{teams}', function ($teams) {
    $map = [
        3 => 'Bracket/DoubleEliminationBracket/Bracket3/Bracket',
        4 => 'Bracket/DoubleEliminationBracket/Bracket4/Bracket',
        5 => 'Bracket/DoubleEliminationBracket/Bracket5/Bracket',
        6 => 'Bracket/DoubleEliminationBracket/Bracket6/Bracket',
        7 => 'Bracket/DoubleEliminationBracket/Bracket7/Bracket',
        8 => 'Bracket/DoubleEliminationBracket/Bracket8/Bracket',
    ];
    abort_unless(isset($map[$teams]), 404);
    return Inertia::render($map[$teams], ['teams' => $teams]);
})->name('bracket.double');

// ============================================
// Challonge Double Elimination Demo/API
// ============================================
Route::get('/api/challonge-de/demo/{teams}', function ($teams) {
    $teams = (int) $teams;
    if ($teams < 3 || $teams > 32) {
        return response()->json(['error' => 'Team count must be between 3 and 32'], 400);
    }
    
    $controller = new ChallongeDoubleEliminationController();
    $teamsArray = [];
    for ($i = 1; $i <= $teams; $i++) {
        $teamsArray[] = ['name' => 'Team ' . $i];
    }
    
    $bracket = $controller->generateDoubleEliminationBracket($teamsArray, 1);
    
    return response()->json($bracket, 200, [], JSON_PRETTY_PRINT);
})->name('challonge-de.demo.json');

Route::get('/api/challonge-de/visualize/{teams}', function ($teams) {
    $teams = (int) $teams;
    if ($teams < 3 || $teams > 32) {
        return response('Team count must be between 3 and 32', 400);
    }
    
    $controller = new ChallongeDoubleEliminationController();
    $visualization = $controller->visualizeBracket($teams);
    
    return response($visualization, 200, ['Content-Type' => 'text/plain']);
})->name('challonge-de.demo.visualize');

// ============================================
// Admin Routes (Authenticated & Verified)
// ============================================
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [EventController::class, 'dashboard'])->name('dashboard');
    Route::get('/dashboard/summary', [EventController::class, 'summary'])->name('dashboard.summary');

    // Event creation pages
    Route::get('/dashboard/create-competition', fn() => Inertia::render('createEvents/CreateCompetition', ['auth' => ['user' => auth()->user()]]) )->name('dashboard.create-competition');
    Route::get('/dashboard/create-tryouts', fn() => Inertia::render('createEvents/CreateTryouts', ['auth' => ['user' => auth()->user()]]) )->name('dashboard.create-tryouts');
    Route::get('/dashboard/create-intramurals', fn() => Inertia::render('createEvents/CreateIntramurals', ['auth' => ['user' => auth()->user()]]) )->name('dashboard.create-intramurals');
    Route::get('/dashboard/create-other-event', fn() => Inertia::render('createEvents/CreateOtherEvent', ['auth' => ['user' => auth()->user()]]) )->name('dashboard.create-other-event');

    // Event Management
    Route::get('/events/{id}/edit', [EventController::class, 'edit'])->name('events.edit');
    Route::post('/events', [EventController::class, 'store'])->name('events.store');
    Route::put('/events/{id}', [EventController::class, 'update'])->name('events.update');
    Route::post('/events/{id}', [EventController::class, 'update'])->name('events.update.post'); // For file uploads
    Route::delete('/events/{id}', [EventController::class, 'destroy'])->name('events.destroy');
    Route::post('/events/{id}/mark-done', [EventController::class, 'markDone'])->name('events.markDone');
    Route::post('/events/{id}/mark-undone', [EventController::class, 'markUndone'])->name('events.markUndone');
    Route::get('/events/{event}/rulebook/view', [EventController::class, 'viewRulebook'])->name('events.rulebook.view');
    Route::get('/events/{event}/rulebook/download', [EventController::class, 'downloadRulebook'])->name('events.rulebook.download');

    // Bracket Management
    Route::get('/dashboard/bracket', [CreateBracketController::class, 'bracket'])->name('bracket');
    Route::get('/events/{event}/dynamic-bracket', [TournamentController::class, 'showDynamicBracket'])->name('events.dynamicBracket');
    Route::get('/events/{event}/dynamic-bracket/view', [TournamentController::class, 'viewDynamicBracket'])->name('events.viewDynamicBracket');
    Route::get('/events/{event}/dynamic-bracket/manage', [TournamentController::class, 'manageBracket'])->name('events.manageBracket');
    Route::post('/events/{event}/bracket-settings', [BracketController::class, 'storeBracketSettings'])->name('bracket.storeSettings');
    Route::post('/brackets/save', [BracketController::class, 'save'])->name('bracket.save');

    // Complaints Management
    Route::prefix('admin')->group(function () {
        Route::get('/complaints', [ComplaintController::class, 'adminIndex'])->name('admin.complaints.index');
        Route::delete('/complaints/{complaint}', [ComplaintController::class, 'destroy'])->name('admin.complaints.destroy');
    });

    // Requirements Management
    Route::prefix('admin')->group(function () {
        Route::get('/requirements', [RequirementsController::class, 'adminIndex'])->name('admin.requirements.index');
        Route::post('/requirements', [RequirementsController::class, 'store'])->name('admin.requirements.store');
        Route::get('/requirements/{requirement}/view', [RequirementsController::class, 'view'])->name('admin.requirements.view');
        Route::delete('/requirements/{requirement}', [RequirementsController::class, 'destroy'])->name('admin.requirements.destroy');
    });

    // News and Writer Management
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::resource('news', NewsController::class)->except(['show']);
        Route::resource('writers', WriterController::class);
        Route::patch('/writers/{writer}/toggle-status', [WriterController::class, 'toggleStatus'])->name('writers.toggle-status');
        // Borrowers Management
        Route::get('/borrowers', [BorrowersController::class, 'index'])->name('borrowers.index');
        Route::post('/items', [BorrowersController::class, 'storeItem'])->name('items.store');
        Route::put('/items/{item}', [BorrowersController::class, 'updateItem'])->name('items.update');
        Route::delete('/items/{item}', [BorrowersController::class, 'deleteItem'])->name('items.destroy');
        Route::post('/borrow-requests/{borrowRequest}/approve', [BorrowersController::class, 'approve'])->name('borrow-requests.approve');
        Route::post('/borrow-requests/{borrowRequest}/deny', [BorrowersController::class, 'deny'])->name('borrow-requests.deny');
        Route::post('/borrow-requests/{borrowRequest}/returned', [BorrowersController::class, 'markReturned'])->name('borrow-requests.returned');
        Route::delete('/borrow-requests/{borrowRequest}', [BorrowersController::class, 'delete'])->name('borrow-requests.delete');
        Route::post('/send-message', [BorrowersController::class, 'sendMessage'])->name('send-message');
    });

    // Player Status Management
    Route::post('/player/update-status', [PlayerController::class, 'updateStatus'])->name('player.updateStatus');
    Route::post('/player/send-message', [PlayerController::class, 'sendMessage'])->name('player.sendMessage');

    // Event Registration Count (for dashboard)
    Route::get('/events/{event}/registrations/count', [EventRegistrationController::class, 'getRegistrationCount'])->name('events.registrations.count');
    
    // Add registered players/teams as participants
    Route::post('/events/{event}/add-participants', [EventRegistrationController::class, 'addAsParticipants'])->name('events.addParticipants');

    // MIS - Athlete Management Routes
    Route::prefix('mis')->name('mis.')->group(function () {
        Route::get('/dashboard', [AthleteController::class, 'index'])->name('dashboard');
        Route::get('/athletes/create', [AthleteController::class, 'create'])->name('athletes.create');
        Route::post('/athletes', [AthleteController::class, 'store'])->name('athletes.store');
        Route::get('/athletes/{id}', [AthleteController::class, 'show'])->name('athletes.show');
        Route::get('/athletes/{id}/edit', [AthleteController::class, 'edit'])->name('athletes.edit');
        Route::put('/athletes/{id}', [AthleteController::class, 'update'])->name('athletes.update');
        Route::delete('/athletes/{id}', [AthleteController::class, 'destroy'])->name('athletes.destroy');
        Route::get('/export/csv', [AthleteController::class, 'exportCsv'])->name('export.csv');
    });

    // Tournament Bracket Management (API-style routes)
    Route::prefix('api')->group(function () {
        Route::post('/bracket/generate', [TournamentController::class, 'generateBracket'])->name('api.bracket.generate');
        Route::post('/bracket/store', [TournamentController::class, 'storeBracket'])->name('api.bracket.store');
        Route::get('/bracket/{eventId}', [TournamentController::class, 'getBracket'])->name('api.bracket.get');
        Route::put('/bracket/match/{matchId}', [TournamentController::class, 'updateMatchResult'])->name('api.bracket.updateMatch');
    });

    // User Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
