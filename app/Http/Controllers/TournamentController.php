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
                'winners_rounds' => $request->winners_rounds ?? null,
                'losers_rounds' => $request->losers_rounds ?? null,
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
                    'bracket' => $matchData['bracket'] ?? null,
                    'team1_id' => $team1Id,
                    'team2_id' => $team2Id,
                    'status' => 'pending',
                ]);
                $matchMap[$matchData['temp_id']] = $match->id;
            }

            // Update next_match_id and loser_to references
            foreach ($request->matches as $matchData) {
                $updates = [];
                
                if (isset($matchData['next_match_temp_id']) && isset($matchMap[$matchData['next_match_temp_id']])) {
                    $updates['next_match_id'] = $matchMap[$matchData['next_match_temp_id']];
                }
                
                if (isset($matchData['loser_to']) && isset($matchMap[$matchData['loser_to']])) {
                    $updates['loser_to'] = $matchMap[$matchData['loser_to']];
                }
                
                if (!empty($updates)) {
                    TournamentMatch::where('id', $matchMap[$matchData['temp_id']])->update($updates);
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
        
        // Prevent updating already completed matches (double-click protection)
        if ($match->status === 'completed' && $match->winner_id) {
            return response()->json([
                'success' => true,
                'match' => $match->load(['team1', 'team2', 'winner']),
                'message' => 'Match already completed',
            ]);
        }
        
        // Determine loser
        $loserId = null;
        if ($match->team1_id && $match->team2_id) {
            $loserId = ($request->winner_id == $match->team1_id) ? $match->team2_id : $match->team1_id;
        }
        
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
                // Only place winner if they're not already in the next match
                $winnerAlreadyInMatch = ($nextMatch->team1_id == $request->winner_id || $nextMatch->team2_id == $request->winner_id);
                
                if (!$winnerAlreadyInMatch) {
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
        }
        
        // If there's a loser_to match (double elimination), send loser there
        if ($match->loser_to && $loserId) {
            $loserMatch = TournamentMatch::find($match->loser_to);
            if ($loserMatch) {
                // Only place loser if they're not already in the loser match
                $loserAlreadyInMatch = ($loserMatch->team1_id == $loserId || $loserMatch->team2_id == $loserId);
                
                if (!$loserAlreadyInMatch) {
                    // Place loser in the first empty slot
                    if (!$loserMatch->team1_id) {
                        $loserMatch->update(['team1_id' => $loserId]);
                    } elseif (!$loserMatch->team2_id) {
                        $loserMatch->update(['team2_id' => $loserId]);
                    } else {
                        \Log::warning("Both team slots already filled in loser match {$loserMatch->id}");
                    }
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
            // Build second round structure first to know where R1 winners go
            $secondRoundSlots = [];
            
            foreach ($currentRoundPairings as $pairIndex => $pair) {
                $seed1 = $pair[0] - 1;
                $seed2 = $pair[1] - 1;
                
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
                    // For 11 teams: special routing to fix Match 2->M6, Match 3->M7
                    if ($teamCount == 11) {
                        // Slot 1 (Match 1) -> Match 4
                        // Slot 5 (Match 2) -> Match 6
                        // Slot 6 (Match 3) -> Match 7
                        $slotToR2Match = [
                            1 => 4,  // Match 1 -> Match 4
                            5 => 6,  // Match 2 -> Match 6
                            6 => 7,  // Match 3 -> Match 7
                        ];
                        if (isset($slotToR2Match[$slotIndex])) {
                            $r2MatchNum = $slotToR2Match[$slotIndex];
                            $match['next_match_temp_id'] = 'match_2_' . $r2MatchNum;
                        }
                    } elseif (isset($r2MatchToSlotMap[$slotIndex])) {
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

        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => $totalRounds,
        ];
    }

    private function generate13TeamDoubleElimination($teams, $eventId)
    {
        // Hardcoded 13-team double elimination structure (24 matches total)
        // Structure: WR1(5) + WR2(4) + WR3(2) + WR4(1) + LR1(1) + LR2(4) + LR3(2) + LR4(2) + LR5(1) + LR6(1) + GF(1) = 24

        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }

        $matches = [];

        // Winners Round 1 - Matches 1-5
        $matches[] = ['temp_id' => 'WR1_M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
            'team1_temp_id' => 'team_7', 'team2_temp_id' => 'team_8',
            'team1_name' => $teams[7]['name'], 'team2_name' => $teams[8]['name'],
            'next_match_temp_id' => 'WR2_M1', 'loser_to' => 'LR2_M4'];

        $matches[] = ['temp_id' => 'WR1_M2', 'round' => 1, 'match_number' => 2, 'bracket' => 'winners',
            'team1_temp_id' => 'team_6', 'team2_temp_id' => 'team_9',
            'team1_name' => $teams[6]['name'], 'team2_name' => $teams[9]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M1'];

        $matches[] = ['temp_id' => 'WR1_M3', 'round' => 1, 'match_number' => 3, 'bracket' => 'winners',
            'team1_temp_id' => 'team_5', 'team2_temp_id' => 'team_10',
            'team1_name' => $teams[5]['name'], 'team2_name' => $teams[10]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M1'];

        $matches[] = ['temp_id' => 'WR1_M4', 'round' => 1, 'match_number' => 4, 'bracket' => 'winners',
            'team1_temp_id' => 'team_4', 'team2_temp_id' => 'team_11',
            'team1_name' => $teams[4]['name'], 'team2_name' => $teams[11]['name'],
            'next_match_temp_id' => 'WR2_M3', 'loser_to' => 'LR2_M2'];

        $matches[] = ['temp_id' => 'WR1_M5', 'round' => 1, 'match_number' => 5, 'bracket' => 'winners',
            'team1_temp_id' => 'team_3', 'team2_temp_id' => 'team_12',
            'team1_name' => $teams[3]['name'], 'team2_name' => $teams[12]['name'],
            'next_match_temp_id' => 'WR2_M4', 'loser_to' => 'LR2_M1'];

        // Winners Round 2 - Matches 7-10 (top three seeds enter)
        $matches[] = ['temp_id' => 'WR2_M1', 'round' => 2, 'match_number' => 7, 'bracket' => 'winners',
            'team1_temp_id' => 'team_0', 'team2_temp_id' => null,
            'team1_name' => $teams[0]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M1'];

        $matches[] = ['temp_id' => 'WR2_M2', 'round' => 2, 'match_number' => 8, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M2'];

        $matches[] = ['temp_id' => 'WR2_M3', 'round' => 2, 'match_number' => 9, 'bracket' => 'winners',
            'team1_temp_id' => 'team_1', 'team2_temp_id' => null,
            'team1_name' => $teams[1]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR2_M3'];

        $matches[] = ['temp_id' => 'WR2_M4', 'round' => 2, 'match_number' => 10, 'bracket' => 'winners',
            'team1_temp_id' => 'team_2', 'team2_temp_id' => null,
            'team1_name' => $teams[2]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR2_M4'];

        // Losers Round 1 - Match 6 (Losers of Match 2 vs Match 3)
        $matches[] = ['temp_id' => 'LR1_M1', 'round' => 6, 'match_number' => 6, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M3', 'loser_to' => null];

        // Losers Round 2 - Matches 11-14
        $matches[] = ['temp_id' => 'LR2_M4', 'round' => 7, 'match_number' => 14, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M2', 'loser_to' => null];

        $matches[] = ['temp_id' => 'LR2_M3', 'round' => 7, 'match_number' => 13, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M2', 'loser_to' => null];

        $matches[] = ['temp_id' => 'LR2_M2', 'round' => 7, 'match_number' => 12, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null];

        $matches[] = ['temp_id' => 'LR2_M1', 'round' => 7, 'match_number' => 11, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null];

        // Losers Round 3 - Matches 15-16
        $matches[] = ['temp_id' => 'LR3_M1', 'round' => 8, 'match_number' => 15, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M2', 'loser_to' => null];

        $matches[] = ['temp_id' => 'LR3_M2', 'round' => 8, 'match_number' => 16, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M1', 'loser_to' => null];

        // Winners Round 3 - Matches 17-18
        $matches[] = ['temp_id' => 'WR3_M1', 'round' => 3, 'match_number' => 17, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR4_M1'];

        $matches[] = ['temp_id' => 'WR3_M2', 'round' => 3, 'match_number' => 18, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR4_M2'];

        // Losers Round 4 - Matches 19-20
        $matches[] = ['temp_id' => 'LR4_M1', 'round' => 9, 'match_number' => 19, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR5_M1', 'loser_to' => null];

        $matches[] = ['temp_id' => 'LR4_M2', 'round' => 9, 'match_number' => 20, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR5_M1', 'loser_to' => null];

        // Losers Round 5 - Match 21
        $matches[] = ['temp_id' => 'LR5_M1', 'round' => 10, 'match_number' => 21, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR6_M1', 'loser_to' => null];

        // Winners Round 4 - Match 22
        $matches[] = ['temp_id' => 'WR4_M1', 'round' => 4, 'match_number' => 22, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => 'LR6_M1'];

        // Losers Round 6 - Match 23
        $matches[] = ['temp_id' => 'LR6_M1', 'round' => 11, 'match_number' => 23, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => null];

        // Grand Finals - Match 24
        $matches[] = ['temp_id' => 'GF', 'round' => 12, 'match_number' => 24, 'bracket' => 'grand_finals',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => null, 'loser_to' => null];

        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 12,
            'bracket_type' => 'double',
            'winners_rounds' => 4,
            'losers_rounds' => 6,
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

    private function generate3TeamDoubleElimination($teams, $eventId)
    {
        // Structure: WR1(1) + WR2(1) + LR1(1) + GF(1) = 4 matches total
        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }

        // Assume teams are already seeded 1..3
        $matches = [];

        // Winners Round 1 - Match 1: Seed 2 vs Seed 3
        $matches[] = ['temp_id' => 'WR1_M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
            'team1_temp_id' => 'team_1', 'team2_temp_id' => 'team_2',
            'team1_name' => $teams[1]['name'], 'team2_name' => $teams[2]['name'],
            'next_match_temp_id' => 'WR2_M1', 'loser_to' => 'LR1_M1'];

        // Winners Round 2 - Match 2: Seed 1 (bye) vs Winner of Match 1
        $matches[] = ['temp_id' => 'WR2_M1', 'round' => 2, 'match_number' => 2, 'bracket' => 'winners',
            'team1_temp_id' => 'team_0', 'team2_temp_id' => null,
            'team1_name' => $teams[0]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => 'LR1_M1'];

        // Losers Round 1 - Match 3: Loser of Match 1 vs Loser of Match 2
        $matches[] = ['temp_id' => 'LR1_M1', 'round' => 3, 'match_number' => 3, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => null];

        // Grand Finals - Match 4
        $matches[] = ['temp_id' => 'GF', 'round' => 4, 'match_number' => 4, 'bracket' => 'grand_finals',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => null, 'loser_to' => null];

        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 4,
            'bracket_type' => 'double',
            'winners_rounds' => 2,
            'losers_rounds' => 1,
        ];
    }

    private function generate5TeamDoubleElimination($teams, $eventId)
    {
        // Hardcoded 5-team double elimination structure matching Challonge (8 matches total)
        // Based on reference: WR1(1) + WR2(2) + Semis(1) + LR1(1) + LR2(1) + LR3(1) + GF(1) + Reset(1) = 8
        
        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }
        
        $matches = [];
        
        // Winners Round 1 (1 match) - Match 1
        // Match 1: Seed 4 vs Seed 5 (QUITLONG vs Q in reference)
        $matches[] = ['temp_id' => 'WR1_M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
            'team1_temp_id' => 'team_3', 'team2_temp_id' => 'team_4', 
            'team1_name' => $teams[3]['name'], 'team2_name' => $teams[4]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M1'];
        
        // Winners Round 2 (2 matches) - Matches 2, 3
        // Match 2: Seed 2 (BRAVO) vs Seed 3 (BELLE)
        $matches[] = ['temp_id' => 'WR2_M1', 'round' => 2, 'match_number' => 2, 'bracket' => 'winners',
            'team1_temp_id' => 'team_1', 'team2_temp_id' => 'team_2', 
            'team1_name' => $teams[1]['name'], 'team2_name' => $teams[2]['name'],
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR1_M1'];
        
        // Match 3: Seed 1 (RAE) vs Winner of Match 1
        $matches[] = ['temp_id' => 'WR2_M2', 'round' => 2, 'match_number' => 3, 'bracket' => 'winners',
            'team1_temp_id' => 'team_0', 'team2_temp_id' => null, 
            'team1_name' => $teams[0]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M1'];
        
        // Losers Round 1 (1 match) - Match 4
        // Receives: Loser of WR1_M1 vs Loser of WR2_M1
        $matches[] = ['temp_id' => 'LR1_M1', 'round' => 4, 'match_number' => 4, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null, 
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M1', 'loser_to' => null];
        
        // Losers Round 2 (1 match) - Match 5
        // Receives: Winner of LR1_M1 vs Loser of WR2_M2
        $matches[] = ['temp_id' => 'LR2_M1', 'round' => 5, 'match_number' => 5, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null, 
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null];
        
        // Winners Round 3 (Semifinals) - Match 6
        $matches[] = ['temp_id' => 'WR3_M1', 'round' => 3, 'match_number' => 6, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null, 
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => 'LR3_M1'];
        
        // Losers Round 3 (Losers Finals) - Match 7
        // Receives: Winner of LR2_M1 vs Loser of WR3_M1 (Semifinals)
        $matches[] = ['temp_id' => 'LR3_M1', 'round' => 6, 'match_number' => 7, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null, 
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => null];
        
        // Grand Finals - Match 8
        $matches[] = ['temp_id' => 'GF', 'round' => 7, 'match_number' => 8, 'bracket' => 'grand_finals',
            'team1_temp_id' => null, 'team2_temp_id' => null, 
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => null, 'loser_to' => null];
        
        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 7,
            'bracket_type' => 'double',
            'winners_rounds' => 3,
            'losers_rounds' => 3,
        ];
    }

    private function generate6TeamDoubleElimination($teams, $eventId)
    {
        // Hardcoded 6-team double elimination structure matching Challonge (10 matches total)
        // Based on reference: WR1(2) + WR2(2) + LR1(2) + LR2(1) + LR3(1) + Semis(1) + GF(1) = 10
        
        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }
        
        $matches = [];
        
        // Winners Round 1 (2 matches) - Matches 1, 2  
        $matches[] = ['temp_id' => 'WR1_M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
            'team1_temp_id' => 'team_3', 'team2_temp_id' => 'team_4',
            'team1_name' => $teams[3]['name'], 'team2_name' => $teams[4]['name'],
            'next_match_temp_id' => 'WR2_M1', 'loser_to' => 'LR1_M1'];
        
        $matches[] = ['temp_id' => 'WR1_M2', 'round' => 1, 'match_number' => 2, 'bracket' => 'winners',
            'team1_temp_id' => 'team_2', 'team2_temp_id' => 'team_5',
            'team1_name' => $teams[2]['name'], 'team2_name' => $teams[5]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M1'];
        
        // Winners Round 2 (2 matches with byes) - Matches 3, 4
        $matches[] = ['temp_id' => 'WR2_M1', 'round' => 2, 'match_number' => 3, 'bracket' => 'winners',
            'team1_temp_id' => 'team_0', 'team2_temp_id' => null,
            'team1_name' => $teams[0]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR1_M2'];
        
        $matches[] = ['temp_id' => 'WR2_M2', 'round' => 2, 'match_number' => 4, 'bracket' => 'winners',
            'team1_temp_id' => 'team_1', 'team2_temp_id' => null,
            'team1_name' => $teams[1]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR1_M2'];
        
        // Losers Round 1 (2 matches) - Matches 5, 6
        // Match 5: WR1 loser vs WR2 loser
        $matches[] = ['temp_id' => 'LR1_M1', 'round' => 4, 'match_number' => 5, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M1', 'loser_to' => null];
        
        // Match 6: WR1 loser vs WR2 loser
        $matches[] = ['temp_id' => 'LR1_M2', 'round' => 4, 'match_number' => 6, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M1', 'loser_to' => null];
        
        // Losers Round 2 (1 match) - Match 7
        // Winners from both LR1 matches
        $matches[] = ['temp_id' => 'LR2_M1', 'round' => 5, 'match_number' => 7, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null];
        
        // Winners Round 3 (Semifinals) - Match 8
        $matches[] = ['temp_id' => 'WR3_M1', 'round' => 3, 'match_number' => 8, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => 'LR3_M1'];
        
        // Losers Round 3 (Losers Finals) - Match 9
        $matches[] = ['temp_id' => 'LR3_M1', 'round' => 6, 'match_number' => 9, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => null];
        
        // Grand Finals - Match 10
        $matches[] = ['temp_id' => 'GF', 'round' => 7, 'match_number' => 10, 'bracket' => 'grand_finals',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => null, 'loser_to' => null];
        
        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 8,
            'bracket_type' => 'double',
            'winners_rounds' => 3,
            'losers_rounds' => 3,
        ];
    }

    private function generate7TeamDoubleElimination($teams, $eventId)
    {
        // Hardcoded 7-team double elimination structure matching Challonge (12 matches total)
        // Based on reference: WR1(4) + WR2(2) + Semis(1) + LR1(1) + LR2(2) + LR3(1) + GF(1) = 12
        
        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }
        
        $matches = [];
        
        // Winners Round 1 (3 matches, 2 seeds each) - Matches 1, 2, 3
        $matches[] = ['temp_id' => 'WR1_M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
            'team1_temp_id' => 'team_6', 'team2_temp_id' => 'team_5',
            'team1_name' => $teams[6]['name'], 'team2_name' => $teams[5]['name'],
            'next_match_temp_id' => 'WR2_M1', 'loser_to' => 'LR2_M1'];
        
        $matches[] = ['temp_id' => 'WR1_M2', 'round' => 1, 'match_number' => 2, 'bracket' => 'winners',
            'team1_temp_id' => 'team_4', 'team2_temp_id' => 'team_3',
            'team1_name' => $teams[4]['name'], 'team2_name' => $teams[3]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M1'];
        
        $matches[] = ['temp_id' => 'WR1_M3', 'round' => 1, 'match_number' => 3, 'bracket' => 'winners',
            'team1_temp_id' => 'team_2', 'team2_temp_id' => 'team_1',
            'team1_name' => $teams[2]['name'], 'team2_name' => $teams[1]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M1'];
        
        // Losers Round 1 - Match 4
        $matches[] = ['temp_id' => 'LR1_M1', 'round' => 4, 'match_number' => 4, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M1', 'loser_to' => null];
        
        // Winners Round 2 - Matches 5, 6
        $matches[] = ['temp_id' => 'WR2_M1', 'round' => 2, 'match_number' => 5, 'bracket' => 'winners',
            'team1_temp_id' => 'team_0', 'team2_temp_id' => null,
            'team1_name' => $teams[0]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M2'];
        
        $matches[] = ['temp_id' => 'WR2_M2', 'round' => 2, 'match_number' => 6, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M2'];
        
        // Losers Round 2 - Matches 7, 8
        $matches[] = ['temp_id' => 'LR2_M1', 'round' => 5, 'match_number' => 7, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null];
        
        $matches[] = ['temp_id' => 'LR2_M2', 'round' => 5, 'match_number' => 8, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null];
        
        // Losers Round 3 - Match 9
        $matches[] = ['temp_id' => 'LR3_M1', 'round' => 6, 'match_number' => 9, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M1', 'loser_to' => null];
        
        // Winners Round 3 - Match 10
        $matches[] = ['temp_id' => 'WR3_M1', 'round' => 3, 'match_number' => 10, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => 'LR4_M1'];
        
        // Losers Round 4 - Match 11
        $matches[] = ['temp_id' => 'LR4_M1', 'round' => 7, 'match_number' => 11, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => null];
        
        // Grand Finals - Match 12
        $matches[] = ['temp_id' => 'GF', 'round' => 8, 'match_number' => 12, 'bracket' => 'grand_finals',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => null, 'loser_to' => null];
        
        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 8,
            'bracket_type' => 'double',
            'winners_rounds' => 3,
            'losers_rounds' => 4,
        ];
    }

    private function generate8TeamDoubleElimination($teams, $eventId)
    {
        // Hardcoded 8-team double elimination structure matching Challonge (14 matches total)
        // Based on reference: WR1(4) + WR2(2) + Semis(1) + LR1(2) + LR2(2) + LR3(1) + LR4(1) + GF(1) = 14
        
        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }
        
        $matches = [];
        
        // Winners Round 1 (4 matches) - Matches 1, 2, 3, 4
        $matches[] = ['temp_id' => 'WR1_M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
            'team1_temp_id' => 'team_0', 'team2_temp_id' => 'team_7', 'team1_name' => $teams[0]['name'], 'team2_name' => $teams[7]['name'],
            'next_match_temp_id' => 'WR2_M1', 'loser_to' => 'LR1_M1'];
        
        $matches[] = ['temp_id' => 'WR1_M2', 'round' => 1, 'match_number' => 2, 'bracket' => 'winners',
            'team1_temp_id' => 'team_3', 'team2_temp_id' => 'team_4', 'team1_name' => $teams[3]['name'], 'team2_name' => $teams[4]['name'],
            'next_match_temp_id' => 'WR2_M1', 'loser_to' => 'LR1_M1'];
        
        $matches[] = ['temp_id' => 'WR1_M3', 'round' => 1, 'match_number' => 3, 'bracket' => 'winners',
            'team1_temp_id' => 'team_1', 'team2_temp_id' => 'team_6', 'team1_name' => $teams[1]['name'], 'team2_name' => $teams[6]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M2'];
        
        $matches[] = ['temp_id' => 'WR1_M4', 'round' => 1, 'match_number' => 4, 'bracket' => 'winners',
            'team1_temp_id' => 'team_2', 'team2_temp_id' => 'team_5', 'team1_name' => $teams[2]['name'], 'team2_name' => $teams[5]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M2'];
        
        // Losers Round 1 (2 matches) - Matches 5, 6
        $matches[] = ['temp_id' => 'LR1_M1', 'round' => 4, 'match_number' => 5, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null, 'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M1', 'loser_to' => null];
        
        $matches[] = ['temp_id' => 'LR1_M2', 'round' => 4, 'match_number' => 6, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null, 'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M2', 'loser_to' => null];
        
        // Winners Round 2 (2 matches) - Matches 7, 8
        $matches[] = ['temp_id' => 'WR2_M1', 'round' => 2, 'match_number' => 7, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null, 'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M1'];
        
        $matches[] = ['temp_id' => 'WR2_M2', 'round' => 2, 'match_number' => 8, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null, 'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M2'];
        
        // Losers Round 2 (2 matches) - Matches 9, 10
        $matches[] = ['temp_id' => 'LR2_M1', 'round' => 5, 'match_number' => 9, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null, 'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null];
        
        $matches[] = ['temp_id' => 'LR2_M2', 'round' => 5, 'match_number' => 10, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null, 'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null];
        
        // Losers Round 3 (1 match) - Match 11
        $matches[] = ['temp_id' => 'LR3_M1', 'round' => 6, 'match_number' => 11, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null, 'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M1', 'loser_to' => null];
        
        // Winners Round 3 (Semifinals) - Match 12
        $matches[] = ['temp_id' => 'WR3_M1', 'round' => 3, 'match_number' => 12, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null, 'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => 'LR4_M1'];
        
        // Losers Round 4 (Losers Finals) - Match 13
        $matches[] = ['temp_id' => 'LR4_M1', 'round' => 7, 'match_number' => 13, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null, 'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => null];
        
        // Grand Finals - Match 14
        $matches[] = ['temp_id' => 'GF', 'round' => 8, 'match_number' => 14, 'bracket' => 'grand_finals',
            'team1_temp_id' => null, 'team2_temp_id' => null, 'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => null, 'loser_to' => null];
        
        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 8,
            'bracket_type' => 'double',
            'winners_rounds' => 3,
            'losers_rounds' => 4,
        ];
    }

    private function generate10TeamDoubleElimination($teams, $eventId)
    {
        // Hardcoded 10-team double elimination structure matching user specifications (18 matches total)
        // Based on: WR1(2) + WR2(4) + WR3(2) + WR4(1) + LR1(2) + LR2(2) + LR3(2) + LR4(1) + LR5(1) + GF(1) = 18
        
        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }
        
        $matches = [];

        // Winners Round 1 - Matches 1, 2 (2 seeds each)
        $matches[] = ['temp_id' => 'WR1_M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
            'team1_temp_id' => 'team_8', 'team2_temp_id' => 'team_9',
            'team1_name' => $teams[8]['name'], 'team2_name' => $teams[9]['name'],
            'next_match_temp_id' => 'WR2_M1', 'loser_to' => 'LR1_M1'];

        $matches[] = ['temp_id' => 'WR1_M2', 'round' => 1, 'match_number' => 2, 'bracket' => 'winners',
            'team1_temp_id' => 'team_6', 'team2_temp_id' => 'team_7',
            'team1_name' => $teams[6]['name'], 'team2_name' => $teams[7]['name'],
            'next_match_temp_id' => 'WR2_M3', 'loser_to' => 'LR1_M2'];

        // Winners Round 2 - Matches 3-6
        $matches[] = ['temp_id' => 'WR2_M1', 'round' => 2, 'match_number' => 3, 'bracket' => 'winners',
            'team1_temp_id' => 'team_0', 'team2_temp_id' => null,
            'team1_name' => $teams[0]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR1_M2'];

        $matches[] = ['temp_id' => 'WR2_M2', 'round' => 2, 'match_number' => 4, 'bracket' => 'winners',
            'team1_temp_id' => 'team_4', 'team2_temp_id' => 'team_5',
            'team1_name' => $teams[4]['name'], 'team2_name' => $teams[5]['name'],
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR1_M1'];

        $matches[] = ['temp_id' => 'WR2_M3', 'round' => 2, 'match_number' => 5, 'bracket' => 'winners',
            'team1_temp_id' => 'team_1', 'team2_temp_id' => null,
            'team1_name' => $teams[1]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR2_M2'];

        $matches[] = ['temp_id' => 'WR2_M4', 'round' => 2, 'match_number' => 6, 'bracket' => 'winners',
            'team1_temp_id' => 'team_2', 'team2_temp_id' => 'team_3',
            'team1_name' => $teams[2]['name'], 'team2_name' => $teams[3]['name'],
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR2_M1'];

        // Losers Round 1 - Matches 7, 8
        $matches[] = ['temp_id' => 'LR1_M1', 'round' => 4, 'match_number' => 7, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M1', 'loser_to' => null];

        $matches[] = ['temp_id' => 'LR1_M2', 'round' => 4, 'match_number' => 8, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M2', 'loser_to' => null];

        // Losers Round 2 - Matches 9, 10
        $matches[] = ['temp_id' => 'LR2_M1', 'round' => 5, 'match_number' => 9, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null];

        $matches[] = ['temp_id' => 'LR2_M2', 'round' => 5, 'match_number' => 10, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M2', 'loser_to' => null];

        // Winners Round 3 - Matches 11, 12
        $matches[] = ['temp_id' => 'WR3_M1', 'round' => 3, 'match_number' => 11, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR3_M1'];

        $matches[] = ['temp_id' => 'WR3_M2', 'round' => 3, 'match_number' => 12, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR3_M2'];

        // Losers Round 3 - Matches 13, 14
        $matches[] = ['temp_id' => 'LR3_M1', 'round' => 6, 'match_number' => 13, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M1', 'loser_to' => null];

        $matches[] = ['temp_id' => 'LR3_M2', 'round' => 6, 'match_number' => 14, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M1', 'loser_to' => null];

        // Losers Round 4 - Match 15
        $matches[] = ['temp_id' => 'LR4_M1', 'round' => 7, 'match_number' => 15, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR5_M1', 'loser_to' => null];

        // Winners Round 4 - Match 16
        $matches[] = ['temp_id' => 'WR4_M1', 'round' => 4, 'match_number' => 16, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => 'LR5_M1'];

        // Losers Round 5 - Match 17
        $matches[] = ['temp_id' => 'LR5_M1', 'round' => 8, 'match_number' => 17, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => null];

        // Grand Finals - Match 18
        $matches[] = ['temp_id' => 'GF', 'round' => 9, 'match_number' => 18, 'bracket' => 'grand_finals',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => null, 'loser_to' => null];
        
        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 9,
            'bracket_type' => 'double',
            'winners_rounds' => 4,
            'losers_rounds' => 5,
        ];
    }

    private function generate15TeamDoubleElimination($teams, $eventId)
    {
        // Hardcoded 15-team double elimination structure (28 matches total)
        // Structure: WR1(7) + WR2(4) + WR3(2) + WR4(1) + LR1(3) + LR2(4) + LR3(2) + LR4(2) + LR5(1) + LR6(1) + GF(1) = 28
        
        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }
        
        $matches = [];
        
        // Winners Round 1 - Matches 1-7
        $matches[] = ['temp_id' => 'WR1_M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
            'team1_temp_id' => 'team_7', 'team2_temp_id' => 'team_8',
            'team1_name' => $teams[7]['name'], 'team2_name' => $teams[8]['name'],
            'next_match_temp_id' => 'WR2_M1', 'loser_to' => 'LR2_M4'];
        
        $matches[] = ['temp_id' => 'WR1_M2', 'round' => 1, 'match_number' => 2, 'bracket' => 'winners',
            'team1_temp_id' => 'team_3', 'team2_temp_id' => 'team_12',
            'team1_name' => $teams[3]['name'], 'team2_name' => $teams[12]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M1'];
        
        $matches[] = ['temp_id' => 'WR1_M3', 'round' => 1, 'match_number' => 3, 'bracket' => 'winners',
            'team1_temp_id' => 'team_4', 'team2_temp_id' => 'team_11',
            'team1_name' => $teams[4]['name'], 'team2_name' => $teams[11]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M1'];
        
        $matches[] = ['temp_id' => 'WR1_M4', 'round' => 1, 'match_number' => 4, 'bracket' => 'winners',
            'team1_temp_id' => 'team_1', 'team2_temp_id' => 'team_14',
            'team1_name' => $teams[1]['name'], 'team2_name' => $teams[14]['name'],
            'next_match_temp_id' => 'WR2_M3', 'loser_to' => 'LR1_M2'];
        
        $matches[] = ['temp_id' => 'WR1_M5', 'round' => 1, 'match_number' => 5, 'bracket' => 'winners',
            'team1_temp_id' => 'team_6', 'team2_temp_id' => 'team_9',
            'team1_name' => $teams[6]['name'], 'team2_name' => $teams[9]['name'],
            'next_match_temp_id' => 'WR2_M3', 'loser_to' => 'LR1_M2'];
        
        $matches[] = ['temp_id' => 'WR1_M6', 'round' => 1, 'match_number' => 6, 'bracket' => 'winners',
            'team1_temp_id' => 'team_2', 'team2_temp_id' => 'team_13',
            'team1_name' => $teams[2]['name'], 'team2_name' => $teams[13]['name'],
            'next_match_temp_id' => 'WR2_M4', 'loser_to' => 'LR1_M3'];
        
        $matches[] = ['temp_id' => 'WR1_M7', 'round' => 1, 'match_number' => 7, 'bracket' => 'winners',
            'team1_temp_id' => 'team_5', 'team2_temp_id' => 'team_10',
            'team1_name' => $teams[5]['name'], 'team2_name' => $teams[10]['name'],
            'next_match_temp_id' => 'WR2_M4', 'loser_to' => 'LR1_M3'];
        
        // Losers Round 1 - Matches 8-10
        $matches[] = ['temp_id' => 'LR1_M1', 'round' => 4, 'match_number' => 8, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M3', 'loser_to' => null,
            'display_order' => 1];
        
        $matches[] = ['temp_id' => 'LR1_M2', 'round' => 4, 'match_number' => 9, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M2', 'loser_to' => null,
            'display_order' => 2];
        
        $matches[] = ['temp_id' => 'LR1_M3', 'round' => 4, 'match_number' => 10, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M1', 'loser_to' => null,
            'display_order' => 3];
        
        // Winners Round 2 - Matches 11-14
        $matches[] = ['temp_id' => 'WR2_M1', 'round' => 2, 'match_number' => 11, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => 'team_0',
            'team1_name' => 'TBD', 'team2_name' => $teams[0]['name'],
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M1'];
        
        $matches[] = ['temp_id' => 'WR2_M2', 'round' => 2, 'match_number' => 12, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M2'];
        
        $matches[] = ['temp_id' => 'WR2_M3', 'round' => 2, 'match_number' => 13, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR2_M3'];
        
        $matches[] = ['temp_id' => 'WR2_M4', 'round' => 2, 'match_number' => 14, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR2_M4'];
        
        // Losers Round 2 - Matches 15-18
        $matches[] = ['temp_id' => 'LR2_M1', 'round' => 5, 'match_number' => 15, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null,
            'display_order' => 1];
        
        $matches[] = ['temp_id' => 'LR2_M2', 'round' => 5, 'match_number' => 16, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null,
            'display_order' => 2];
        
        $matches[] = ['temp_id' => 'LR2_M3', 'round' => 5, 'match_number' => 17, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M2', 'loser_to' => null,
            'display_order' => 3];
        
        $matches[] = ['temp_id' => 'LR2_M4', 'round' => 5, 'match_number' => 18, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M2', 'loser_to' => null,
            'display_order' => 4];
        
        // Losers Round 3 - Matches 19-20
        $matches[] = ['temp_id' => 'LR3_M1', 'round' => 6, 'match_number' => 19, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M2', 'loser_to' => null,
            'display_order' => 1];
        
        $matches[] = ['temp_id' => 'LR3_M2', 'round' => 6, 'match_number' => 20, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M1', 'loser_to' => null,
            'display_order' => 2];
        
        // Winners Round 3 - Matches 21-22
        $matches[] = ['temp_id' => 'WR3_M1', 'round' => 3, 'match_number' => 21, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR4_M1'];
        
        $matches[] = ['temp_id' => 'WR3_M2', 'round' => 3, 'match_number' => 22, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR4_M2'];
        
        // Losers Round 4 - Matches 23-24
        $matches[] = ['temp_id' => 'LR4_M1', 'round' => 7, 'match_number' => 23, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR5_M1', 'loser_to' => null,
            'display_order' => 1];
        
        $matches[] = ['temp_id' => 'LR4_M2', 'round' => 7, 'match_number' => 24, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR5_M1', 'loser_to' => null,
            'display_order' => 2];
        
        // Losers Round 5 - Match 25
        $matches[] = ['temp_id' => 'LR5_M1', 'round' => 8, 'match_number' => 25, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR6_M1', 'loser_to' => null];
        
        // Winners Round 4 (Winners Final) - Match 26
        $matches[] = ['temp_id' => 'WR4_M1', 'round' => 4, 'match_number' => 26, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => 'LR6_M1'];
        
        // Losers Round 6 (Losers Final) - Match 27
        $matches[] = ['temp_id' => 'LR6_M1', 'round' => 9, 'match_number' => 27, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => null];
        
        // Grand Finals - Match 28
        $matches[] = ['temp_id' => 'GF', 'round' => 10, 'match_number' => 28, 'bracket' => 'grand_finals',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => null, 'loser_to' => null];
        
        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 10,
            'bracket_type' => 'double',
            'winners_rounds' => 4,
            'losers_rounds' => 6,
        ];
    }

    private function generate14TeamDoubleElimination($teams, $eventId)
    {
        // Hardcoded 14-team double elimination structure (26 matches total)
        // Structure: WR1(6) + WR2(4) + WR3(2) + WR4(1) + LR1(2) + LR2(4) + LR3(2) + LR4(2) + LR5(1) + LR6(1) + GF(1) = 26
        
        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }
        
        $matches = [];
        
        // Winners Round 1 - Matches 1-6 (2 seeds each)
        // M1 winner → M9, M2+M3 winners → M10, M4 winner → M11, M5+M6 winners → M12
        $matches[] = ['temp_id' => 'WR1_M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
            'team1_temp_id' => 'team_8', 'team2_temp_id' => 'team_9',
            'team1_name' => $teams[8]['name'], 'team2_name' => $teams[9]['name'],
            'next_match_temp_id' => 'WR2_M1', 'loser_to' => 'LR2_M1'];
        
        $matches[] = ['temp_id' => 'WR1_M2', 'round' => 1, 'match_number' => 2, 'bracket' => 'winners',
            'team1_temp_id' => 'team_7', 'team2_temp_id' => 'team_10',
            'team1_name' => $teams[7]['name'], 'team2_name' => $teams[10]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M1'];
        
        $matches[] = ['temp_id' => 'WR1_M3', 'round' => 1, 'match_number' => 3, 'bracket' => 'winners',
            'team1_temp_id' => 'team_6', 'team2_temp_id' => 'team_11',
            'team1_name' => $teams[6]['name'], 'team2_name' => $teams[11]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M1'];
        
        $matches[] = ['temp_id' => 'WR1_M4', 'round' => 1, 'match_number' => 4, 'bracket' => 'winners',
            'team1_temp_id' => 'team_5', 'team2_temp_id' => 'team_12',
            'team1_name' => $teams[5]['name'], 'team2_name' => $teams[12]['name'],
            'next_match_temp_id' => 'WR2_M3', 'loser_to' => 'LR2_M3'];
        
        $matches[] = ['temp_id' => 'WR1_M5', 'round' => 1, 'match_number' => 5, 'bracket' => 'winners',
            'team1_temp_id' => 'team_4', 'team2_temp_id' => 'team_13',
            'team1_name' => $teams[4]['name'], 'team2_name' => $teams[13]['name'],
            'next_match_temp_id' => 'WR2_M4', 'loser_to' => 'LR1_M2'];
        
        $matches[] = ['temp_id' => 'WR1_M6', 'round' => 1, 'match_number' => 6, 'bracket' => 'winners',
            'team1_temp_id' => 'team_2', 'team2_temp_id' => 'team_3',
            'team1_name' => $teams[2]['name'], 'team2_name' => $teams[3]['name'],
            'next_match_temp_id' => 'WR2_M4', 'loser_to' => 'LR1_M2'];
        
        // Losers Round 1 - Matches 7-8 (reordered: M7 first, then M8)
        // M7: Loser of M2 vs Loser of M3
        $matches[] = ['temp_id' => 'LR1_M1', 'round' => 4, 'match_number' => 7, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M2', 'loser_to' => null,
            'display_order' => 1];
        
        // M8: Loser of M5 vs Loser of M6
        $matches[] = ['temp_id' => 'LR1_M2', 'round' => 4, 'match_number' => 8, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M4', 'loser_to' => null,
            'display_order' => 2];
        
        // Winners Round 2 - Matches 9-12 (1 seed, TBD, 1 seed, TBD)
        // M9: Seed 1 vs TBD
        $matches[] = ['temp_id' => 'WR2_M1', 'round' => 2, 'match_number' => 9, 'bracket' => 'winners',
            'team1_temp_id' => 'team_0', 'team2_temp_id' => null,
            'team1_name' => $teams[0]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M4'];
        
        // M10: TBD vs TBD (winners from M1, M2, M3)
        $matches[] = ['temp_id' => 'WR2_M2', 'round' => 2, 'match_number' => 10, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M3'];
        
        // M11: Seed 2 vs TBD
        $matches[] = ['temp_id' => 'WR2_M3', 'round' => 2, 'match_number' => 11, 'bracket' => 'winners',
            'team1_temp_id' => 'team_1', 'team2_temp_id' => null,
            'team1_name' => $teams[1]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR2_M2'];
        
        // M12: TBD vs TBD (winners from M5, M6)
        $matches[] = ['temp_id' => 'WR2_M4', 'round' => 2, 'match_number' => 12, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR2_M1'];
        
        // Losers Round 2 - Matches 13-16
        // M13: Loser of M9 vs Winner of M4 (from WR1_M4)
        $matches[] = ['temp_id' => 'LR2_M4', 'round' => 5, 'match_number' => 13, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M2', 'loser_to' => null,
            'display_order' => 4];
        
        // M14: Loser of M10 vs Winner of M8
        $matches[] = ['temp_id' => 'LR2_M3', 'round' => 5, 'match_number' => 14, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M2', 'loser_to' => null,
            'display_order' => 3];
        
        // M15: Loser of M11 vs Winner of M7
        $matches[] = ['temp_id' => 'LR2_M2', 'round' => 5, 'match_number' => 15, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null,
            'display_order' => 2];
        
        // M16: Loser of M12 vs Loser of M1
        $matches[] = ['temp_id' => 'LR2_M1', 'round' => 5, 'match_number' => 16, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null,
            'display_order' => 1];
        
        // Losers Round 3 - Matches 17-18 (reordered: M18 first, then M17)
        $matches[] = ['temp_id' => 'LR3_M1', 'round' => 6, 'match_number' => 18, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M2', 'loser_to' => null,
            'display_order' => 1];
        
        $matches[] = ['temp_id' => 'LR3_M2', 'round' => 6, 'match_number' => 17, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M1', 'loser_to' => null,
            'display_order' => 2];
        
        // Winners Round 3 - Matches 19-20
        $matches[] = ['temp_id' => 'WR3_M1', 'round' => 3, 'match_number' => 19, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR4_M2'];
        
        $matches[] = ['temp_id' => 'WR3_M2', 'round' => 3, 'match_number' => 20, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR4_M1'];
        
        // Losers Round 4 - Matches 21-22
        // M21: Loser of M19 vs Winner of M18
        $matches[] = ['temp_id' => 'LR4_M2', 'round' => 7, 'match_number' => 21, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR5_M1', 'loser_to' => null];
        
        // M22: Loser of M20 vs Winner of M17
        $matches[] = ['temp_id' => 'LR4_M1', 'round' => 7, 'match_number' => 22, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR5_M1', 'loser_to' => null];
        
        // Losers Round 5 - Match 23
        $matches[] = ['temp_id' => 'LR5_M1', 'round' => 8, 'match_number' => 23, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR6_M1', 'loser_to' => null];
        
        // Winners Round 4 - Match 24
        $matches[] = ['temp_id' => 'WR4_M1', 'round' => 4, 'match_number' => 24, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => 'LR6_M1'];
        
        // Losers Round 6 - Match 25
        // M25: Loser of M24 vs Winner of M23
        $matches[] = ['temp_id' => 'LR6_M1', 'round' => 9, 'match_number' => 25, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => null];
        
        // Grand Finals - Match 26
        $matches[] = ['temp_id' => 'GF', 'round' => 10, 'match_number' => 26, 'bracket' => 'grand_finals',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => null, 'loser_to' => null];
        
        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 10,
            'bracket_type' => 'double',
            'winners_rounds' => 4,
            'losers_rounds' => 6,
        ];
    }

    private function generate12TeamDoubleElimination($teams, $eventId)
    {
        // Hardcoded 12-team double elimination structure (22 matches total)
        // Structure: WR1(4) + WR2(4) + WR3(2) + WR4(1) + LR1(4) + LR2(2) + LR3(2) + LR4(1) + LR5(1) + GF(1) = 22
        
        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }
        
        $matches = [];
        
        // Winners Round 1 - Matches 1-4
        $matches[] = ['temp_id' => 'WR1_M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
            'team1_temp_id' => 'team_7', 'team2_temp_id' => 'team_8',
            'team1_name' => $teams[7]['name'], 'team2_name' => $teams[8]['name'],
            'next_match_temp_id' => 'WR2_M1', 'loser_to' => 'LR1_M1'];
        
        $matches[] = ['temp_id' => 'WR1_M2', 'round' => 1, 'match_number' => 2, 'bracket' => 'winners',
            'team1_temp_id' => 'team_4', 'team2_temp_id' => 'team_11',
            'team1_name' => $teams[4]['name'], 'team2_name' => $teams[11]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M2'];
        
        $matches[] = ['temp_id' => 'WR1_M3', 'round' => 1, 'match_number' => 3, 'bracket' => 'winners',
            'team1_temp_id' => 'team_6', 'team2_temp_id' => 'team_9',
            'team1_name' => $teams[6]['name'], 'team2_name' => $teams[9]['name'],
            'next_match_temp_id' => 'WR2_M3', 'loser_to' => 'LR1_M3'];
        
        $matches[] = ['temp_id' => 'WR1_M4', 'round' => 1, 'match_number' => 4, 'bracket' => 'winners',
            'team1_temp_id' => 'team_5', 'team2_temp_id' => 'team_10',
            'team1_name' => $teams[5]['name'], 'team2_name' => $teams[10]['name'],
            'next_match_temp_id' => 'WR2_M4', 'loser_to' => 'LR1_M4'];
        
        // Winners Round 2 - Matches 5-8 (top four seeds enter)
        $matches[] = ['temp_id' => 'WR2_M1', 'round' => 2, 'match_number' => 5, 'bracket' => 'winners',
            'team1_temp_id' => 'team_0', 'team2_temp_id' => null,
            'team1_name' => $teams[0]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR1_M4'];
        
        $matches[] = ['temp_id' => 'WR2_M2', 'round' => 2, 'match_number' => 6, 'bracket' => 'winners',
            'team1_temp_id' => 'team_3', 'team2_temp_id' => null,
            'team1_name' => $teams[3]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR1_M3'];
        
        $matches[] = ['temp_id' => 'WR2_M3', 'round' => 2, 'match_number' => 7, 'bracket' => 'winners',
            'team1_temp_id' => 'team_1', 'team2_temp_id' => null,
            'team1_name' => $teams[1]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR1_M2'];
        
        $matches[] = ['temp_id' => 'WR2_M4', 'round' => 2, 'match_number' => 8, 'bracket' => 'winners',
            'team1_temp_id' => 'team_2', 'team2_temp_id' => null,
            'team1_name' => $teams[2]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR1_M1'];
        
        // Losers Round 1 - Matches 9-12
        $matches[] = ['temp_id' => 'LR1_M1', 'round' => 4, 'match_number' => 9, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M1', 'loser_to' => null];
        
        $matches[] = ['temp_id' => 'LR1_M2', 'round' => 4, 'match_number' => 10, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M1', 'loser_to' => null];
        
        $matches[] = ['temp_id' => 'LR1_M3', 'round' => 4, 'match_number' => 11, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M2', 'loser_to' => null];
        
        $matches[] = ['temp_id' => 'LR1_M4', 'round' => 4, 'match_number' => 12, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M2', 'loser_to' => null];
        
        // Losers Round 2 - Matches 13-14
        $matches[] = ['temp_id' => 'LR2_M1', 'round' => 5, 'match_number' => 13, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M2', 'loser_to' => null];
        
        $matches[] = ['temp_id' => 'LR2_M2', 'round' => 5, 'match_number' => 14, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null];
        
        // Winners Round 3 - Matches 15-16
        $matches[] = ['temp_id' => 'WR3_M1', 'round' => 3, 'match_number' => 15, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR3_M1'];
        
        $matches[] = ['temp_id' => 'WR3_M2', 'round' => 3, 'match_number' => 16, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR3_M2'];
        
        // Losers Round 3 - Matches 17-18
        $matches[] = ['temp_id' => 'LR3_M1', 'round' => 6, 'match_number' => 17, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M1', 'loser_to' => null,
            'display_order' => 1];
        
        $matches[] = ['temp_id' => 'LR3_M2', 'round' => 6, 'match_number' => 18, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M1', 'loser_to' => null,
            'display_order' => 2];
        
        // Losers Round 4 - Match 19
        $matches[] = ['temp_id' => 'LR4_M1', 'round' => 7, 'match_number' => 19, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR5_M1', 'loser_to' => null];
        
        // Winners Round 4 - Match 20
        $matches[] = ['temp_id' => 'WR4_M1', 'round' => 4, 'match_number' => 20, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => 'LR5_M1'];
        
        // Losers Round 5 - Match 21
        $matches[] = ['temp_id' => 'LR5_M1', 'round' => 8, 'match_number' => 21, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => null];
        
        // Grand Finals - Match 22
        $matches[] = ['temp_id' => 'GF', 'round' => 9, 'match_number' => 22, 'bracket' => 'grand_finals',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => null, 'loser_to' => null];
        
        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 9,
            'bracket_type' => 'double',
            'winners_rounds' => 4,
            'losers_rounds' => 5,
        ];
    }

    private function generate11TeamDoubleElimination($teams, $eventId)
    {
        // Hardcoded 11-team double elimination structure (20 matches total)
        // Structure: WR1(3) + WR2(4) + WR3(2) + WR4(1) + LR1(3) + LR2(2) + LR3(2) + LR4(1) + LR5(1) + GF(1)
        
        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }
        
        $matches = [];
        
        // Winners Round 1 - Matches 1-3
        $matches[] = ['temp_id' => 'WR1_M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
            'team1_temp_id' => 'team_8', 'team2_temp_id' => 'team_9',
            'team1_name' => $teams[8]['name'], 'team2_name' => $teams[9]['name'],
            'next_match_temp_id' => 'WR2_M1', 'loser_to' => 'LR1_M3'];
        
        $matches[] = ['temp_id' => 'WR1_M2', 'round' => 1, 'match_number' => 2, 'bracket' => 'winners',
            'team1_temp_id' => 'team_6', 'team2_temp_id' => 'team_7',
            'team1_name' => $teams[6]['name'], 'team2_name' => $teams[7]['name'],
            'next_match_temp_id' => 'WR2_M3', 'loser_to' => 'LR1_M1'];
        
        $matches[] = ['temp_id' => 'WR1_M3', 'round' => 1, 'match_number' => 3, 'bracket' => 'winners',
            'team1_temp_id' => 'team_5', 'team2_temp_id' => 'team_10',
            'team1_name' => $teams[5]['name'], 'team2_name' => $teams[10]['name'],
            'next_match_temp_id' => 'WR2_M4', 'loser_to' => 'LR1_M2'];
        
        // Winners Round 2 - Matches 4-7
        $matches[] = ['temp_id' => 'WR2_M1', 'round' => 2, 'match_number' => 4, 'bracket' => 'winners',
            'team1_temp_id' => 'team_0', 'team2_temp_id' => null,
            'team1_name' => $teams[0]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR1_M1'];
        
        $matches[] = ['temp_id' => 'WR2_M2', 'round' => 2, 'match_number' => 5, 'bracket' => 'winners',
            'team1_temp_id' => 'team_3', 'team2_temp_id' => 'team_4',
            'team1_name' => $teams[3]['name'], 'team2_name' => $teams[4]['name'],
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR1_M2'];
        
        $matches[] = ['temp_id' => 'WR2_M3', 'round' => 2, 'match_number' => 6, 'bracket' => 'winners',
            'team1_temp_id' => 'team_1', 'team2_temp_id' => null,
            'team1_name' => $teams[1]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR2_M2'];
        
        $matches[] = ['temp_id' => 'WR2_M4', 'round' => 2, 'match_number' => 7, 'bracket' => 'winners',
            'team1_temp_id' => 'team_2', 'team2_temp_id' => null,
            'team1_name' => $teams[2]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR1_M3'];
        
        // Losers Round 1 - Matches 8-10
        $matches[] = ['temp_id' => 'LR1_M1', 'round' => 4, 'match_number' => 8, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M1', 'loser_to' => null];
        
        $matches[] = ['temp_id' => 'LR1_M2', 'round' => 4, 'match_number' => 9, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M1', 'loser_to' => null];
        
        $matches[] = ['temp_id' => 'LR1_M3', 'round' => 4, 'match_number' => 10, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M2', 'loser_to' => null];
        
        // Losers Round 2 - Matches 11-12
        $matches[] = ['temp_id' => 'LR2_M1', 'round' => 5, 'match_number' => 11, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M2', 'loser_to' => null];
        
        $matches[] = ['temp_id' => 'LR2_M2', 'round' => 5, 'match_number' => 12, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null];
        
        // Winners Round 3 - Matches 13-14
        $matches[] = ['temp_id' => 'WR3_M1', 'round' => 3, 'match_number' => 13, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR3_M1'];
        
        $matches[] = ['temp_id' => 'WR3_M2', 'round' => 3, 'match_number' => 14, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR3_M2'];
        
        // Losers Round 3 - Matches 15-16
        $matches[] = ['temp_id' => 'LR3_M1', 'round' => 6, 'match_number' => 15, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M1', 'loser_to' => null,
            'display_order' => 1];
        
        $matches[] = ['temp_id' => 'LR3_M2', 'round' => 6, 'match_number' => 16, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M1', 'loser_to' => null,
            'display_order' => 2];
        
        // Losers Round 4 - Match 17
        $matches[] = ['temp_id' => 'LR4_M1', 'round' => 7, 'match_number' => 17, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR5_M1', 'loser_to' => null];
        
        // Winners Round 4 - Match 18
        $matches[] = ['temp_id' => 'WR4_M1', 'round' => 4, 'match_number' => 18, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => 'LR5_M1'];
        
        // Losers Round 5 - Match 19
        $matches[] = ['temp_id' => 'LR5_M1', 'round' => 8, 'match_number' => 19, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => null];
        
        // Grand Finals - Match 20
        $matches[] = ['temp_id' => 'GF', 'round' => 9, 'match_number' => 20, 'bracket' => 'grand_finals',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => null, 'loser_to' => null];
        
        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 9,
            'bracket_type' => 'double',
            'winners_rounds' => 4,
            'losers_rounds' => 5,
        ];
    }

    private function generate9TeamDoubleElimination($teams, $eventId)
    {
        // Hardcoded 9-team double elimination structure matching Challonge (16 matches total)
        // Based on reference image: WR1(2) + WR2(3) + WR3(2) + WR4(1) + LR1(2) + LR2(2) + LR3(1) + LR4(1) + GF(1) = 16
        
        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }
        
        $matches = [];

        // Winners Round 1 - Match 1 (only play-in)
        $matches[] = ['temp_id' => 'WR1_M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
            'team1_temp_id' => 'team_7', 'team2_temp_id' => 'team_8',
            'team1_name' => $teams[7]['name'], 'team2_name' => $teams[8]['name'],
            'next_match_temp_id' => 'WR2_M1', 'loser_to' => 'LR1_M1'];

        // Winners Round 2 - Matches 2-5
        $matches[] = ['temp_id' => 'WR2_M1', 'round' => 2, 'match_number' => 2, 'bracket' => 'winners',
            'team1_temp_id' => 'team_0', 'team2_temp_id' => null,
            'team1_name' => $teams[0]['name'], 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M2'];

        $matches[] = ['temp_id' => 'WR2_M2', 'round' => 2, 'match_number' => 3, 'bracket' => 'winners',
            'team1_temp_id' => 'team_3', 'team2_temp_id' => 'team_4',
            'team1_name' => $teams[3]['name'], 'team2_name' => $teams[4]['name'],
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M1'];

        $matches[] = ['temp_id' => 'WR2_M3', 'round' => 2, 'match_number' => 4, 'bracket' => 'winners',
            'team1_temp_id' => 'team_1', 'team2_temp_id' => 'team_6',
            'team1_name' => $teams[1]['name'], 'team2_name' => $teams[6]['name'],
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR1_M1'];

        $matches[] = ['temp_id' => 'WR2_M4', 'round' => 2, 'match_number' => 5, 'bracket' => 'winners',
            'team1_temp_id' => 'team_2', 'team2_temp_id' => 'team_5',
            'team1_name' => $teams[2]['name'], 'team2_name' => $teams[5]['name'],
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR2_M2'];

        // Losers Round 1 - Match 6
        $matches[] = ['temp_id' => 'LR1_M1', 'round' => 4, 'match_number' => 6, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M1', 'loser_to' => null];

        // Losers Round 2 - Matches 7, 8
        $matches[] = ['temp_id' => 'LR2_M1', 'round' => 5, 'match_number' => 7, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null];

        $matches[] = ['temp_id' => 'LR2_M2', 'round' => 5, 'match_number' => 8, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M2', 'loser_to' => null];

        // Winners Round 3 - Matches 9, 10
        $matches[] = ['temp_id' => 'WR3_M1', 'round' => 3, 'match_number' => 9, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR3_M1'];

        $matches[] = ['temp_id' => 'WR3_M2', 'round' => 3, 'match_number' => 10, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR3_M2'];

        // Losers Round 3 - Matches 11, 12
        $matches[] = ['temp_id' => 'LR3_M1', 'round' => 6, 'match_number' => 11, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M1', 'loser_to' => null];

        $matches[] = ['temp_id' => 'LR3_M2', 'round' => 6, 'match_number' => 12, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M1', 'loser_to' => null];

        // Losers Round 4 - Match 13
        $matches[] = ['temp_id' => 'LR4_M1', 'round' => 7, 'match_number' => 13, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR5_M1', 'loser_to' => null];

        // Winners Round 4 - Match 14
        $matches[] = ['temp_id' => 'WR4_M1', 'round' => 4, 'match_number' => 14, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => 'LR5_M1'];

        // Losers Round 5 - Match 15
        $matches[] = ['temp_id' => 'LR5_M1', 'round' => 8, 'match_number' => 15, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => null];

        // Grand Finals - Match 16
        $matches[] = ['temp_id' => 'GF', 'round' => 9, 'match_number' => 16, 'bracket' => 'grand_finals',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => null, 'loser_to' => null];

        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 9,
            'bracket_type' => 'double',
            'winners_rounds' => 4,
            'losers_rounds' => 5,
        ];
    }

    private function generateDoubleEliminationBracket($teams, $eventId)
    {
        $teamCount = count($teams);
        
        // Prepare teams with temp IDs and seeds
        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }
        
        // Special handling for specific team counts to match Challonge structure
        if (count($teams) == 3) {
            return $this->generate3TeamDoubleElimination($teams, $eventId);
        }

        if (count($teams) == 5) {
            return $this->generate5TeamDoubleElimination($teams, $eventId);
        }
        
        if (count($teams) == 6) {
            return $this->generate6TeamDoubleElimination($teams, $eventId);
        }
        
        if (count($teams) == 7) {
            return $this->generate7TeamDoubleElimination($teams, $eventId);
        }
        
        if (count($teams) == 8) {
            return $this->generate8TeamDoubleElimination($teams, $eventId);
        }
        
        if (count($teams) == 9) {
            return $this->generate9TeamDoubleElimination($teams, $eventId);
        }
        
        if (count($teams) == 10) {
            return $this->generate10TeamDoubleElimination($teams, $eventId);
        }
        
        if (count($teams) == 11) {
            return $this->generate11TeamDoubleElimination($teams, $eventId);
        }
        
        if (count($teams) == 12) {
            return $this->generate12TeamDoubleElimination($teams, $eventId);
        }
        
        if (count($teams) == 13) {
            return $this->generate13TeamDoubleElimination($teams, $eventId);
        }
        
        if (count($teams) == 14) {
            return $this->generate14TeamDoubleElimination($teams, $eventId);
        }
        
        if (count($teams) == 15) {
            return $this->generate15TeamDoubleElimination($teams, $eventId);
        }
        
        // Use single elimination as base for winners bracket
        $singleElimBracket = $this->generateSingleEliminationBracket($teams, $eventId);
        
        // Mark all single elim matches as winners bracket
        $winnersMatches = [];
        foreach ($singleElimBracket['matches'] as $match) {
            $match['bracket'] = 'winners';
            $match['loser_to'] = null; // Will be set later
            $winnersMatches[] = $match;
        }
        
        $numWinnersRounds = $singleElimBracket['total_rounds'];
        
        // We'll assign match numbers later in Challonge style
        $globalMatchNumber = 1;
        
        // ============================================
        // LOSERS BRACKET
        // ============================================
        $losersMatches = [];
        // Losers rounds calculation
        // For power of 2 teams: (Winners rounds - 1) * 2
        // For non-power of 2 with byes: depends on structure
        $isPowerOfTwo = (count($teams) & (count($teams) - 1)) == 0;
        $numLosersRounds = ($numWinnersRounds - 1) * 2;
        
        // Special cases for non-power-of-2 team counts
        if (!$isPowerOfTwo) {
            // For 3 teams: 1 WR, need 1 LR (not 0)
            if (count($teams) == 3) {
                $numLosersRounds = 1;
            }
            // For 5-7 teams: 2 WR, need 2 LR (not 1)
            elseif (count($teams) >= 5 && count($teams) <= 7) {
                $numLosersRounds = 2;
            }
            // For 9+ teams with complex bye structure, reduce by 1
            elseif (count($teams) > 8) {
                $numLosersRounds--;
            }
        }
        
        // Build losers bracket rounds
        // Pattern: LR1 gets losers from WR1, LR2 merges LR1 winners with WR2 losers, etc.
        $winnersMatchesByRound = [];
        foreach ($winnersMatches as $match) {
            $winnersMatchesByRound[$match['round']][] = $match;
        }
        
        \Log::info("Winners matches by round: " . json_encode(array_map(fn($r) => count($r), $winnersMatchesByRound)));
        
        $currentLosersSize = 0;
        for ($lRound = 1; $lRound <= $numLosersRounds; $lRound++) {
            $roundMatches = [];
            
            if ($lRound == 1) {
                // LR1: Losers from WR1 play each other
                // For 9+ teams with byes, LR1 also receives first WR2 loser
                $wr1Count = count($winnersMatchesByRound[1] ?? []);
                $wr2Count = count($winnersMatchesByRound[2] ?? []);
                \Log::info("LR1 Generation: WR1 count = {$wr1Count}, WR2 count = {$wr2Count}, numLosersRounds = {$numLosersRounds}");
                
                // For 9 teams: 4 WR1 losers + 1 WR2 loser = 5 teams → 2 LR1 matches (one with 3 teams)
                // Standard: just WR1 losers
                if (count($teams) == 9) {
                    $numMatches = 2; // Special case for 9 teams
                } else {
                    $numMatches = max(1, floor($wr1Count / 2));
                }
                $currentLosersSize = $numMatches;
                \Log::info("LR1: Creating {$numMatches} matches");
            } elseif ($lRound == $numLosersRounds) {
                // Last losers round is always Losers Finals (1 match)
                $numMatches = 1;
                $currentLosersSize = 1;
            } elseif ($lRound % 2 == 0) {
                // Even rounds: Merge winners from previous LR with losers from WR
                // Number of matches = number of WR losers coming in
                $wrRound = ($lRound / 2) + 1;
                $wrCount = count($winnersMatchesByRound[$wrRound] ?? []);
                $numMatches = max(1, $wrCount);
                $currentLosersSize = $numMatches;
            } else {
                // Odd rounds after LR1: Winners from previous LR play each other
                $numMatches = max(1, floor($currentLosersSize / 2));
                $currentLosersSize = $numMatches;
            }
            
            for ($i = 0; $i < $numMatches; $i++) {
                $roundMatches[] = [
                    'temp_id' => 'LR' . $lRound . '_M' . $i,
                    'round' => $numWinnersRounds + $lRound,
                    'match_number' => $globalMatchNumber,
                    'bracket' => 'losers',
                    'team1_temp_id' => null,
                    'team2_temp_id' => null,
                    'team1_name' => 'TBD',
                    'team2_name' => 'TBD',
                    'next_match_temp_id' => null,
                    'loser_to' => null,
                ];
                $globalMatchNumber++;
            }
            
            $losersMatches = array_merge($losersMatches, $roundMatches);
        }
        
        // ============================================
        // GRAND FINALS
        // ============================================
        $grandFinalsRound = $numWinnersRounds + $numLosersRounds + 1;
        
        $grandFinals = [
            'temp_id' => 'GF',
            'round' => $grandFinalsRound,
            'match_number' => $globalMatchNumber,
            'bracket' => 'grand_finals',
            'team1_temp_id' => null,
            'team2_temp_id' => null,
            'team1_name' => 'TBD',
            'team2_name' => 'TBD',
            'next_match_temp_id' => null,
            'loser_to' => null,
        ];
        
        // Combine all matches
        $matches = array_merge($winnersMatches, $losersMatches, [$grandFinals]);
        
        // ============================================
        // SET MATCH PROGRESSION
        // ============================================
        // Map temp_ids to array indices for easy lookup
        $matchIndexMap = [];
        foreach ($matches as $index => $match) {
            $matchIndexMap[$match['temp_id']] = $index;
        }
        
        // Set next_match_id for winners bracket matches
        for ($wRound = 1; $wRound < $numWinnersRounds; $wRound++) {
            $currentWRoundMatches = array_filter($winnersMatches, fn($m) => $m['round'] == $wRound);
            $nextWRoundMatches = array_filter($winnersMatches, fn($m) => $m['round'] == $wRound + 1);

            $currentArray = array_values($currentWRoundMatches);
            $nextArray = array_values($nextWRoundMatches);

            // Two current matches feed into one next match (standard bracket pairing)
            for ($i = 0; $i < count($currentArray); $i++) {
                $nextIdx = floor($i / 2); // Pairs: 0,1 -> 0; 2,3 -> 1; 4,5 -> 2; etc.
                if (isset($nextArray[$nextIdx])) {
                    $currentMatchId = $currentArray[$i]['temp_id'];
                    $nextMatchId = $nextArray[$nextIdx]['temp_id'];
                    $matches[$matchIndexMap[$currentMatchId]]['next_match_temp_id'] = $nextMatchId;
                }
            }
        }

        // Set final winners bracket match to go to grand finals
        $finalWRoundMatches = array_filter($winnersMatches, fn($m) => $m['round'] == $numWinnersRounds);
        $finalWArray = array_values($finalWRoundMatches);

        foreach ($finalWArray as $match) {
            $matchId = $match['temp_id'];
            $matches[$matchIndexMap[$matchId]]['next_match_temp_id'] = 'GF';
        }
        
        // Set next_match_id for losers bracket matches
        for ($lRound = 1; $lRound < $numLosersRounds; $lRound++) {
            $currentLRoundMatches = array_filter($losersMatches, fn($m) => $m['round'] == $numWinnersRounds + $lRound);
            $nextLRoundMatches = array_filter($losersMatches, fn($m) => $m['round'] == $numWinnersRounds + $lRound + 1);
            
            $currentArray = array_values($currentLRoundMatches);
            $nextArray = array_values($nextLRoundMatches);
            
            // Multiple current matches can feed into the same next match
            for ($i = 0; $i < count($currentArray); $i++) {
                // Use min to ensure we don't go out of bounds
                $nextIdx = min($i, count($nextArray) - 1);
                if (isset($nextArray[$nextIdx])) {
                    $currentMatchId = $currentArray[$i]['temp_id'];
                    $nextMatchId = $nextArray[$nextIdx]['temp_id'];
                    $matches[$matchIndexMap[$currentMatchId]]['next_match_temp_id'] = $nextMatchId;
                }
            }
        }
        
        // Set final losers bracket winner to go to grand finals
        $finalLRoundMatches = array_filter($losersMatches, fn($m) => $m['round'] == $numWinnersRounds + $numLosersRounds);
        $finalLArray = array_values($finalLRoundMatches);
        
        foreach ($finalLArray as $match) {
            $matchId = $match['temp_id'];
            $matches[$matchIndexMap[$matchId]]['next_match_temp_id'] = 'GF';
        }
        
        // Route losers from Winners Bracket to Losers Bracket
        // WR1 losers routing (special case for odd team counts)
        $wr1Matches = array_filter($winnersMatches, fn($m) => $m['round'] == 1);
        $lr1Matches = array_filter($losersMatches, fn($m) => $m['round'] == $numWinnersRounds + 1);
        $lr2Matches = array_filter($losersMatches, fn($m) => $m['round'] == $numWinnersRounds + 2);
        
        $wr1Array = array_values($wr1Matches);
        $lr1Array = array_values($lr1Matches);
        $lr2Array = array_values($lr2Matches);
        
        // Special case: If there are more WR1 matches than LR1 matches * 2,
        // the first WR1 match loser goes to LR2 instead of LR1
        $hasSpecialCase = count($wr1Array) > (count($lr1Array) * 2);
        
        if ($hasSpecialCase && isset($wr1Array[0]) && isset($lr2Array[0])) {
            // First WR1 match loser goes to LR2
            $wr1Match0Id = $wr1Array[0]['temp_id'];
            $lr2Match0Id = $lr2Array[0]['temp_id'];
            $matches[$matchIndexMap[$wr1Match0Id]]['loser_to'] = $lr2Match0Id;
            
            // Remaining WR1 matches go to LR1
            for ($i = 0; $i < count($lr1Array); $i++) {
                $lr1MatchId = $lr1Array[$i]['temp_id'];
                
                // WR1 matches that feed into this LR1 match (skip index 0)
                $wr1Match1Idx = ($i * 2) + 1;
                $wr1Match2Idx = ($i * 2) + 2;
                
                if (isset($wr1Array[$wr1Match1Idx])) {
                    $wr1Match1Id = $wr1Array[$wr1Match1Idx]['temp_id'];
                    $matches[$matchIndexMap[$wr1Match1Id]]['loser_to'] = $lr1MatchId;
                }
                
                if (isset($wr1Array[$wr1Match2Idx])) {
                    $wr1Match2Id = $wr1Array[$wr1Match2Idx]['temp_id'];
                    $matches[$matchIndexMap[$wr1Match2Id]]['loser_to'] = $lr1MatchId;
                }
            }
        } else {
            // Standard case: For each pair of WR1 matches, their losers go to one LR1 match
            for ($i = 0; $i < count($lr1Array); $i++) {
                $lr1MatchId = $lr1Array[$i]['temp_id'];
                
                // WR1 matches that feed into this LR1 match
                $wr1Match1Idx = $i * 2;
                $wr1Match2Idx = $i * 2 + 1;
                
                if (isset($wr1Array[$wr1Match1Idx])) {
                    $wr1Match1Id = $wr1Array[$wr1Match1Idx]['temp_id'];
                    $matches[$matchIndexMap[$wr1Match1Id]]['loser_to'] = $lr1MatchId;
                }
                
                if (isset($wr1Array[$wr1Match2Idx])) {
                    $wr1Match2Id = $wr1Array[$wr1Match2Idx]['temp_id'];
                    $matches[$matchIndexMap[$wr1Match2Id]]['loser_to'] = $lr1MatchId;
                }
            }
        }
        
        // Route losers from WR2+ to appropriate LR rounds
        for ($wRound = 2; $wRound <= $numWinnersRounds; $wRound++) {
            $wrMatches = array_filter($winnersMatches, fn($m) => $m['round'] == $wRound);
            $wrArray = array_values($wrMatches);
            
            // Standard pattern: WR(n) losers go to LR(2n-2)
            // WR2 -> LR2, WR3 -> LR4, etc.
            $targetLRound = ($wRound - 1) * 2;
            $lrMatches = array_filter($losersMatches, fn($m) => $m['round'] == $numWinnersRounds + $targetLRound);
            $lrArray = array_values($lrMatches);
            
            if ($wRound == 2) {
                // WR2: 1-to-1 mapping to LR2 matches
                foreach ($wrArray as $idx => $wrMatch) {
                    $lrIdx = min($idx, count($lrArray) - 1);
                    if (isset($lrArray[$lrIdx])) {
                        $wrMatchId = $wrMatch['temp_id'];
                        $lrMatchId = $lrArray[$lrIdx]['temp_id'];
                        $matches[$matchIndexMap[$wrMatchId]]['loser_to'] = $lrMatchId;
                    }
                }
            } else {
                // WR3+: Standard pattern WR(n) -> LR(2n-2)
                $targetLRound = ($wRound * 2) - 2;
                $lrMatches = array_filter($losersMatches, fn($m) => $m['round'] == $numWinnersRounds + $targetLRound);
                $lrArray = array_values($lrMatches);
                
                foreach ($wrArray as $idx => $wrMatch) {
                    $lrIdx = min($idx, count($lrArray) - 1);
                    if (isset($lrArray[$lrIdx])) {
                        $wrMatchId = $wrMatch['temp_id'];
                        $lrMatchId = $lrArray[$lrIdx]['temp_id'];
                        $matches[$matchIndexMap[$wrMatchId]]['loser_to'] = $lrMatchId;
                    }
                }
            }
        }
        
        \Log::info("Double Elim Generated: " . count($matches) . " total matches, " . count($winnersMatches) . " winners, " . count($losersMatches) . " losers");
        
    
        // Pattern based on Challonge reference:
        // 1. First (numWinnersRounds - 1) winners rounds
        // 2. First (numLosersRounds - 1) losers rounds  
        // 3. Final winners round (semifinals/finals)
        // 4. Final losers round
        // 5. Grand Finals
        $matchNumber = 1;
        
        // Number first (numWinnersRounds - 1) winners rounds
        for ($round = 1; $round < $numWinnersRounds; $round++) {
            $wrRoundMatches = array_filter($winnersMatches, fn($m) => $m['round'] == $round);
            foreach ($wrRoundMatches as $wrMatch) {
                $matches[$matchIndexMap[$wrMatch['temp_id']]]['match_number'] = $matchNumber;
                $matchNumber++;
            }
        }
        
        // Number first (numLosersRounds - 1) losers rounds
        for ($round = 1; $round < $numLosersRounds; $round++) {
            $lrRound = $numWinnersRounds + $round;
            $lrRoundMatches = array_filter($losersMatches, fn($m) => $m['round'] == $lrRound);
            foreach ($lrRoundMatches as $lrMatch) {
                $matches[$matchIndexMap[$lrMatch['temp_id']]]['match_number'] = $matchNumber;
                $matchNumber++;
            }
        }
        
        // Number final winners round
        $wrRoundMatches = array_filter($winnersMatches, fn($m) => $m['round'] == $numWinnersRounds);
        foreach ($wrRoundMatches as $wrMatch) {
            $matches[$matchIndexMap[$wrMatch['temp_id']]]['match_number'] = $matchNumber;
            $matchNumber++;
        }
        
        // Number final losers round
        $lrRound = $numWinnersRounds + $numLosersRounds;
        $lrRoundMatches = array_filter($losersMatches, fn($m) => $m['round'] == $lrRound);
        foreach ($lrRoundMatches as $lrMatch) {
            $matches[$matchIndexMap[$lrMatch['temp_id']]]['match_number'] = $matchNumber;
            $matchNumber++;
        }
        
        // Number grand finals last
        foreach ($matches as &$match) {
            if ($match['bracket'] === 'grand_finals') {
                $match['match_number'] = $matchNumber;
                $matchNumber++;
            }
        }
        
        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => $numWinnersRounds + $numLosersRounds + 1,
            'bracket_type' => 'double',
            'winners_rounds' => $numWinnersRounds,
            'losers_rounds' => $numLosersRounds,
        ];
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
