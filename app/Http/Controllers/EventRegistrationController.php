<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\Request;
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
        $validated = $request->validate([
            'team_name' => 'nullable|string|max:255',
            'players.*.student_id' => 'required',
            'players.*.name' => 'required|string|max:255',
            'players.*.email' => 'required|email|ends_with:@cdd.edu.ph',
            'players.*.department' => 'required|string|max:255',
            'players.*.age' => 'required|integer',
            'players.*.gdrive_link' => 'required|url',
        ]);

        // Create event registration
        $registration = EventRegistration::create([
            'event_id' => $event->id,
            'team_name' => $request->team_name ?? $request->players[0]['name'],
        ]);

        foreach ($validated['players'] as $player) {
            // Reuse existing DB columns to store the link to avoid a migration right now
            $gdriveLink = $player['gdrive_link'];

            $registration->players()->create([
                'student_id' => $player['student_id'],
                'name' => $player['name'],
                'email' => $player['email'],
                'department' => $player['department'],
                'age' => $player['age'],
                'player_image' => $gdriveLink,
                'whiteform_image' => $gdriveLink,
            ]);
        }


        return redirect()->route('events.show', $event->id)
            ->with('success', 'Registration successful!');
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
}
