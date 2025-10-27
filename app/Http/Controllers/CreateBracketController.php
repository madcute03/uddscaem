<?php
// app/Http/Controllers/BracketController.php
namespace App\Http\Controllers;

use App\Models\Event;
use Inertia\Inertia;

class CreateBracketController extends Controller
{
    public function bracket()
    {
        $events = Event::with('tournaments')->orderBy('event_date')->get();

        return Inertia::render('CreateBracket', [
            'events' => $events,
        ]);
    }
}

