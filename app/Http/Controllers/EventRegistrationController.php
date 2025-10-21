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
                    'players' => 'required|array|min:1',
                    'players.*.student_id' => 'required|string|max:255|unique:players,student_id',
                    'players.*.name' => 'required|string|max:255',
                    'players.*.email' => 'required|email|ends_with:@cdd.edu.ph|unique:players,email',
                    'players.*.department' => 'required|string|max:255',
                    'players.*.age' => 'required|integer',
                    'players.*.gdrive_link' => 'required|url',
                ],
                [
                    'players.required' => 'At least one player is required.',
                    'players.array' => 'Invalid player data format.',
                    'players.min' => 'At least one player is required.',
                    'players.*.email.unique' => 'This email is already registered.',
                    'players.*.student_id.unique' => 'This student ID is already registered.',
                    'players.*.email.ends_with' => 'Email must end with @cdd.edu.ph.',
                    'players.*.gdrive_link.url' => 'Please enter a valid Google Drive link.',
                ]
            );

            // ✅ Safety check (should never happen due to validation, but just in case)
            if (empty($validated['players'])) {
                return back()->withErrors(['players' => 'At least one player is required.'])->withInput();
            }

            // ✅ Loop through and save each player directly to the event
            foreach ($validated['players'] as $player) {
                Player::create([
                    'event_id' => $event->id,
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
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Re-throw validation exceptions so they're handled properly by Laravel
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Registration error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Registration failed: ' . $e->getMessage()])->withInput();
        }
    }

    // Show registered players for an event
    public function showPlayers(Event $event)
    {
        // Fetch all players registered for this event
        $players = Player::where('event_id', $event->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Route to appropriate component based on event type
        if ($event->event_type === 'tryout') {
            return Inertia::render('Registrations/TryoutRegistrations', [
                'players' => $players,
                'event' => $event,
            ]);
        } else {
            // Competition events (both solo and team registrations)
            return Inertia::render('Registrations/CompetitionRegistrations', [
                'players' => $players,
                'event' => $event,
            ]);
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
            $count = Player::where('event_id', $event->id)->count();

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