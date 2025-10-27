<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tournament;
use App\Models\Team;
use App\Models\TournamentMatch;
use App\Models\Event;
use App\Models\RegisteredPlayer;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TournamentController extends Controller
{
    /**
     * Show the dynamic bracket creation page (Admin only)
     */
    public function showDynamicBracket($eventId)
    {
        // Check if user is admin
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized access. Only admins can create brackets.');
        }

        $event = Event::findOrFail($eventId);
        $registeredPlayers = RegisteredPlayer::where('event_id', $eventId)
            ->where('status', 'approved')
            ->get();

        return Inertia::render('DynamicBracket/CreateBracket', [
            'event' => $event,
            'registeredPlayers' => $registeredPlayers,
        ]);
    }

    /**
     * Show the generated bracket preview page (Admin only)
     */
    public function viewDynamicBracket($eventId)
    {
        // Check if user is admin
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized access. Only admins can view brackets.');
        }

        $event = Event::findOrFail($eventId);

        return Inertia::render('DynamicBracket/ViewBracket', [
            'event' => $event,
        ]);
    }

    /**
     * Show the bracket management page with scoring (Admin only)
     */
    public function manageBracket($eventId)
    {
        // Check if user is admin
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized access. Only admins can manage brackets.');
        }

        $event = Event::findOrFail($eventId);
        $tournament = $event->tournaments()
            ->with(['matches.team1', 'matches.team2', 'matches.winner', 'winner'])
            ->latest()
            ->first();

        if (!$tournament) {
            return redirect()->route('events.dynamicBracket', $eventId)
                ->with('error', 'No tournament found for this event. Please create one first.');
        }

        return Inertia::render('DynamicBracket/ManageBracket', [
            'event' => $event,
            'tournament' => $tournament,
        ]);
    }

    /**
     * Show the public view-only bracket page (Everyone can view)
     */
    public function publicViewBracket($eventId)
    {
        $event = Event::findOrFail($eventId);
        $tournament = $event->tournaments()
            ->with(['matches.team1', 'matches.team2', 'matches.winner', 'winner'])
            ->latest()
            ->first();

        if (!$tournament) {
            return redirect()->route('events.show', $eventId)
                ->with('error', 'No tournament bracket available for this event yet.');
        }

        return Inertia::render('DynamicBracket/PublicViewBracket', [
            'event' => $event,
            'tournament' => $tournament,
        ]);
    }
    /**
     * Generate bracket structure from selected teams
     */
    public function generateBracket(Request $request)
    {
        try {
            $request->validate([
                'event_id' => 'required|exists:events,id',
                'teams' => 'required|array|min:2',
                'teams.*.name' => 'required|string',
                'teams.*.members' => 'nullable|array',
                'bracket_type' => 'required|in:single,double,round-robin',
            ]);

            $teams = $request->teams;
            $bracketType = $request->bracket_type;
            $eventId = $request->event_id;

            // Generate bracket structure based on type
            if ($bracketType === 'single') {
                $bracket = $this->generateSingleEliminationBracket($teams, $eventId);
            } elseif ($bracketType === 'double') {
                $bracket = $this->generateDoubleEliminationBracket($teams, $eventId);
            } else {
                $bracket = $this->generateRoundRobinBracket($teams, $eventId);
            }

            return response()->json([
                'success' => true,
                'bracket' => $bracket,
                'message' => 'Bracket generated successfully',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error generating bracket: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Error generating bracket: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store the generated bracket to database
     */
    public function storeBracket(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'tournament_name' => 'required|string',
            'bracket_type' => 'required|in:single,double,round-robin',
            'teams' => 'required|array',
            'matches' => 'required|array',
        ]);

        DB::beginTransaction();

        try {
            // Create tournament
            $tournament = Tournament::create([
                'event_id' => $request->event_id,
                'name' => $request->tournament_name,
                'bracket_type' => $request->bracket_type,
                'total_rounds' => $request->total_rounds ?? null,
                'status' => 'active',
            ]);

            // Create teams
            $teamMap = [];
            foreach ($request->teams as $teamData) {
                $team = Team::create([
                    'event_id' => $request->event_id,
                    'name' => $teamData['name'],
                    'members' => $teamData['members'] ?? [],
                    'seed' => $teamData['seed'] ?? null,
                ]);
                $teamMap[$teamData['temp_id'] ?? $teamData['name']] = $team->id;
            }

            // Create matches with proper team IDs
            $matchMap = [];
            foreach ($request->matches as $matchData) {
                // Get team IDs, handling null/TBD cases
                $team1Id = null;
                if (isset($matchData['team1_temp_id']) && $matchData['team1_temp_id'] && isset($teamMap[$matchData['team1_temp_id']])) {
                    $team1Id = $teamMap[$matchData['team1_temp_id']];
                }
                
                $team2Id = null;
                if (isset($matchData['team2_temp_id']) && $matchData['team2_temp_id'] && isset($teamMap[$matchData['team2_temp_id']])) {
                    $team2Id = $teamMap[$matchData['team2_temp_id']];
                }
                
                $match = TournamentMatch::create([
                    'tournament_id' => $tournament->id,
                    'round' => $matchData['round'],
                    'match_number' => $matchData['match_number'],
                    'team1_id' => $team1Id,
                    'team2_id' => $team2Id,
                    'status' => 'pending',
                ]);
                $matchMap[$matchData['temp_id']] = $match->id;
            }

            // Update next_match_id references
            foreach ($request->matches as $matchData) {
                if (isset($matchData['next_match_temp_id']) && isset($matchMap[$matchData['next_match_temp_id']])) {
                    TournamentMatch::where('id', $matchMap[$matchData['temp_id']])
                        ->update(['next_match_id' => $matchMap[$matchData['next_match_temp_id']]]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'tournament' => $tournament->load(['matches.team1', 'matches.team2']),
                'message' => 'Bracket saved successfully',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error saving bracket: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get bracket data for an event
     */
    public function getBracket($eventId)
    {
        $tournament = Tournament::where('event_id', $eventId)
            ->with(['matches.team1', 'matches.team2', 'matches.winner'])
            ->latest()
            ->first();

        if (!$tournament) {
            return response()->json([
                'success' => false,
                'message' => 'No bracket found for this event',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'tournament' => $tournament,
        ]);
    }

    /**
     * Update match result
     */
    public function updateMatchResult(Request $request, $matchId)
    {
        $request->validate([
            'winner_id' => 'required|exists:teams,id',
            'team1_score' => 'nullable|integer',
            'team2_score' => 'nullable|integer',
        ]);

        $match = TournamentMatch::findOrFail($matchId);
        
        $match->update([
            'winner_id' => $request->winner_id,
            'team1_score' => $request->team1_score,
            'team2_score' => $request->team2_score,
            'status' => 'completed',
        ]);

        // If there's a next match, update it with the winner
        if ($match->next_match_id) {
            $nextMatch = TournamentMatch::find($match->next_match_id);
            if ($nextMatch) {
                // Place winner in the first empty slot (team1 or team2)
                if (!$nextMatch->team1_id) {
                    $nextMatch->update(['team1_id' => $request->winner_id]);
                } elseif (!$nextMatch->team2_id) {
                    $nextMatch->update(['team2_id' => $request->winner_id]);
                } else {
                    // Both slots filled - this shouldn't happen in a valid bracket
                    \Log::warning("Both team slots already filled in match {$nextMatch->id}");
                }
            }
        }

        return response()->json([
            'success' => true,
            'match' => $match->load(['team1', 'team2', 'winner']),
            'message' => 'Match result updated successfully',
        ]);
    }

    /**
     * Generate single elimination bracket structure (4-30 teams)
     * Uses standard tournament seeding with proper bye distribution
     */
    private function generateSingleEliminationBracket($teams, $eventId)
    {
        $teamCount = count($teams);
        $matches = [];
        
        // Prepare teams with temp IDs and seeds
        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }

        // Calculate bracket structure
        $nextPowerOf2 = pow(2, ceil(log($teamCount, 2)));
        $byeCount = $nextPowerOf2 - $teamCount;
        $secondRoundSize = $nextPowerOf2 / 2;
        
        // Calculate total rounds
        // Total rounds = log2(nextPowerOf2)
        // For 8 teams: log2(8) = 3 rounds
        // For 10 teams: log2(16) = 4 rounds
        $totalRounds = ceil(log($nextPowerOf2, 2));
        
        // Generate standard bracket pairings (1 vs N, 2 vs N-1, etc.)
        $initialPairings = $this->generateStandardPairings($nextPowerOf2);
        
        $roundNumber = 1;
        $currentRoundPairings = $initialPairings;
        $globalMatchNumber = 1; // Continuous match numbering across all rounds
        
        // FIRST ROUND (if there are byes)
        if ($byeCount > 0) {
            \Log::info('Building bracket with byes', [
                'teamCount' => $teamCount,
                'nextPowerOf2' => $nextPowerOf2,
                'byeCount' => $byeCount,
                'pairings' => $currentRoundPairings,
            ]);
            
            // Build second round structure first to know where R1 winners go
            $secondRoundSlots = [];
            
            foreach ($currentRoundPairings as $pairIndex => $pair) {
                $seed1 = $pair[0] - 1;
                $seed2 = $pair[1] - 1;
                
                \Log::info('Processing pairing', [
                    'pairIndex' => $pairIndex,
                    'seed1' => $seed1,
                    'seed2' => $seed2,
                    'seed1_exists' => $seed1 < $teamCount,
                    'seed2_exists' => $seed2 < $teamCount,
                ]);
                
                if ($seed1 < $teamCount && $seed2 < $teamCount) {
                    // Both exist - they play in R1
                    $secondRoundSlots[] = ['type' => 'r1_winner', 'r1_match' => null];
                } elseif ($seed1 < $teamCount) {
                    // Seed1 gets bye
                    $secondRoundSlots[] = ['type' => 'bye', 'team_index' => $seed1];
                } elseif ($seed2 < $teamCount) {
                    // Seed2 gets bye
                    $secondRoundSlots[] = ['type' => 'bye', 'team_index' => $seed2];
                } else {
                    // Neither exists
                    $secondRoundSlots[] = ['type' => 'empty'];
                }
            }
            
            \Log::info('Second round slots', ['slots' => $secondRoundSlots]);
            
            // Create Round 1 matches
            $firstRoundMatches = [];
            $r1MatchIndex = 0;
            
            foreach ($currentRoundPairings as $pairIndex => $pair) {
                $seed1 = $pair[0] - 1;
                $seed2 = $pair[1] - 1;
                
                if ($seed1 < $teamCount && $seed2 < $teamCount) {
                    $r1MatchNum = $r1MatchIndex + 1;
                    
                    // Find which R2 slot this winner goes to
                    $r2SlotIndex = $pairIndex;
                    
                    $firstRoundMatches[] = [
                        'temp_id' => 'match_1_' . $r1MatchNum,
                        'round' => 1,
                        'match_number' => $r1MatchNum,
                        'team1_temp_id' => 'team_' . $seed1,
                        'team2_temp_id' => 'team_' . $seed2,
                        'team1_name' => $teams[$seed1]['name'],
                        'team2_name' => $teams[$seed2]['name'],
                        'next_match_temp_id' => null, // Will be set after R2 matches are created
                        'r2_slot_index' => $r2SlotIndex,
                    ];
                    
                    // Mark which R1 match feeds this R2 slot
                    $secondRoundSlots[$pairIndex]['r1_match'] = $r1MatchNum;
                    $r1MatchIndex++;
                    $globalMatchNumber++;
                }
            }
            
            $matches = array_merge($matches, $firstRoundMatches);
            
            // SECOND ROUND - Create matches with specific ordering
            // For 10 teams: Match 3 (AYSON vs q), Match 4 (BRAVO vs w), Match 5 (RAE vs R1W1), Match 6 (BELLE vs R1W2)
            $secondRoundMatches = [];
            $numSecondRoundMatches = count($secondRoundSlots) / 2;
            $r2MatchToSlotMap = []; // Map slot index to R2 match number
            
            // Process slots in pairs to create matches
            for ($i = 0; $i < $numSecondRoundMatches; $i++) {
                $slot1 = $secondRoundSlots[$i * 2];
                $slot2 = $secondRoundSlots[$i * 2 + 1];
                
                $team1_temp_id = null;
                $team1_name = 'TBD';
                $team2_temp_id = null;
                $team2_name = 'TBD';
                
                // Set team1 from slot1
                if ($slot1['type'] === 'bye') {
                    $team1_temp_id = 'team_' . $slot1['team_index'];
                    $team1_name = $teams[$slot1['team_index']]['name'];
                }
                
                // Set team2 from slot2
                if ($slot2['type'] === 'bye') {
                    $team2_temp_id = 'team_' . $slot2['team_index'];
                    $team2_name = $teams[$slot2['team_index']]['name'];
                }
                
                $r2MatchNum = $globalMatchNumber;
                $r2MatchToSlotMap[$i * 2] = $r2MatchNum;
                $r2MatchToSlotMap[$i * 2 + 1] = $r2MatchNum;
                
                // Calculate next round match number
                $nextRoundMatchNum = count($firstRoundMatches) + $numSecondRoundMatches + 1 + floor($i / 2);
                
                $secondRoundMatches[] = [
                    'temp_id' => 'match_2_' . $r2MatchNum,
                    'round' => 2,
                    'match_number' => $r2MatchNum,
                    'team1_temp_id' => $team1_temp_id,
                    'team2_temp_id' => $team2_temp_id,
                    'team1_name' => $team1_name,
                    'team2_name' => $team2_name,
                    'next_match_temp_id' => 'match_3_' . $nextRoundMatchNum,
                ];
                
                $globalMatchNumber++;
            }
            
            // Update R1 matches with correct next_match_temp_id
            foreach ($matches as &$match) {
                if ($match['round'] == 1 && isset($match['r2_slot_index'])) {
                    $slotIndex = $match['r2_slot_index'];
                    if (isset($r2MatchToSlotMap[$slotIndex])) {
                        $r2MatchNum = $r2MatchToSlotMap[$slotIndex];
                        $match['next_match_temp_id'] = 'match_2_' . $r2MatchNum;
                    }
                    unset($match['r2_slot_index']); // Clean up temp field
                }
            }
            
            $matches = array_merge($matches, $secondRoundMatches);
            $currentRoundSize = $numSecondRoundMatches;
            $roundNumber = 3;
        } else {
            // No byes - all teams play in first round
            $firstRoundMatches = [];
            $numR1Matches = count($currentRoundPairings);
            $r2StartMatch = $globalMatchNumber + $numR1Matches;
            
            foreach ($currentRoundPairings as $pairIndex => $pair) {
                $seed1 = $pair[0] - 1;
                $seed2 = $pair[1] - 1;
                
                // Calculate which Round 2 match this winner goes to
                // Matches pair up: 0,1 → 0; 2,3 → 1; etc.
                $r2MatchNum = $r2StartMatch + floor($pairIndex / 2);
                
                $firstRoundMatches[] = [
                    'temp_id' => 'match_1_' . $globalMatchNumber,
                    'round' => 1,
                    'match_number' => $globalMatchNumber,
                    'team1_temp_id' => 'team_' . $seed1,
                    'team2_temp_id' => 'team_' . $seed2,
                    'team1_name' => $teams[$seed1]['name'],
                    'team2_name' => $teams[$seed2]['name'],
                    'next_match_temp_id' => 'match_2_' . $r2MatchNum,
                ];
                
                $globalMatchNumber++;
            }
            $matches = $firstRoundMatches;
            $currentRoundSize = count($firstRoundMatches);
            $roundNumber = 2;
        }
        
        // Build remaining rounds with continuous match numbering
        while ($currentRoundSize > 1) {
            $nextRoundSize = $currentRoundSize / 2;
            $roundMatches = [];
            
            // Calculate the starting match number for the next round
            $nextRoundStartMatch = $globalMatchNumber + $nextRoundSize;
            
            for ($i = 0; $i < $nextRoundSize; $i++) {
                $currentMatchNum = $globalMatchNumber;
                
                // Calculate which match in the next round this match feeds into
                // Matches pair up: 0,1 → 0; 2,3 → 1; etc.
                $nextMatchNum = $nextRoundStartMatch + floor($i / 2);
                
                $roundMatches[] = [
                    'temp_id' => 'match_' . $roundNumber . '_' . $currentMatchNum,
                    'round' => $roundNumber,
                    'match_number' => $currentMatchNum,
                    'team1_temp_id' => null,
                    'team2_temp_id' => null,
                    'team1_name' => 'TBD',
                    'team2_name' => 'TBD',
                    'next_match_temp_id' => $nextRoundSize > 1 ? 'match_' . ($roundNumber + 1) . '_' . $nextMatchNum : null,
                ];
                
                $globalMatchNumber++;
            }
            
            $matches = array_merge($matches, $roundMatches);
            $currentRoundSize = $nextRoundSize;
            $roundNumber++;
        }

        // Debug logging
        \Log::info('Generated bracket for ' . $teamCount . ' teams', [
            'total_matches' => count($matches),
            'total_rounds' => $totalRounds,
            'matches_by_round' => array_count_values(array_column($matches, 'round')),
            'first_match' => $matches[0] ?? null,
        ]);

        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => $totalRounds,
        ];
    }
    
    /**
     * Generate standard tournament pairings for a bracket size
     * Returns array of [seed1, seed2] pairs
     * Example for 8: [[1,8], [4,5], [2,7], [3,6]]
     * Example for 16: [[1,16], [8,9], [5,12], [4,13], [3,14], [6,11], [7,10], [2,15]]
     */
    private function generateStandardPairings($bracketSize)
    {
        // Generate standard tournament bracket pairings
        // For 8: [[1,8], [4,5], [2,7], [3,6]]
        // For 16: [[1,16], [8,9], [5,12], [4,13], [3,14], [6,11], [7,10], [2,15]]
        
        // Hardcoded patterns for common bracket sizes
        $patterns = [
            4 => [[1,4], [2,3]],
            8 => [[1,8], [4,5], [2,7], [3,6]],
            16 => [[1,16], [8,9], [5,12], [4,13], [3,14], [6,11], [7,10], [2,15]],
            32 => [[1,32], [16,17], [9,24], [8,25], [5,28], [12,21], [13,20], [4,29], 
                   [3,30], [14,19], [11,22], [6,27], [7,26], [10,23], [15,18], [2,31]],
        ];
        
        if (isset($patterns[$bracketSize])) {
            return $patterns[$bracketSize];
        }
        
        // Fallback: generate simple pairings
        $pairings = [];
        for ($i = 1; $i <= $bracketSize / 2; $i++) {
            $pairings[] = [$i, $bracketSize - $i + 1];
        }
        return $pairings;
    }

    /**
     * Generate Challonge-style pairings
     * Returns array of [seed1, seed2] pairs
     * For 16 teams: [[1,16], [8,9], [5,12], [4,13], [3,14], [6,11], [7,10], [2,15]]
     */
    private function generateChallongePairings($bracketSize)
    {
        $rounds = log($bracketSize, 2);
        $pairings = [[1, $bracketSize]];
        
        for ($round = 1; $round < $rounds; $round++) {
            $newPairings = [];
            foreach ($pairings as $pair) {
                $sum = $pair[0] + $pair[1];
                $newPairings[] = [$pair[0], $sum - $pair[0]];
                $newPairings[] = [$sum - $pair[1], $pair[1]];
            }
            $pairings = $newPairings;
        }
        
        return $pairings;
    }

    private function generateDoubleEliminationBracket($teams, $eventId)
    {
        // Simplified double elimination - you can expand this
        $singleBracket = $this->generateSingleEliminationBracket($teams, $eventId);
        
        // Add losers bracket (simplified version)
        return array_merge($singleBracket, [
            'has_losers_bracket' => true,
            'message' => 'Double elimination bracket generated (winners bracket shown)',
        ]);
    }

    /**
     * Generate round robin bracket structure
     */
    private function generateRoundRobinBracket($teams, $eventId)
    {
        $teamCount = count($teams);
        $matches = [];
        $matchCounter = 1;

        // Generate all possible matchups
        for ($i = 0; $i < $teamCount; $i++) {
            for ($j = $i + 1; $j < $teamCount; $j++) {
                $matches[] = [
                    'temp_id' => 'match_1_' . $matchCounter,
                    'round' => 1,
                    'match_number' => $matchCounter,
                    'team1_temp_id' => 'team_' . $i,
                    'team2_temp_id' => 'team_' . $j,
                    'team1_name' => $teams[$i]['name'],
                    'team2_name' => $teams[$j]['name'],
                    'next_match_temp_id' => null,
                ];
                $matchCounter++;
            }
        }

        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }

        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 1,
            'is_round_robin' => true,
        ];
    }
}
