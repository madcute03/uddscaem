<?php
// app/Http/Controllers/DoubleEliminationController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Bracket;

class DoubleEliminationController extends Controller
{
    // Save or update bracket
    public function save(Request $request)
{
    $request->validate([
        'event_id' => 'required|exists:events,id',
        'matches' => 'required|array',
        'champion' => 'nullable|string',
    ]);

    $bracket = Bracket::updateOrCreate(
        ['event_id' => $request->event_id],
        [
            'matches' => $request->matches,
            'champion' => $request->champion,
        ]
    );

    // ✅ Return an Inertia redirect or render
    return redirect()->back()->with('success', 'Bracket saved successfully!');
}
    // Fetch bracket by event
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
