<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\Request;
use App\Models\Player;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class EventRegistrationController extends Controller
{
    // Show registration form
    public function create(Event $event)
    {
        return Inertia::render('RegisterEvent', [
            'event' => $event,
            // Default to 1 if not configured to avoid empty form
            'requiredPlayers' => $event->required_players ?? 1,
        ]);
    }

    // Store registration
    public function store(Request $request, Event $event)
    {
        try {
            // Validate input
            $validated = $request->validate(
                [
                    'team_name' => 'nullable|string|max:255',
                    'players.*.student_id' => 'required|string|max:255|unique:players,student_id',
                    'players.*.name' => 'required|string|max:255',
                    'players.*.email' => 'required|email|ends_with:@cdd.edu.ph|unique:players,email',
                    'players.*.department' => 'required|string|max:255',
                    'players.*.age' => 'required|integer',
                    'players.*.gdrive_link' => 'required|url',
                ],
                [
                    'players.*.email.unique' => 'This email is already registered.',
                    'players.*.student_id.unique' => 'This student ID is already registered.',
                    'players.*.email.ends_with' => 'Email must end with @cdd.edu.ph.',
                    'players.*.gdrive_link.url' => 'Please enter a valid Google Drive link.',
                ]
            );

            // ✅ Create a new event registration
            $registration = EventRegistration::create([
                'event_id' => $event->id,
                // Use team name if given, otherwise use first player's name
                'team_name' => $request->team_name ?? $request->players[0]['name'],
            ]);

            // ✅ Loop through and save each player
            foreach ($validated['players'] as $player) {
                $registration->players()->create([
                    'student_id' => $player['student_id'],
                    'name' => $player['name'],
                    'email' => $player['email'],
                    'department' => $player['department'],
                    'age' => $player['age'],
                    'gdrive_link' => $player['gdrive_link'],
                ]);
            }

            // ✅ Redirect with success message
            return redirect()
                ->route('events.show', $event->id)
                ->with('success', 'Registration successful!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    // Show registered teams and players
    public function showTeamRegistrations(Event $event)
    {
        // Fetch registrations with players
        $registrations = EventRegistration::with('players')
            ->where('event_id', $event->id)
            ->get();

        // Count the number of teams for the frontend
        $teamsCount = $registrations->count();

        return Inertia::render('Registrations/RegisteredTeams', [
            'registrations' => $registrations,
            'event' => $event,
            'teams_count' => $teamsCount, // ✅ pass count explicitly
        ]);
    }

    // Get registration count for an event (for dashboard)
    public function getRegistrationCount(Event $event)
    {
        try {
            $count = \App\Models\RegisteredPlayer::where('event_id', $event->id)->count();

            return response()->json([
                'count' => $count
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting registration count: ' . $e->getMessage());
            return response()->json([
                'count' => 0,
                'error' => $e->getMessage()
            ], 200);
        }
    }
}