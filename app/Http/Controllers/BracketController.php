<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Bracket;
use App\Models\Event;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BracketController extends Controller
{
    // Single elimination bracket
    public function single($teams)
    {
        $teams = (int) $teams;

        // Dynamically load the correct JSX component
        return Inertia::render("Bracket/SingleEliminationBracket/Bracket{$teams}", [
            'teams' => $teams,
        ]);
    }

    // Double elimination bracket
    public function double($teams)
    {
        $teams = (int) $teams;

        // Dynamically load the correct JSX component
        return Inertia::render("Bracket/DoubleEliminationBracket/Bracket{$teams}/Bracket", [
            'teams' => $teams,
        ]);
    }
    public function create()
    {
        return Inertia::render('Bracket/CreateBracket', [
            'events' => Event::all(),
        ]);
    }





    public function save(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'matches' => 'required|array',
            'champion' => 'nullable|string',
        ]);

        Bracket::create([
            'event_id' => $request->event_id,
            'matches' => json_encode($request->matches),
            'champion' => $request->champion,
        ]);

        return redirect()->back()->with('success', 'Bracket saved successfully!');
    }


    public function ShowBracket($eventId)
    {
        $event = Event::with('bracket')->findOrFail($eventId);

        // Get team count and bracket type
        $teamCount   = $event->teams ?? 8;
        $bracketType = $event->bracket_type ?? 'DoubleElimination';

        // Normalize and map folder names
        $bracketMap = [
            'single' => 'SingleElimination',
            'double' => 'DoubleElimination',
        ];

        $normalizedType = strtolower($bracketType);
        $bracketFolder = $bracketMap[$normalizedType] ?? 'DoubleElimination';

        // Build correct path
        $pagePath = "Bracket/{$bracketFolder}Bracket/Bracket{$teamCount}/ShowBracket";

        $bracket = $event->bracket;

        return Inertia::render($pagePath, [
            'eventId'     => $eventId,
            'teamCount'   => $teamCount,
            'matches'     => $bracket?->matches ?? [],
            'champion'    => $bracket?->champion ?? null,
            'bracketType' => $bracketFolder,
        ]);
    }

    public function ShowStanding($eventId)
    {
        $event = Event::with('bracket')->findOrFail($eventId);

        // Get team count and bracket type
        $teamCount   = $event->teams ?? 8;
        $bracketType = $event->bracket_type ?? 'DoubleElimination';

        // Normalize and map folder names
        $bracketMap = [
            'single' => 'SingleElimination',
            'double' => 'DoubleElimination',
        ];

        $normalizedType = strtolower($bracketType);
        $bracketFolder = $bracketMap[$normalizedType] ?? 'DoubleElimination';

        // Build correct path
        $pagePath = "Bracket/{$bracketFolder}Bracket/Bracket{$teamCount}/ShowStanding";

        $bracket = $event->bracket;

        return Inertia::render($pagePath, [
            'eventId'     => $eventId,
            'teamCount'   => $teamCount,
            'matches'     => $bracket?->matches ?? [],
            'champion'    => $bracket?->champion ?? null,
            'bracketType' => $bracketFolder,
        ]);
    }











    public function storeBracketSettings(Request $request, $eventId)
    {
        $validated = $request->validate([
            'bracket_type' => 'required|in:single,double',
            'teams' => 'required|integer|min:2|max:8',
            'reset' => 'sometimes|boolean'
        ]);

        $event = Event::findOrFail($eventId);

        // If reset is true, delete existing bracket data
        if ($request->boolean('reset')) {
            // Delete any existing bracket data for this event
            if ($event->bracket) {
                $event->bracket->delete();
            }
        }

        // Update the event with new bracket settings
        $event->update([
            'bracket_type' => $validated['bracket_type'],
            'teams' => $validated['teams'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bracket settings updated successfully'
        ]);
    }
}
