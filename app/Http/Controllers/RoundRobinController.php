<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Bracket;

class RoundRobinController extends Controller
{
    public function save(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'matches' => 'required|array',
            'champion' => 'nullable|string',
        ]);

        Bracket::updateOrCreate(
            ['event_id' => $request->event_id],
            [
                'matches' => $request->matches,
                'champion' => $request->champion,
            ]
        );

        return redirect()->back()->with('success', 'Round Robin saved successfully!');
    }

    public function show($eventId)
    {
        $bracket = Bracket::where('event_id', $eventId)->first();

        if (!$bracket) {
            return response()->json([
                'matches' => [],
                'champion' => null
            ]);
        }

        return response()->json([
            'matches' => $bracket->matches,
            'champion' => $bracket->champion
        ]);
    }
}


