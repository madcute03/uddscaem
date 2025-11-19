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
use App\Http\Controllers\ChallongeDoubleEliminationController;
use App\Http\Controllers\ChallongeSeedingController;


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

        // Get all unique teams participating in this tournament
        $teamIds = collect();
        foreach ($tournament->matches as $match) {
            if ($match->team1_id) $teamIds->push($match->team1_id);
            if ($match->team2_id) $teamIds->push($match->team2_id);
        }
        
        $teams = Team::whereIn('id', $teamIds->unique())->get();
        
        // Add teams to tournament data
        $tournament->teams = $teams;

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

        // Get all unique teams participating in this tournament
        $teamIds = collect();
        foreach ($tournament->matches as $match) {
            if ($match->team1_id) $teamIds->push($match->team1_id);
            if ($match->team2_id) $teamIds->push($match->team2_id);
        }
        
        $teams = Team::whereIn('id', $teamIds->unique())->get();
        
        // Add teams to tournament data
        $tournament->teams = $teams;

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
            
            // DEBUG: Log first LR2 match
            $lr2Found = false;
            foreach ($request->matches as $m) {
                if (!$lr2Found && ($m['bracket'] ?? '') === 'losers' && ($m['losers_round'] ?? 0) === 2) {
                    \Log::info('FIRST LR2 MATCH FROM FRONTEND:', $m);
                    $lr2Found = true;
                }
            }
            \Log::info('Total matches from frontend: ' . count($request->matches));
            
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
                
                // Get the semantic match ID (WR1_M1, LR2_M14, etc.)
                $semanticId = $matchData['id'] ?? $matchData['temp_id'] ?? null;
                
                \Log::info('Creating match', [
                    'semantic_id' => $semanticId,
                    'round' => $matchData['round'],
                    'bracket' => $matchData['bracket'] ?? null,
                    'losers_round' => $matchData['losers_round'] ?? null,
                ]);
                
                $match = TournamentMatch::create([
                    'tournament_id' => $tournament->id,
                    'match_id' => $semanticId,  // Store semantic ID (WR1_M1, LR2_M14, etc.)
                    'round' => $matchData['round'],
                    'match_number' => $matchData['match_number'],
                    'bracket' => $matchData['bracket'] ?? null,
                    'losers_round' => $matchData['losers_round'] ?? null,
                    'round_name' => $matchData['round_name'] ?? null,
                    'position' => $matchData['position'] ?? null,
                    'team1_id' => $team1Id,
                    'team2_id' => $team2Id,
                    'team1_seed' => $matchData['team1_seed'] ?? null,
                    'team2_seed' => $matchData['team2_seed'] ?? null,
                    'previous_match_loser_1' => $matchData['previous_match_loser_1'] ?? null,
                    'previous_match_loser_2' => $matchData['previous_match_loser_2'] ?? null,
                    'status' => 'pending',
                ]);
                $matchMap[$semanticId] = $match->id;
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

        // Get all unique teams participating in this tournament
        $teamIds = collect();
        foreach ($tournament->matches as $match) {
            if ($match->team1_id) $teamIds->push($match->team1_id);
            if ($match->team2_id) $teamIds->push($match->team2_id);
        }
        
        $teams = Team::whereIn('id', $teamIds->unique())->get();
        
        // Add teams to tournament data
        $tournament->teams = $teams;

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
        $match = TournamentMatch::findOrFail($matchId);
        $tournament = Tournament::findOrFail($match->tournament_id);
        
        // Different validation rules for round robin vs elimination tournaments
        if ($tournament->bracket_type === 'round-robin') {
            $request->validate([
                'team1_score' => 'required|integer|min:0',
                'team2_score' => 'required|integer|min:0',
            ]);
        } else {
            $request->validate([
                'winner_id' => 'required|exists:teams,id',
                'team1_score' => 'nullable|integer',
                'team2_score' => 'nullable|integer',
            ]);
        }
        
        if ($tournament->bracket_type === 'round-robin') {
            // For round robin, just update scores - no winner determination needed
            $match->update([
                'team1_score' => $request->team1_score,
                'team2_score' => $request->team2_score,
                'status' => 'completed',
            ]);
        } else {
            // For elimination tournaments, handle winner logic
            // Store old winner for comparison
            $oldWinnerId = $match->winner_id;
            $isWinnerChanged = $oldWinnerId && ($oldWinnerId != $request->winner_id);
            
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

            // Only update next matches if winner changed or match was not completed before
            if (!$oldWinnerId || $isWinnerChanged) {
            // If winner changed, we need to update subsequent matches
            if ($isWinnerChanged && $match->next_match_id) {
                $nextMatch = TournamentMatch::find($match->next_match_id);
                if ($nextMatch) {
                    // Remove old winner and place new winner
                    if ($nextMatch->team1_id == $oldWinnerId) {
                        $nextMatch->update(['team1_id' => $request->winner_id]);
                    } elseif ($nextMatch->team2_id == $oldWinnerId) {
                        $nextMatch->update(['team2_id' => $request->winner_id]);
                    }
                }
            } elseif (!$oldWinnerId && $match->next_match_id) {
                // First time completing - place winner in next match
                $nextMatch = TournamentMatch::find($match->next_match_id);
                if ($nextMatch) {
                    $winnerAlreadyInMatch = ($nextMatch->team1_id == $request->winner_id || $nextMatch->team2_id == $request->winner_id);
                    
                    if (!$winnerAlreadyInMatch) {
                        if (!$nextMatch->team1_id) {
                            $nextMatch->update(['team1_id' => $request->winner_id]);
                        } elseif (!$nextMatch->team2_id) {
                            $nextMatch->update(['team2_id' => $request->winner_id]);
                        } else {
                            \Log::warning("Both team slots already filled in match {$nextMatch->id}");
                        }
                    }
                }
            }
            
            // Handle loser bracket for double elimination
            if ($isWinnerChanged && $match->loser_to) {
                $loserMatch = TournamentMatch::find($match->loser_to);
                if ($loserMatch) {
                    // Remove old loser and place new loser
                    $oldLoserId = ($oldWinnerId == $match->team1_id) ? $match->team2_id : $match->team1_id;
                    if ($loserMatch->team1_id == $oldLoserId) {
                        $loserMatch->update(['team1_id' => $loserId]);
                    } elseif ($loserMatch->team2_id == $oldLoserId) {
                        $loserMatch->update(['team2_id' => $loserId]);
                    }
                }
            } elseif (!$oldWinnerId && $match->loser_to && $loserId) {
                // First time completing - place loser in loser bracket
                $loserMatch = TournamentMatch::find($match->loser_to);
                if ($loserMatch) {
                    $loserAlreadyInMatch = ($loserMatch->team1_id == $loserId || $loserMatch->team2_id == $loserId);
                    
                    if (!$loserAlreadyInMatch) {
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
            }
            
            // Check if tournament is completed
            // For elimination tournaments: check if this is the final match
            $isFinalMatch = false;
            
            // Check 1: No next match (this is a terminal match)
            if (!$match->next_match_id) {
                // For double elimination: grand finals bracket
                if ($tournament->bracket_type === 'double' && $match->bracket === 'grand_finals') {
                    $isFinalMatch = true;
                }
                // For single elimination or highest round match
                elseif ($match->round == $tournament->total_rounds) {
                    $isFinalMatch = true;
                }
            }
            
            // Check 2: All matches are completed (fallback check)
            if (!$isFinalMatch) {
                $remainingMatches = TournamentMatch::where('tournament_id', $tournament->id)
                    ->where('status', '!=', 'completed')
                    ->count();
                    
                if ($remainingMatches === 0) {
                    $isFinalMatch = true;
                }
            }
            
            if ($isFinalMatch) {
                $tournament->update([
                    'status' => 'completed',
                    'winner_id' => $request->winner_id
                ]);
            }
        }
        
        // For round robin: check if all matches are completed
        if ($tournament->bracket_type === 'round-robin') {
            $allMatchesCompleted = TournamentMatch::where('tournament_id', $tournament->id)
                ->where('status', '!=', 'completed')
                ->count() === 0;
                
            if ($allMatchesCompleted) {
                // Determine winner by points (wins * 3 + draws * 1)
                $teams = Team::where('event_id', $tournament->event_id)->get();
                $standings = [];
                
                foreach ($teams as $team) {
                    $wins = 0;
                    $draws = 0;
                    
                    $matches = TournamentMatch::where('tournament_id', $tournament->id)
                        ->where(function($q) use ($team) {
                            $q->where('team1_id', $team->id)
                              ->orWhere('team2_id', $team->id);
                        })
                        ->where('status', 'completed')
                        ->get();
                    
                    foreach ($matches as $m) {
                        if ($m->team1_score === $m->team2_score) {
                            $draws++;
                        } elseif (
                            ($m->team1_id === $team->id && $m->team1_score > $m->team2_score) ||
                            ($m->team2_id === $team->id && $m->team2_score > $m->team1_score)
                        ) {
                            $wins++;
                        }
                    }
                    
                    $points = ($wins * 3) + $draws;
                    $standings[] = ['team_id' => $team->id, 'points' => $points];
                }
                
                // Sort by points descending
                usort($standings, function($a, $b) {
                    return $b['points'] - $a['points'];
                });
                
                if (!empty($standings)) {
                    $tournament->update([
                        'status' => 'completed',
                        'winner_id' => $standings[0]['team_id']
                    ]);
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
     * Swap individual teams between matches
     * Only allowed if bracket hasn't started (no scores reported in any match)
     * Only allowed for winners bracket matches
     */
    public function swapTeams(Request $request, $tournamentId)
    {
        $request->validate([
            'match1_id' => 'required|exists:matches,id',
            'match1_slot' => 'required|in:1,2',
            'match2_id' => 'required|exists:matches,id',
            'match2_slot' => 'required|in:1,2',
        ]);

        $tournament = Tournament::findOrFail($tournamentId);
        $match1 = TournamentMatch::findOrFail($request->match1_id);
        $match2 = TournamentMatch::findOrFail($request->match2_id);

        // Check if tournament has started (any match has scores)
        $hasStarted = TournamentMatch::where('tournament_id', $tournamentId)
            ->where(function($query) {
                $query->whereNotNull('team1_score')
                      ->orWhereNotNull('team2_score')
                      ->orWhereNotNull('winner_id');
            })
            ->exists();

        if ($hasStarted) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot swap teams after tournament has started'
            ], 400);
        }

        // Check if both matches are in winners bracket (or null for single elimination)
        if ($match1->bracket === 'losers' || $match2->bracket === 'losers' || 
            $match1->bracket === 'grand_finals' || $match2->bracket === 'grand_finals') {
            return response()->json([
                'success' => false,
                'message' => 'Can only swap teams in winners bracket'
            ], 400);
        }

        // Get the team IDs based on slots
        $team1Id = $request->match1_slot == 1 ? $match1->team1_id : $match1->team2_id;
        $team2Id = $request->match2_slot == 1 ? $match2->team1_id : $match2->team2_id;

        // Swap the teams
        if ($request->match1_slot == 1) {
            $match1->team1_id = $team2Id;
        } else {
            $match1->team2_id = $team2Id;
        }

        if ($request->match2_slot == 1) {
            $match2->team1_id = $team1Id;
        } else {
            $match2->team2_id = $team1Id;
        }

        $match1->save();
        $match2->save();

        return response()->json([
            'success' => true,
            'message' => 'Teams swapped successfully',
            'matches' => [
                'match1' => $match1->fresh(['team1', 'team2']),
                'match2' => $match2->fresh(['team1', 'team2'])
            ]
        ]);
    }

    /**
     * Generate single elimination bracket structure using Challonge seeding
     * Uses ChallongeSeedingController for proper Challonge-style bracket layout
     */
    private function generateSingleEliminationBracket($teams, $eventId)
    {
        // Use ChallongeSeedingController for proper Challonge seeding
        $challongeController = new \App\Http\Controllers\ChallongeSeedingController();
        return $challongeController->generateChallongeBracket($teams, $eventId);
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

    private function generate16TeamDoubleElimination($teams, $eventId)
    {
        // Hardcoded 16-team double elimination structure (30 matches total)
        // Structure: WR1(8) + WR2(4) + WR3(2) + WR4(1) + LR1(4) + LR2(4) + LR3(2) + LR4(2) + LR5(1) + LR6(1) + GF(1) = 30

        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }

        $matches = [];

        // Winners Round 1 - Matches 1-8
        $matches[] = ['temp_id' => 'WR1_M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
            'team1_temp_id' => 'team_0', 'team2_temp_id' => 'team_15',
            'team1_name' => $teams[0]['name'], 'team2_name' => $teams[15]['name'],
            'next_match_temp_id' => 'WR2_M1', 'loser_to' => 'LR1_M1'];

        $matches[] = ['temp_id' => 'WR1_M2', 'round' => 1, 'match_number' => 2, 'bracket' => 'winners',
            'team1_temp_id' => 'team_7', 'team2_temp_id' => 'team_8',
            'team1_name' => $teams[7]['name'], 'team2_name' => $teams[8]['name'],
            'next_match_temp_id' => 'WR2_M1', 'loser_to' => 'LR1_M1'];

        $matches[] = ['temp_id' => 'WR1_M3', 'round' => 1, 'match_number' => 3, 'bracket' => 'winners',
            'team1_temp_id' => 'team_3', 'team2_temp_id' => 'team_12',
            'team1_name' => $teams[3]['name'], 'team2_name' => $teams[12]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M2'];

        $matches[] = ['temp_id' => 'WR1_M4', 'round' => 1, 'match_number' => 4, 'bracket' => 'winners',
            'team1_temp_id' => 'team_4', 'team2_temp_id' => 'team_11',
            'team1_name' => $teams[4]['name'], 'team2_name' => $teams[11]['name'],
            'next_match_temp_id' => 'WR2_M2', 'loser_to' => 'LR1_M2'];

        $matches[] = ['temp_id' => 'WR1_M5', 'round' => 1, 'match_number' => 5, 'bracket' => 'winners',
            'team1_temp_id' => 'team_1', 'team2_temp_id' => 'team_14',
            'team1_name' => $teams[1]['name'], 'team2_name' => $teams[14]['name'],
            'next_match_temp_id' => 'WR2_M3', 'loser_to' => 'LR1_M3'];

        $matches[] = ['temp_id' => 'WR1_M6', 'round' => 1, 'match_number' => 6, 'bracket' => 'winners',
            'team1_temp_id' => 'team_6', 'team2_temp_id' => 'team_9',
            'team1_name' => $teams[6]['name'], 'team2_name' => $teams[9]['name'],
            'next_match_temp_id' => 'WR2_M3', 'loser_to' => 'LR1_M3'];

        $matches[] = ['temp_id' => 'WR1_M7', 'round' => 1, 'match_number' => 7, 'bracket' => 'winners',
            'team1_temp_id' => 'team_2', 'team2_temp_id' => 'team_13',
            'team1_name' => $teams[2]['name'], 'team2_name' => $teams[13]['name'],
            'next_match_temp_id' => 'WR2_M4', 'loser_to' => 'LR1_M4'];

        $matches[] = ['temp_id' => 'WR1_M8', 'round' => 1, 'match_number' => 8, 'bracket' => 'winners',
            'team1_temp_id' => 'team_5', 'team2_temp_id' => 'team_10',
            'team1_name' => $teams[5]['name'], 'team2_name' => $teams[10]['name'],
            'next_match_temp_id' => 'WR2_M4', 'loser_to' => 'LR1_M4'];

        // Losers Round 1 - Matches 9-12
        $matches[] = ['temp_id' => 'LR1_M1', 'round' => 5, 'match_number' => 9, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M1', 'loser_to' => null,
            'display_order' => 1];

        $matches[] = ['temp_id' => 'LR1_M2', 'round' => 5, 'match_number' => 10, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M2', 'loser_to' => null,
            'display_order' => 2];

        $matches[] = ['temp_id' => 'LR1_M3', 'round' => 5, 'match_number' => 11, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M3', 'loser_to' => null,
            'display_order' => 3];

        $matches[] = ['temp_id' => 'LR1_M4', 'round' => 5, 'match_number' => 12, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR2_M4', 'loser_to' => null,
            'display_order' => 4];

        // Winners Round 2 - Matches 13-16
        $matches[] = ['temp_id' => 'WR2_M1', 'round' => 2, 'match_number' => 13, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M1'];

        $matches[] = ['temp_id' => 'WR2_M2', 'round' => 2, 'match_number' => 14, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M1', 'loser_to' => 'LR2_M2'];

        $matches[] = ['temp_id' => 'WR2_M3', 'round' => 2, 'match_number' => 15, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR2_M3'];

        $matches[] = ['temp_id' => 'WR2_M4', 'round' => 2, 'match_number' => 16, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR3_M2', 'loser_to' => 'LR2_M4'];

        // Losers Round 2 - Matches 17-20
        $matches[] = ['temp_id' => 'LR2_M1', 'round' => 6, 'match_number' => 17, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null,
            'display_order' => 1];

        $matches[] = ['temp_id' => 'LR2_M2', 'round' => 6, 'match_number' => 18, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M1', 'loser_to' => null,
            'display_order' => 2];

        $matches[] = ['temp_id' => 'LR2_M3', 'round' => 6, 'match_number' => 19, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M2', 'loser_to' => null,
            'display_order' => 3];

        $matches[] = ['temp_id' => 'LR2_M4', 'round' => 6, 'match_number' => 20, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR3_M2', 'loser_to' => null,
            'display_order' => 4];

        // Losers Round 3 - Matches 21-22
        $matches[] = ['temp_id' => 'LR3_M1', 'round' => 7, 'match_number' => 21, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M2', 'loser_to' => null,
            'display_order' => 1];

        $matches[] = ['temp_id' => 'LR3_M2', 'round' => 7, 'match_number' => 22, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR4_M1', 'loser_to' => null,
            'display_order' => 2];

        // Winners Round 3 - Matches 23-24
        $matches[] = ['temp_id' => 'WR3_M1', 'round' => 3, 'match_number' => 23, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR4_M1'];

        $matches[] = ['temp_id' => 'WR3_M2', 'round' => 3, 'match_number' => 24, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'WR4_M1', 'loser_to' => 'LR4_M2'];

        // Losers Round 4 - Matches 25-26
        $matches[] = ['temp_id' => 'LR4_M1', 'round' => 8, 'match_number' => 25, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR5_M1', 'loser_to' => null,
            'display_order' => 1];

        $matches[] = ['temp_id' => 'LR4_M2', 'round' => 8, 'match_number' => 26, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR5_M1', 'loser_to' => null,
            'display_order' => 2];

        // Losers Round 5 - Match 27
        $matches[] = ['temp_id' => 'LR5_M1', 'round' => 9, 'match_number' => 27, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'LR6_M1', 'loser_to' => null];

        // Winners Round 4 (Winners Final) - Match 28
        $matches[] = ['temp_id' => 'WR4_M1', 'round' => 4, 'match_number' => 28, 'bracket' => 'winners',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => 'LR6_M1'];

        // Losers Round 6 (Losers Final) - Match 29
        $matches[] = ['temp_id' => 'LR6_M1', 'round' => 10, 'match_number' => 29, 'bracket' => 'losers',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => 'GF', 'loser_to' => null];

        // Grand Finals - Match 30
        $matches[] = ['temp_id' => 'GF', 'round' => 11, 'match_number' => 30, 'bracket' => 'grand_finals',
            'team1_temp_id' => null, 'team2_temp_id' => null,
            'team1_name' => 'TBD', 'team2_name' => 'TBD',
            'next_match_temp_id' => null, 'loser_to' => null];

        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 11,
            'bracket_type' => 'double',
            'winners_rounds' => 4,
            'losers_rounds' => 6,
        ];
    }

    private function generate17TeamDoubleElimination($teams, $eventId)
    {
        // Corrected 17-team double elimination structure (32 matches total)
        // Challonge layout: W1(1) + W2(8) + W3(4) + W4(2) + WSF(1) + L1(4) + L2(5) + L3(2) + L4(2) + L5(1) + L6(1) + GF(1)

        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }

        $matches = [
            // Match 1 - Winners Round 1
            ['temp_id' => 'M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
                'team1_temp_id' => 'team_15', 'team2_temp_id' => 'team_16',
                'team1_name' => $teams[15]['name'], 'team2_name' => $teams[16]['name'],
                'next_match_temp_id' => 'M9', 'loser_to' => 'M10'],

            // Winners Round 2 - M9 at top, then M8, M7, M6, M5, M4, M3, M2
            // Match 9 - Winners Round 2 (TOP)
            ['temp_id' => 'M9', 'round' => 2, 'match_number' => 9, 'bracket' => 'winners',
                'team1_temp_id' => 'team_0', 'team2_temp_id' => null,
                'team1_name' => $teams[0]['name'], 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M18', 'loser_to' => 'M11'],
            // Match 8 - Winners Round 2
            ['temp_id' => 'M8', 'round' => 2, 'match_number' => 8, 'bracket' => 'winners',
                'team1_temp_id' => 'team_7', 'team2_temp_id' => 'team_8',
                'team1_name' => $teams[7]['name'], 'team2_name' => $teams[8]['name'],
                'next_match_temp_id' => 'M18', 'loser_to' => 'M10'],
            // Match 7 - Winners Round 2
            ['temp_id' => 'M7', 'round' => 2, 'match_number' => 7, 'bracket' => 'winners',
                'team1_temp_id' => 'team_3', 'team2_temp_id' => 'team_12',
                'team1_name' => $teams[3]['name'], 'team2_name' => $teams[12]['name'],
                'next_match_temp_id' => 'M17', 'loser_to' => 'M11'],
            // Match 6 - Winners Round 2
            ['temp_id' => 'M6', 'round' => 2, 'match_number' => 6, 'bracket' => 'winners',
                'team1_temp_id' => 'team_4', 'team2_temp_id' => 'team_11',
                'team1_name' => $teams[4]['name'], 'team2_name' => $teams[11]['name'],
                'next_match_temp_id' => 'M17', 'loser_to' => 'M12'],
            // Match 5 - Winners Round 2
            ['temp_id' => 'M5', 'round' => 2, 'match_number' => 5, 'bracket' => 'winners',
                'team1_temp_id' => 'team_1', 'team2_temp_id' => 'team_14',
                'team1_name' => $teams[1]['name'], 'team2_name' => $teams[14]['name'],
                'next_match_temp_id' => 'M16', 'loser_to' => 'M12'],
            // Match 4 - Winners Round 2
            ['temp_id' => 'M4', 'round' => 2, 'match_number' => 4, 'bracket' => 'winners',
                'team1_temp_id' => 'team_6', 'team2_temp_id' => 'team_9',
                'team1_name' => $teams[6]['name'], 'team2_name' => $teams[9]['name'],
                'next_match_temp_id' => 'M16', 'loser_to' => 'M13'],
            // Match 3 - Winners Round 2
            ['temp_id' => 'M3', 'round' => 2, 'match_number' => 3, 'bracket' => 'winners',
                'team1_temp_id' => 'team_2', 'team2_temp_id' => 'team_13',
                'team1_name' => $teams[2]['name'], 'team2_name' => $teams[13]['name'],
                'next_match_temp_id' => 'M15', 'loser_to' => 'M13'],
            // Match 2 - Winners Round 2
            ['temp_id' => 'M2', 'round' => 2, 'match_number' => 2, 'bracket' => 'winners',
                'team1_temp_id' => 'team_5', 'team2_temp_id' => 'team_10',
                'team1_name' => $teams[5]['name'], 'team2_name' => $teams[10]['name'],
                'next_match_temp_id' => 'M15', 'loser_to' => 'M14'],

            // Match 10 - Losers Round 1
            ['temp_id' => 'M10', 'round' => 6, 'match_number' => 10, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M14', 'loser_to' => null],

            // Match 11 - Losers Round 2
            ['temp_id' => 'M11', 'round' => 7, 'match_number' => 11, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M19', 'loser_to' => null],
            // Match 12 - Losers Round 2
            ['temp_id' => 'M12', 'round' => 7, 'match_number' => 12, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M20', 'loser_to' => null],
            // Match 13 - Losers Round 2
            ['temp_id' => 'M13', 'round' => 7, 'match_number' => 13, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M21', 'loser_to' => null],
            // Match 14 - Losers Round 2
            ['temp_id' => 'M14', 'round' => 7, 'match_number' => 14, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M22', 'loser_to' => null],

            // Winners Round 3 - M18 at top, then M17, M16, M15
            // Match 18 - Winners Round 3 (TOP)
            ['temp_id' => 'M18', 'round' => 3, 'match_number' => 18, 'bracket' => 'winners',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M26', 'loser_to' => 'M22'],
            // Match 17 - Winners Round 3
            ['temp_id' => 'M17', 'round' => 3, 'match_number' => 17, 'bracket' => 'winners',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M26', 'loser_to' => 'M21'],
            // Match 16 - Winners Round 3
            ['temp_id' => 'M16', 'round' => 3, 'match_number' => 16, 'bracket' => 'winners',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M25', 'loser_to' => 'M20'],
            // Match 15 - Winners Round 3
            ['temp_id' => 'M15', 'round' => 3, 'match_number' => 15, 'bracket' => 'winners',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M25', 'loser_to' => 'M19'],

            // Matches 19-22 - Losers Round 3 (4 matches)
            ['temp_id' => 'M19', 'round' => 8, 'match_number' => 19, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M23', 'loser_to' => null],
            ['temp_id' => 'M20', 'round' => 8, 'match_number' => 20, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M23', 'loser_to' => null],
            ['temp_id' => 'M21', 'round' => 8, 'match_number' => 21, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M24', 'loser_to' => null],
            ['temp_id' => 'M22', 'round' => 8, 'match_number' => 22, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M24', 'loser_to' => null],

            // Losers Round 4 - M24 at top, then M23
            // Match 24 - Losers Round 4 (TOP)
            ['temp_id' => 'M24', 'round' => 9, 'match_number' => 24, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M27', 'loser_to' => null],
            // Match 23 - Losers Round 4
            ['temp_id' => 'M23', 'round' => 9, 'match_number' => 23, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M28', 'loser_to' => null],

            // Winners Round 4 - M26 at top, then M25
            // Match 26 - Winners Round 4 (TOP)
            ['temp_id' => 'M26', 'round' => 4, 'match_number' => 26, 'bracket' => 'winners',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M30', 'loser_to' => 'M27'],
            // Match 25 - Winners Round 4
            ['temp_id' => 'M25', 'round' => 4, 'match_number' => 25, 'bracket' => 'winners',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M30', 'loser_to' => 'M28'],

            // Matches 27-28 - Losers Round 5 (2 matches)
            ['temp_id' => 'M27', 'round' => 10, 'match_number' => 27, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M29', 'loser_to' => null],
            ['temp_id' => 'M28', 'round' => 10, 'match_number' => 28, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M29', 'loser_to' => null],

            // Match 29 - Losers Round 6
            ['temp_id' => 'M29', 'round' => 11, 'match_number' => 29, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M31', 'loser_to' => null],

            // Match 30 - Winners Semifinals
            ['temp_id' => 'M30', 'round' => 5, 'match_number' => 30, 'bracket' => 'winners',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M32', 'loser_to' => 'M31'],

            // Match 31 - Losers Finals
            ['temp_id' => 'M31', 'round' => 12, 'match_number' => 31, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M32', 'loser_to' => null],

            // Match 32 - Grand Finals
            ['temp_id' => 'M32', 'round' => 13, 'match_number' => 32, 'bracket' => 'grand_finals',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => null, 'loser_to' => null],
        ];

        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 13,
            'bracket_type' => 'double',
            'winners_rounds' => 5,
            'losers_rounds' => 7,
        ];
    }

    private function generate18TeamDoubleElimination($teams, $eventId)
    {
        // 18-team double elimination structure
        // WR1(2) + WR2(8) + WR3(4) + WR4(2) + WR5(1) + LR1(4) + LR2(6) + LR3(2) + LR4(2) + LR5(1) + LR6(1) + GF(1) = 34 matches

        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }

        $matches = [
            // Winners Round 1 - Preliminary matches (2 matches)
            // Match 1: 16 vs 17 → winner plays Seed 1
            ['temp_id' => 'M1', 'round' => 1, 'match_number' => 1, 'bracket' => 'winners',
                'team1_temp_id' => 'team_15', 'team2_temp_id' => 'team_16',
                'team1_name' => $teams[15]['name'], 'team2_name' => $teams[16]['name'],
                'next_match_temp_id' => 'M11', 'loser_to' => 'M12'],
            // Match 2: 15 vs 18 → winner plays Seed 2
            ['temp_id' => 'M2', 'round' => 1, 'match_number' => 2, 'bracket' => 'winners',
                'team1_temp_id' => 'team_14', 'team2_temp_id' => 'team_17',
                'team1_name' => $teams[14]['name'], 'team2_name' => $teams[17]['name'],
                'next_match_temp_id' => 'M6', 'loser_to' => 'M13'],

            // Winners Round 2 - 8 matches with proper seeding
            // Match 11: 1 vs W(M1)
            ['temp_id' => 'M11', 'round' => 2, 'match_number' => 11, 'bracket' => 'winners',
                'team1_temp_id' => 'team_0', 'team2_temp_id' => null,
                'team1_name' => $teams[0]['name'], 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M20', 'loser_to' => 'M14'],
            // Match 10: 8 vs 9
            ['temp_id' => 'M10', 'round' => 2, 'match_number' => 10, 'bracket' => 'winners',
                'team1_temp_id' => 'team_7', 'team2_temp_id' => 'team_8',
                'team1_name' => $teams[7]['name'], 'team2_name' => $teams[8]['name'],
                'next_match_temp_id' => 'M20', 'loser_to' => 'M13'],
            // Match 9: 4 vs 13
            ['temp_id' => 'M9', 'round' => 2, 'match_number' => 9, 'bracket' => 'winners',
                'team1_temp_id' => 'team_3', 'team2_temp_id' => 'team_12',
                'team1_name' => $teams[3]['name'], 'team2_name' => $teams[12]['name'],
                'next_match_temp_id' => 'M19', 'loser_to' => 'M14'],
            // Match 8: 5 vs 12
            ['temp_id' => 'M8', 'round' => 2, 'match_number' => 8, 'bracket' => 'winners',
                'team1_temp_id' => 'team_4', 'team2_temp_id' => 'team_11',
                'team1_name' => $teams[4]['name'], 'team2_name' => $teams[11]['name'],
                'next_match_temp_id' => 'M19', 'loser_to' => 'M15'],
            // Match 6: 2 vs W(M2)
            ['temp_id' => 'M6', 'round' => 2, 'match_number' => 6, 'bracket' => 'winners',
                'team1_temp_id' => 'team_1', 'team2_temp_id' => null,
                'team1_name' => $teams[1]['name'], 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M18', 'loser_to' => 'M15'],
            // Match 5: 7 vs 10
            ['temp_id' => 'M5', 'round' => 2, 'match_number' => 5, 'bracket' => 'winners',
                'team1_temp_id' => 'team_6', 'team2_temp_id' => 'team_9',
                'team1_name' => $teams[6]['name'], 'team2_name' => $teams[9]['name'],
                'next_match_temp_id' => 'M18', 'loser_to' => 'M16'],
            // Match 4: 3 vs 14
            ['temp_id' => 'M4', 'round' => 2, 'match_number' => 4, 'bracket' => 'winners',
                'team1_temp_id' => 'team_2', 'team2_temp_id' => 'team_13',
                'team1_name' => $teams[2]['name'], 'team2_name' => $teams[13]['name'],
                'next_match_temp_id' => 'M17', 'loser_to' => 'M16'],
            // Match 3: 6 vs 11
            ['temp_id' => 'M3', 'round' => 2, 'match_number' => 3, 'bracket' => 'winners',
                'team1_temp_id' => 'team_5', 'team2_temp_id' => 'team_10',
                'team1_name' => $teams[5]['name'], 'team2_name' => $teams[10]['name'],
                'next_match_temp_id' => 'M17', 'loser_to' => 'M17'],

            // Losers Round 1 - 4 matches from WR1 and WR2 losers
            ['temp_id' => 'M12', 'round' => 6, 'match_number' => 12, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M21', 'loser_to' => null],
            ['temp_id' => 'M13', 'round' => 6, 'match_number' => 13, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M22', 'loser_to' => null],
            ['temp_id' => 'M14', 'round' => 6, 'match_number' => 14, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M23', 'loser_to' => null],
            ['temp_id' => 'M15', 'round' => 6, 'match_number' => 15, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M24', 'loser_to' => null],

            // Winners Round 3 - 4 matches
            ['temp_id' => 'M20', 'round' => 3, 'match_number' => 20, 'bracket' => 'winners',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M28', 'loser_to' => 'M24'],
            ['temp_id' => 'M19', 'round' => 3, 'match_number' => 19, 'bracket' => 'winners',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M28', 'loser_to' => 'M23'],
            ['temp_id' => 'M18', 'round' => 3, 'match_number' => 18, 'bracket' => 'winners',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M27', 'loser_to' => 'M22'],
            ['temp_id' => 'M17', 'round' => 3, 'match_number' => 17, 'bracket' => 'winners',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M27', 'loser_to' => 'M21'],

            // Losers Round 2 - 6 matches
            ['temp_id' => 'M21', 'round' => 7, 'match_number' => 21, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M25', 'loser_to' => null],
            ['temp_id' => 'M22', 'round' => 7, 'match_number' => 22, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M25', 'loser_to' => null],
            ['temp_id' => 'M23', 'round' => 7, 'match_number' => 23, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M26', 'loser_to' => null],
            ['temp_id' => 'M24', 'round' => 7, 'match_number' => 24, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M26', 'loser_to' => null],
            ['temp_id' => 'M16', 'round' => 7, 'match_number' => 16, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M25', 'loser_to' => null],
            ['temp_id' => 'M7', 'round' => 7, 'match_number' => 7, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M26', 'loser_to' => null],

            // Winners Round 4 - 2 matches
            ['temp_id' => 'M28', 'round' => 4, 'match_number' => 28, 'bracket' => 'winners',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M32', 'loser_to' => 'M29'],
            ['temp_id' => 'M27', 'round' => 4, 'match_number' => 27, 'bracket' => 'winners',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M32', 'loser_to' => 'M30'],

            // Losers Round 3 - 2 matches
            ['temp_id' => 'M25', 'round' => 8, 'match_number' => 25, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M29', 'loser_to' => null],
            ['temp_id' => 'M26', 'round' => 8, 'match_number' => 26, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M30', 'loser_to' => null],

            // Losers Round 4 - 2 matches
            ['temp_id' => 'M29', 'round' => 9, 'match_number' => 29, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M31', 'loser_to' => null],
            ['temp_id' => 'M30', 'round' => 9, 'match_number' => 30, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M31', 'loser_to' => null],

            // Winners Finals
            ['temp_id' => 'M32', 'round' => 5, 'match_number' => 32, 'bracket' => 'winners',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M34', 'loser_to' => 'M33'],

            // Losers Finals
            ['temp_id' => 'M31', 'round' => 10, 'match_number' => 31, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M33', 'loser_to' => null],

            // Losers Round 6
            ['temp_id' => 'M33', 'round' => 11, 'match_number' => 33, 'bracket' => 'losers',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => 'M34', 'loser_to' => null],

            // Grand Finals
            ['temp_id' => 'M34', 'round' => 12, 'match_number' => 34, 'bracket' => 'grand_finals',
                'team1_temp_id' => null, 'team2_temp_id' => null,
                'team1_name' => 'TBD', 'team2_name' => 'TBD',
                'next_match_temp_id' => null, 'loser_to' => null],
        ];

        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => 12,
            'bracket_type' => 'double',
            'winners_rounds' => 5,
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
        \Log::info('generateDoubleEliminationBracket called with ' . $teamCount . ' teams');
        
        // Validate minimum team count for double elimination
        if ($teamCount < 3) {
            throw new \InvalidArgumentException('Double elimination requires at least 3 teams. You have ' . $teamCount . ' team(s). Please add more teams or use single elimination.');
        }
        
        // Use the new ChallongeDoubleEliminationController for all team counts
        $deController = new ChallongeDoubleEliminationController();
        
        try {
            $bracket = $deController->generateDoubleEliminationBracket($teams, $eventId);
            
            \Log::info('ChallongeDoubleEliminationController SUCCESS - Generated ' . count($bracket['matches']) . ' matches');
            
            // Count matches by bracket
            $winnerCount = 0;
            $loserCount = 0;
            $finalsCount = 0;
            foreach ($bracket['matches'] as $match) {
                if (isset($match['bracket'])) {
                    if ($match['bracket'] === 'winners') $winnerCount++;
                    elseif ($match['bracket'] === 'losers') $loserCount++;
                    elseif (strpos($match['bracket'], 'grand_finals') !== false) $finalsCount++;
                }
            }
            \Log::info("Bracket breakdown for {$teamCount} teams - Winners: {$winnerCount}, Losers: {$loserCount}, Finals: {$finalsCount}");
            
            // Prepare teams array with proper format
            $teamsWithIds = [];
            foreach ($teams as $index => $team) {
                $teamsWithIds[] = array_merge($team, [
                    'temp_id' => 'team_' . $index,
                    'seed' => $index + 1,
                ]);
            }
            
            // Convert to format expected by frontend
            return [
                'teams' => $teamsWithIds, // Actual teams with temp IDs
                'matches' => $this->convertChallongeMatchesToFrontend($bracket['matches'], $teams),
                'total_rounds' => $bracket['total_rounds'],
                'winners_rounds' => $bracket['winners_rounds'],
                'losers_rounds' => $bracket['losers_rounds'],
                'bracket_type' => 'double',
                'bracket_size' => $bracket['bracket_size'],
                'team_count' => $bracket['team_count'],
                'bye_count' => $bracket['bye_count'],
            ];
        } catch (\Exception $e) {
            \Log::error('ChallongeDoubleEliminationController FAILED - Error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            // Fallback to old method if new one fails
            \Log::info('Falling back to legacy double elimination generation');
            return $this->generateDoubleEliminationBracketLegacy($teams, $eventId);
        }
    }
    
    /**
     * Convert Challonge matches format to frontend-expected format
     */
    private function convertChallongeMatchesToFrontend($challongeMatches, $teams)
    {
        $matches = [];
        $skippedCount = 0;
        
        foreach ($challongeMatches as $match) {
            // Skip bye matches (these are automatic advances, not real matches)
            if (isset($match['is_bye']) && $match['is_bye']) {
                $skippedCount++;
                \Log::debug('Skipping bye match: ' . $match['id']);
                continue;
            }
            
            // DEBUG: Log first match
            if (count($matches) === 0) {
                \Log::info('FIRST MATCH IN CONVERSION:', [
                    'has_id' => isset($match['id']),
                    'id_value' => $match['id'] ?? 'MISSING',
                    'is_bye' => $match['is_bye'] ?? false,
                ]);
            }
            
            // Convert Challonge format to frontend format
            $converted = [
                'id' => $match['id'] ?? null, // Use semantic ID (WR1_M1, LR2_M14, etc.)
                'temp_id' => $match['id'],
                'match_number' => $match['match_number'],
                'round' => $match['round'],
                'bracket' => $match['bracket'],
                'losers_round' => $match['losers_round'] ?? null,  // CRITICAL FOR LOSERS BRACKET
                'round_name' => $match['round_name'] ?? null,
                'position' => $match['position'] ?? null,
                'team1_temp_id' => null,
                'team2_temp_id' => null,
                'team1_name' => $match['team1_name'] ?? 'TBD',
                'team2_name' => $match['team2_name'] ?? 'TBD',
                'team1_seed' => $match['team1_seed'] ?? null,
                'team2_seed' => $match['team2_seed'] ?? null,
                'winner_to' => $match['winner_to'] ?? null,
                'next_match_temp_id' => $match['winner_to'] ?? null,
                'loser_to' => $match['loser_to'] ?? null,
                'previous_match_loser_1' => $match['previous_match_loser_1'] ?? null,
                'previous_match_loser_2' => $match['previous_match_loser_2'] ?? null,
            ];
            
            // Map team seeds to temp IDs
            if (isset($match['team1_seed']) && $match['team1_seed']) {
                $teamIndex = $match['team1_seed'] - 1;
                if (isset($teams[$teamIndex])) {
                    $converted['team1_temp_id'] = 'team_' . $teamIndex;
                }
            }
            
            if (isset($match['team2_seed']) && $match['team2_seed']) {
                $teamIndex = $match['team2_seed'] - 1;
                if (isset($teams[$teamIndex])) {
                    $converted['team2_temp_id'] = 'team_' . $teamIndex;
                }
            }
            
            $matches[] = $converted;
        }
        
        \Log::info('Converted ' . count($matches) . ' matches (skipped ' . $skippedCount . ' bye matches)');
        
        return $matches;
    }
    
    /**
     * Legacy double elimination generation (fallback)
     */
    private function generateDoubleEliminationBracketLegacy($teams, $eventId)
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

        if (count($teams) == 16) {
            return $this->generate16TeamDoubleElimination($teams, $eventId);
        }

        if (count($teams) == 17) {
            return $this->generate17TeamDoubleElimination($teams, $eventId);
        }
        
        if (count($teams) == 18) {
            return $this->generate18TeamDoubleElimination($teams, $eventId);
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

        // Challonge-style round robin scheduling
        // If odd number of teams, add a dummy "BYE" team
        $scheduleTeams = $teams;
        $isOddTeams = $teamCount % 2 === 1;
        
        if ($isOddTeams) {
            $scheduleTeams[] = ['name' => 'BYE', 'temp_id' => 'bye'];
            $teamCount++;
        }

        // Round robin algorithm: N-1 rounds for N teams
        $totalRounds = $teamCount - 1;
        $rounds = [];

        for ($round = 1; $round <= $totalRounds; $round++) {
            $rounds[$round] = [];
            
            // Generate matches for this round using round-robin rotation
            for ($i = 0; $i < $teamCount / 2; $i++) {
                // Calculate team indices using round-robin rotation
                $team1Index = $i;
                $team2Index = $teamCount - 1 - $i;
                
                // Rotate teams (except first team which stays fixed)
                if ($round > 1) {
                    if ($team1Index > 0) {
                        $team1Index = (($team1Index - 1 + $round - 1) % ($teamCount - 1)) + 1;
                    }
                    if ($team2Index > 0) {
                        $team2Index = (($team2Index - 1 + $round - 1) % ($teamCount - 1)) + 1;
                    }
                }

                $team1 = $scheduleTeams[$team1Index];
                $team2 = $scheduleTeams[$team2Index];

                // Skip matches involving BYE team
                if ($team1['name'] === 'BYE' || $team2['name'] === 'BYE') {
                    // Record which team has the bye
                    $byeTeam = $team1['name'] === 'BYE' ? $team2 : $team1;
                    if ($byeTeam['name'] !== 'BYE') {
                        $rounds[$round][] = [
                            'temp_id' => 'bye_' . $round . '_' . $byeTeam['name'],
                            'round' => $round,
                            'match_number' => null,
                            'team1_temp_id' => 'team_' . array_search($byeTeam, $teams),
                            'team2_temp_id' => 'bye',
                            'team1_name' => $byeTeam['name'],
                            'team2_name' => 'BYE',
                            'is_bye' => true,
                            'next_match_temp_id' => null,
                        ];
                    }
                    continue;
                }

                // Add regular match
                $rounds[$round][] = [
                    'temp_id' => 'match_' . $round . '_' . $matchCounter,
                    'round' => $round,
                    'match_number' => $matchCounter,
                    'team1_temp_id' => 'team_' . array_search($team1, $teams),
                    'team2_temp_id' => 'team_' . array_search($team2, $teams),
                    'team1_name' => $team1['name'],
                    'team2_name' => $team2['name'],
                    'is_bye' => false,
                    'next_match_temp_id' => null,
                ];
                $matchCounter++;
            }
        }

        // Flatten rounds into matches array (excluding bye entries)
        foreach ($rounds as $roundMatches) {
            foreach ($roundMatches as $match) {
                if (!$match['is_bye']) {
                    $matches[] = $match;
                }
            }
        }

        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }

        // Calculate total matches: N × (N-1) / 2
        $originalTeamCount = count($teams);
        $totalMatches = ($originalTeamCount * ($originalTeamCount - 1)) / 2;

        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => $totalRounds,
            'total_matches' => $totalMatches,
            'matches_per_team' => $originalTeamCount - 1,
            'has_byes' => $isOddTeams,
            'rounds_schedule' => $rounds, // Include full schedule with byes for frontend
            'is_round_robin' => true,
        ];
    }
}
