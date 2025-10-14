<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\RegisteredPlayer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class EventRegistrationController extends Controller
{
    // Show registration form
    public function create(Event $event)
    {
        return Inertia::render('RegisterEvent', [
            'event' => $event,
        ]);
    }

    // Store single player registration
    public function store(Request $request, Event $event)
    {
        // Validate input
        $validated = $request->validate(
            [
                'student_id' => 'required|string|max:255|unique:registered_players,student_id',
                'name' => 'required|string|max:255',
                'email' => 'required|email|ends_with:@cdd.edu.ph|unique:registered_players,email',
                'department' => 'required|string|max:255',
                'age' => 'required|integer',
                'gdrive_link' => 'required|url',
            ],
            [
                'email.unique' => 'This email is already registered.',
                'student_id.unique' => 'This student ID is already registered.',
                'email.ends_with' => 'Email must end with @cdd.edu.ph.',
                'gdrive_link.url' => 'Please enter a valid Google Drive link.',
            ]
        );

        // Create registered player record
        RegisteredPlayer::create([
            'event_id' => $event->id,
            'student_id' => $validated['student_id'],
            'name' => $validated['name'],
            'email' => $validated['email'],
            'department' => $validated['department'],
            'age' => $validated['age'],
            'gdrive_link' => $validated['gdrive_link'],
            'status' => 'pending', // or whatever default status you want
        ]);

        return redirect()
            ->route('events.show', $event->id)
            ->with('success', 'Registration successful!');
    }


    // Show all registered players for an event
    public function showPlayers(Event $event)
    {
        // Get all registered players for this event
        $players = RegisteredPlayer::where('event_id', $event->id)->get();

        return Inertia::render('Registrations/RegisteredPlayers', [
            'players' => $players,
            'event' => $event,
        ]);
    }

}
