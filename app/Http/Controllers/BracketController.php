<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Bracket;
use App\Models\Event;   // <-- add this
use Illuminate\Support\Str; // ✅ Import this
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
        $event = Event::findOrFail($eventId);

        $event->bracket_type = $request->input('bracket_type');
        $event->teams = $request->input('teams');
        $event->save();

        return back()->with('success', 'Bracket settings saved!');
    }
}
