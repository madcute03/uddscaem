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

    // Store registration (handles both individual and team)
    public function store(Request $request, Event $event)
    {
        if ($event->registration_type === 'team') {
            // Team registration validation
            $validated = $request->validate(
                [
                    'team_name' => [
                        'required',
                        'string',
                        'max:255',
                        \Illuminate\Validation\Rule::unique('registered_players', 'team_name')->where(function ($query) use ($event) {
                            return $query->where('event_id', $event->id);
                        })
                    ],
                    'team_members' => 'required|array|min:2|max:50',
                    'team_members.*.student_id' => [
                        'required',
                        'string',
                        'max:255',
                        \Illuminate\Validation\Rule::unique('registered_players', 'student_id')->where(function ($query) use ($event) {
                            return $query->where('event_id', $event->id);
                        })
                    ],
                    'team_members.*.name' => 'required|string|max:255',
                    'team_members.*.email' => [
                        'required',
                        'email',
                        \Illuminate\Validation\Rule::unique('registered_players', 'email')->where(function ($query) use ($event) {
                            return $query->where('event_id', $event->id);
                        })
                    ],
                    'team_members.*.department' => 'required|string|max:255',
                    'team_members.*.age' => 'required|integer',
                    'team_members.*.gdrive_link' => 'required|url',
                ],
                [
                    'team_members.required' => 'At least 2 team members are required.',
                    'team_members.min' => 'At least 2 team members are required.',
                    'team_members.max' => 'Maximum 50 team members allowed.',
                    'team_members.*.email.unique' => 'This email is already registered for this event.',
                    'team_members.*.student_id.unique' => 'This student ID is already registered for this event.',
                    'team_members.*.gdrive_link.url' => 'Please enter a valid Google Drive link.',
                    'team_name.unique' => 'This team name is already taken for this event.',
                ]
            );

            // Validate team size matches event requirement
            if (count($validated['team_members']) !== $event->team_size) {
                return back()->withErrors([
                    'team_members' => "Team must have exactly {$event->team_size} members."
                ]);
            }

            // Create team registration
            DB::transaction(function () use ($event, $validated) {
                foreach ($validated['team_members'] as $member) {
                    RegisteredPlayer::create([
                        'event_id' => $event->id,
                        'student_id' => $member['student_id'],
                        'name' => $member['name'],
                        'email' => $member['email'],
                        'department' => $member['department'],
                        'age' => $member['age'],
                        'gdrive_link' => $member['gdrive_link'],
                        'team_name' => $validated['team_name'],
                        'status' => 'pending',
                        'registered_at' => now(),
                    ]);
                }
            });

            return redirect()
                ->route('events.show', $event->id)
                ->with('success', 'Team registration successful!');

        } else {
            // Individual registration validation
            $validated = $request->validate(
                [
                    'student_id' => [
                        'required',
                        'string',
                        'max:255',
                        \Illuminate\Validation\Rule::unique('registered_players', 'student_id')->where(function ($query) use ($event) {
                            return $query->where('event_id', $event->id);
                        })
                    ],
                    'name' => 'required|string|max:255',
                    'email' => [
                        'required',
                        'email',
                        \Illuminate\Validation\Rule::unique('registered_players', 'email')->where(function ($query) use ($event) {
                            return $query->where('event_id', $event->id);
                        })
                    ],
                    'department' => 'required|string|max:255',
                    'age' => 'required|integer',
                    'gdrive_link' => 'required|url',
                ],
                [
                    'email.unique' => 'This email is already registered for this event.',
                    'student_id.unique' => 'This student ID is already registered for this event.',
                    'gdrive_link.url' => 'Please enter a valid Google Drive link.',
                ]
            );

            // Create individual registration
            RegisteredPlayer::create([
                'event_id' => $event->id,
                'student_id' => $validated['student_id'],
                'name' => $validated['name'],
                'email' => $validated['email'],
                'department' => $validated['department'],
                'age' => $validated['age'],
                'gdrive_link' => $validated['gdrive_link'],
                'status' => 'pending',
                'registered_at' => now(),
            ]);

            return redirect()
                ->route('events.show', $event->id)
                ->with('success', '%registration successful!');
        }
    }


    // Show all registered players for an event
    public function showPlayers(Event $event)
    {
        // Get all registered players for this event
        $players = RegisteredPlayer::where('event_id', $event->id)->get();

        // Route to the appropriate component based on event type
        $component = $event->event_type === 'tryout' 
            ? 'Registrations/TryoutRegistrations' 
            : 'Registrations/CompetitionRegistrations';

        return Inertia::render($component, [
            'players' => $players,
            'event' => $event,
        ]);
    }

    // Get registration count for an event (for dashboard)
    public function getRegistrationCount(Event $event)
    {
        $count = RegisteredPlayer::where('event_id', $event->id)->count();
        $newCount = RegisteredPlayer::getNewRegistrationsCount($event->id, 24); // New registrations in last 24 hours

        return response()->json([
            'count' => $count,
            'new_count' => $newCount
        ]);
    }

    // Add registered player/team as participant to the event
    public function addAsParticipants(Request $request, Event $event)
    {
        $validated = $request->validate([
            'participant_name' => 'required|string|max:255'
        ]);

        $participantName = $validated['participant_name'];

        // Get current participants array
        $participants = $event->participants ?? [];

        // Check if participant already exists
        if (in_array($participantName, $participants)) {
            return back()->with('error', 'This participant is already added to the event.');
        }

        // Add the new participant
        $participants[] = $participantName;

        // Update the event
        $event->update(['participants' => $participants]);

        return back()->with('success', "Successfully added \"{$participantName}\" as a participant!");
    }

}
