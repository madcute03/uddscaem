<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function welcome()
    {
        // Select only necessary fields and load images
        $events = Event::select(
                'id',
                'title',
                'description',
                'coordinator_name',
                'event_date',
                'registration_end_date',
                'required_players'
            )
            ->with('images')
            ->orderBy('event_date')
            ->get();

        // Add teams_count for frontend to prevent '0' issues
        $events->transform(function ($event) {
            $event->teams_count = $event->registrations()->count();
            return $event;
        });

        return Inertia::render('Welcome', [
            'events' => $events,
        ]);
    }
}
