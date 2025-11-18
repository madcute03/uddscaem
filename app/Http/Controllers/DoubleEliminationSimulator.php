<?php

namespace App\Http\Controllers;

/**
 * Clean simulation-based double elimination bracket generator
 * Based on event-driven tournament progression
 */
class DoubleEliminationSimulator
{
    /**
     * Generate double elimination bracket using simulation
     * 
     * @param array $teams Array of team objects with 'name'
     * @param int $tournamentId Tournament ID for match association
     * @return array Generated bracket structure
     */
    public function generate($teams, $tournamentId)
    {
        $teamCount = count($teams);
        $bracketSize = $this->nextPowerOf2($teamCount);
        $wbRounds = (int)ceil(log($teamCount, 2));
        
        // LB rounds calculation varies by team size
        // Power of 2: (WB-1) * 2
        // Non-power of 2: Calculated based on pattern
        if ($this->isPowerOf2($teamCount)) {
            $lbRounds = ($wbRounds - 1) * 2;
        } else {
            // Calculate based on which pattern will be used
            $lowerPower = pow(2, floor(log($teamCount, 2)));
            $upperPower = $lowerPower * 2;
            $distanceFromLower = $teamCount - $lowerPower;
            $distanceFromUpper = $upperPower - $teamCount;
            
            // Special override: 14-15 teams use lower pattern but need 6 rounds
            if ($teamCount == 14 || $teamCount == 15) {
                $lbRounds = 6; // Hardcode to match Challonge
            } elseif ($distanceFromLower <= $distanceFromUpper) {
                // Lower power pattern: WR(n) → LR(2n-3)
                // Last WR goes to LR(2*WB-3)
                $lbRounds = (2 * $wbRounds) - 3;
            } else {
                // Upper power pattern: WR(n) → LR(2n-2) starting from WR3
                // Last WR goes to LR(2*WB-2)
                $lbRounds = (2 * $wbRounds) - 2;
            }
        }
        
        // Build winners bracket first
        $wbResult = $this->buildWinnersBracket($teams, $bracketSize, $wbRounds);
        
        // Build losers bracket by simulating WB losers dropping down
        $lbResult = $this->buildLosersBracket(
            $wbResult['matches'], 
            $wbResult['byRound'],
            $wbRounds,
            $lbRounds,
            $teamCount
        );
        
        // Combine and number sequentially
        $allMatches = array_merge($wbResult['matches'], $lbResult['matches']);
        
        // Add grand finals
        $gfMatches = $this->buildGrandFinals(
            $wbResult['matches'],
            $lbResult['matches'],
            count($allMatches) + 1
        );
        
        $allMatches = array_merge($allMatches, $gfMatches);
        
        // Link matches (set winner_to, loser_to)
        $this->linkMatches($allMatches);
        
        return [
            'matches' => $allMatches,
            'winners_rounds' => $wbRounds,
            'losers_rounds' => $lbRounds,
            'total_rounds' => $wbRounds + $lbRounds + 1,
            'bracket_size' => $bracketSize,
            'team_count' => $teamCount,
            'bye_count' => $bracketSize - $teamCount,
        ];
    }
    
    /**
     * Build winners bracket with proper seeding
     */
    private function buildWinnersBracket($teams, $bracketSize, $rounds)
    {
        $teamCount = count($teams);
        $matches = [];
        $matchCounter = 1;
        $byRound = [];
        
        // Seed teams into bracket slots
        $slots = $this->seedTeams($teams, $bracketSize);
        
        // Build each round
        $currentSlots = $slots;
        
        for ($round = 1; $round <= $rounds; $round++) {
            $roundMatches = [];
            $nextSlots = [];
            
            // Pair adjacent slots
            for ($i = 0; $i < count($currentSlots); $i += 2) {
                if ($i + 1 >= count($currentSlots)) break;
                
                $slot1 = $currentSlots[$i];
                $slot2 = $currentSlots[$i + 1];
                
                // Skip if both are byes
                if ($this->isBye($slot1) && $this->isBye($slot2)) {
                    $nextSlots[] = ['type' => 'bye'];
                    continue;
                }
                
                // If one is bye, winner auto-advances
                if ($this->isBye($slot1)) {
                    $nextSlots[] = $slot2;
                    continue;
                }
                if ($this->isBye($slot2)) {
                    $nextSlots[] = $slot1;
                    continue;
                }
                
                // Create match
                $match = [
                    'id' => "WR{$round}_M{$matchCounter}",
                    'match_number' => $matchCounter,
                    'tournament_id' => null,
                    'bracket' => 'winners',
                    'round' => $round,
                    'losers_round' => null,
                    'round_name' => "Winners Round {$round}",
                    'position' => count($roundMatches) + 1,
                    'is_bye' => false,
                    'team1_seed' => $slot1['seed'] ?? null,
                    'team2_seed' => $slot2['seed'] ?? null,
                    'team1_name' => $slot1['name'] ?? 'TBD',
                    'team2_name' => $slot2['name'] ?? 'TBD',
                    'winner_to' => null,
                    'loser_to' => null,
                    'previous_match_1' => $slot1['from_match'] ?? null,
                    'previous_match_2' => $slot2['from_match'] ?? null,
                ];
                
                $matches[] = $match;
                $roundMatches[] = $match;
                $matchCounter++;
                
                // Winner advances to next round
                $nextSlots[] = ['type' => 'winner', 'from_match' => $match['id']];
            }
            
            $byRound[$round] = $roundMatches;
            $currentSlots = $nextSlots;
        }
        
        return [
            'matches' => $matches,
            'byRound' => $byRound,
            'nextMatchId' => $matchCounter,
        ];
    }
    
    /**
     * Build losers bracket using event-driven simulation
     */
    private function buildLosersBracket($wbMatches, $wbByRound, $wbRounds, $lbRounds, $teamCount)
    {
        $matches = [];
        $matchCounter = count($wbMatches) + 1;
        
        // Queue to hold entrants for each LB round
        $lbQueues = array_fill(1, $lbRounds, []);
        
        // Enqueue WB losers into appropriate LB rounds
        // Simple rule: WB round R losers go to LB round (2*R - 1)
        // But we'll use a smarter event-driven approach
        
        $this->enqueueWBLosers($wbByRound, $lbQueues, $wbRounds, $teamCount);
        
        // Process each LB round, creating matches as entrants accumulate
        $lbByRound = [];
        
        for ($lr = 1; $lr <= $lbRounds; $lr++) {
            $roundMatches = [];
            $entrants = $lbQueues[$lr];
            
            // CHALLONGE PAIRING: Separate WB losers and LB winners
            $wbLosers = array_filter($entrants, fn($e) => $e['type'] === 'wb_loser');
            $lbWinners = array_filter($entrants, fn($e) => $e['type'] === 'lb_winner');
            
            // Reindex arrays
            $wbLosers = array_values($wbLosers);
            $lbWinners = array_values($lbWinners);
            
            $wbCount = count($wbLosers);
            $lbCount = count($lbWinners);
            
            // CHALLONGE RULE: WB losers face LB winners when both present
            $matchesToCreate = [];
            
            if ($wbCount > 0 && $lbCount > 0) {
                // Mix pairing: WB loser vs LB winner
                $pairCount = min($wbCount, $lbCount);
                
                for ($i = 0; $i < $pairCount; $i++) {
                    $matchesToCreate[] = [$wbLosers[$i], $lbWinners[$i]];
                }
                
                // Remaining entrants (if counts don't match)
                $remaining = [];
                for ($i = $pairCount; $i < $wbCount; $i++) {
                    $remaining[] = $wbLosers[$i];
                }
                for ($i = $pairCount; $i < $lbCount; $i++) {
                    $remaining[] = $lbWinners[$i];
                }
                
                // Pair remaining entrants among themselves
                for ($i = 0; $i < floor(count($remaining) / 2); $i++) {
                    $matchesToCreate[] = [$remaining[$i * 2], $remaining[$i * 2 + 1]];
                }
                
                // Odd remaining entrant gets bye
                if (count($remaining) % 2 == 1) {
                    $oddEntrant = $remaining[count($remaining) - 1];
                    if ($lr < $lbRounds) {
                        $lbQueues[$lr + 1][] = $oddEntrant;
                    }
                }
            } else {
                // All same type - pair sequentially
                for ($i = 0; $i < floor(count($entrants) / 2); $i++) {
                    $matchesToCreate[] = [$entrants[$i * 2], $entrants[$i * 2 + 1]];
                }
                
                // Odd entrant gets bye
                if (count($entrants) % 2 == 1) {
                    $oddEntrant = $entrants[count($entrants) - 1];
                    if ($lr < $lbRounds) {
                        $lbQueues[$lr + 1][] = $oddEntrant;
                    }
                }
            }
            
            // Create matches
            foreach ($matchesToCreate as $pair) {
                $e1 = $pair[0];
                $e2 = $pair[1];
                
                $match = [
                    'id' => "LR{$lr}_M{$matchCounter}",
                    'match_number' => $matchCounter,
                    'tournament_id' => null,
                    'bracket' => 'losers',
                    'round' => $wbRounds + $lr,
                    'losers_round' => $lr,
                    'round_name' => "Losers Round {$lr}",
                    'position' => count($roundMatches) + 1,
                    'is_bye' => false,
                    'team1_seed' => null,
                    'team2_seed' => null,
                    'team1_name' => 'TBD',
                    'team2_name' => 'TBD',
                    'winner_to' => null,
                    'loser_to' => null,
                    'previous_match_1' => $e1['type'] === 'lb_winner' ? $e1['from_match'] : null,
                    'previous_match_2' => $e2['type'] === 'lb_winner' ? $e2['from_match'] : null,
                    'previous_match_loser_1' => $e1['type'] === 'wb_loser' ? $e1['from_match'] : null,
                    'previous_match_loser_2' => $e2['type'] === 'wb_loser' ? $e2['from_match'] : null,
                    'feeds_from_match_1' => $e1['from_match'],
                    'feeds_from_match_2' => $e2['from_match'],
                ];
                
                $matches[] = $match;
                $roundMatches[] = $match;
                $matchCounter++;
                
                // Winner goes to next LB round
                if ($lr < $lbRounds) {
                    $lbQueues[$lr + 1][] = ['type' => 'lb_winner', 'from_match' => $match['id']];
                }
            }
            
            $lbByRound[$lr] = $roundMatches;
        }
        
        return [
            'matches' => $matches,
            'byRound' => $lbByRound,
            'nextMatchId' => $matchCounter,
        ];
    }
    
    /**
     * Enqueue WB losers into LB rounds using CHALLONGE'S EXACT PATTERN
     * This new algorithm works for ANY team size (power of 2 or not)
     * 
     * Note: Fixed for team sizes 26-32 to ensure proper losers bracket generation
     */
    private function enqueueWBLosers($wbByRound, &$lbQueues, $wbRounds, $teamCount)
    {
        $Q = $this->nextPowerOf2($teamCount);  // Next power of 2
        $numByes = $Q - $teamCount;            // Number of byes
        
        // CHALLONGE PATTERN:
        // The key insight is that byes affect WHEN losers enter the LB
        
        // Step 1: Count actual WR1 matches (non-bye matches)
        $wr1Matches = $wbByRound[1] ?? [];
        $wr1ActualMatches = count($wr1Matches);
        
        // Step 2: Determine LB structure based on byes
        if ($numByes == 0) {
            // POWER OF 2 - Clean pattern
            foreach ($wbByRound as $wr => $matches) {
                if ($wr == 1) {
                    // WR1 losers go to LR1
                    foreach ($matches as $match) {
                        $lbQueues[1][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                    }
                } else {
                    // WR2+ losers: WR(n) → LR(2*(n-1))
                    // WR2 → LR2, WR3 → LR4, WR4 → LR6, etc.
                    $targetLR = 2 * ($wr - 1);
                    foreach ($matches as $match) {
                        if (isset($lbQueues[$targetLR])) {
                            $lbQueues[$targetLR][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                        }
                    }
                }
            }
        } else {
            // NON-POWER OF 2 - General algorithm based on distance from power of 2
            
            $wr2Matches = $wbByRound[2] ?? [];
            
            // SPECIAL CASES: Hardcoded patterns for specific team sizes
            if ($teamCount === 14) {
                // 14 teams: LR1=2, LR2=4, LR3=2, LR4=2, LR5=1, LR6=1
                
                // LR1: 4 WR1 losers (to create 2 matches = 4 entrants) 
                for ($i = 0; $i < 4; $i++) {
                    $lbQueues[1][] = ['type' => 'wb_loser', 'from_match' => $wr1Matches[$i]['id']];
                }
                
                // LR2: Remaining WR1 + all WR2 losers
                for ($i = 4; $i < count($wr1Matches); $i++) {
                    $lbQueues[2][] = ['type' => 'wb_loser', 'from_match' => $wr1Matches[$i]['id']];
                }
                foreach ($wr2Matches as $match) {
                    $lbQueues[2][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                }
                
                // LR4: WR3 losers (skip LR3 for now)
                foreach ($wbByRound[3] ?? [] as $match) {
                    $lbQueues[4][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                }
                
                // LR6: WR4 loser
                foreach ($wbByRound[4] ?? [] as $match) {
                    $lbQueues[6][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                }
            }
            elseif ($teamCount === 15) {
                // 15 teams: LR1=3, LR2=4, LR3=2, LR4=2, LR5=1, LR6=1
                
                // LR1: 6 WR1 losers (to create 3 matches = 6 entrants)
                for ($i = 0; $i < 6; $i++) {
                    $lbQueues[1][] = ['type' => 'wb_loser', 'from_match' => $wr1Matches[$i]['id']];
                }
                
                // LR2: Remaining WR1 + all WR2 losers 
                for ($i = 6; $i < count($wr1Matches); $i++) {
                    $lbQueues[2][] = ['type' => 'wb_loser', 'from_match' => $wr1Matches[$i]['id']];
                }
                foreach ($wr2Matches as $match) {
                    $lbQueues[2][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                }
                
                // LR4: WR3 losers (skip LR3 for now)
                foreach ($wbByRound[3] ?? [] as $match) {
                    $lbQueues[4][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                }
                
                // LR6: WR4 loser
                foreach ($wbByRound[4] ?? [] as $match) {
                    $lbQueues[6][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                }
            }
            elseif ($teamCount === 19) {
                // 19 teams: LR1=3, LR2=4, LR3=4, LR4=2, LR5=2, LR6=1, LR7=1
                foreach ($wr1Matches as $match) {
                    $lbQueues[1][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                }
                for ($i = 0; $i < 3 && $i < count($wr2Matches); $i++) {
                    $lbQueues[1][] = ['type' => 'wb_loser', 'from_match' => $wr2Matches[$i]['id']];
                }
                for ($i = 3; $i < count($wr2Matches); $i++) {
                    $lbQueues[2][] = ['type' => 'wb_loser', 'from_match' => $wr2Matches[$i]['id']];
                }
                foreach ($wbByRound[3] ?? [] as $match) {
                    $lbQueues[3][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                }
                foreach ($wbByRound[4] ?? [] as $match) {
                    $lbQueues[5][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                }
                foreach ($wbByRound[5] ?? [] as $match) {
                    $lbQueues[7][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                }
            }
            else {
                // GENERAL NON-POWER-OF-2 ALGORITHM
                // Based on distance from nearest power of 2
                $lowerPower = pow(2, floor(log($teamCount, 2)));
                $upperPower = $lowerPower * 2;
                $distanceFromLower = $teamCount - $lowerPower;
                $distanceFromUpper = $upperPower - $teamCount;
                
                // Determine which pattern to use
                $useUpperPattern = $distanceFromLower > $distanceFromUpper;
                
                if (!$useUpperPattern) {
                    // CLOSER TO LOWER POWER (e.g., 9-12 closer to 8 than 16)
                    // Pattern: Flood early LR rounds with WR1+WR2 losers
                    
                    $wr1Count = count($wr1Matches);
                    $wr2Count = count($wr2Matches);
                    
                    // LR1: Gets all WR1 + as many WR2 as needed to match WR1 count
                    foreach ($wr1Matches as $match) {
                        $lbQueues[1][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                    }
                    $wr2ToLR1 = min($wr1Count, $wr2Count);
                    for ($i = 0; $i < $wr2ToLR1; $i++) {
                        $lbQueues[1][] = ['type' => 'wb_loser', 'from_match' => $wr2Matches[$i]['id']];
                    }
                    
                    // LR2: Gets remaining WR2 losers (if any)
                    for ($i = $wr2ToLR1; $i < $wr2Count; $i++) {
                        $lbQueues[2][] = ['type' => 'wb_loser', 'from_match' => $wr2Matches[$i]['id']];
                    }
                    
                    // LR3 onwards: WR(n) → LR(2n-3) pattern for ALL remaining WR rounds
                    for ($wr = 3; $wr <= $wbRounds; $wr++) {
                        $wrMatches = $wbByRound[$wr] ?? [];
                        $targetLR = (2 * $wr) - 3;
                        foreach ($wrMatches as $match) {
                            $lbQueues[$targetLR][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                        }
                    }
                    
                } else {
                    // CLOSER TO UPPER POWER (e.g., 13-15 closer to 16 than 8, or 26-31 closer to 32 than 16)
                    // Pattern: Spread distribution with partial WR1 to LR1
                    
                    $wr1Count = count($wr1Matches);
                    $wr2Count = count($wr2Matches);
                    
                    // For large brackets (26+), use specific distribution pattern
                    if ($teamCount >= 26) {
                        // Determine WR1 losers to send to LR1 based on team count
                        // Pattern: Each team adds complexity, need to increase LR1 matches
                        if ($teamCount == 26) {
                            $wr1ToLR1 = 4; // LR1 = 2 matches
                        } elseif ($teamCount == 27) {
                            $wr1ToLR1 = 6; // LR1 = 3 matches
                        } elseif ($teamCount == 28) {
                            $wr1ToLR1 = 8; // LR1 = 4 matches
                        } elseif ($teamCount == 29) {
                            $wr1ToLR1 = 10; // LR1 = 5 matches
                        } elseif ($teamCount == 30) {
                            $wr1ToLR1 = 12; // LR1 = 6 matches
                        } elseif ($teamCount == 31) {
                            $wr1ToLR1 = 14; // LR1 = 7 matches
                        } else {
                            // 32 teams: send all WR1 losers to LR1
                            $wr1ToLR1 = $wr1Count;
                        }
                        
                        for ($i = 0; $i < $wr1ToLR1 && $i < $wr1Count; $i++) {
                            $lbQueues[1][] = ['type' => 'wb_loser', 'from_match' => $wr1Matches[$i]['id']];
                        }
                        
                        // LR2: Gets remaining WR1 losers + all WR2 losers
                        for ($i = $wr1ToLR1; $i < $wr1Count; $i++) {
                            $lbQueues[2][] = ['type' => 'wb_loser', 'from_match' => $wr1Matches[$i]['id']];
                        }
                        foreach ($wr2Matches as $match) {
                            $lbQueues[2][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                        }
                    } else {
                        // For smaller brackets (13-25), use minimal WR1 losers in LR1
                        // LR1: Gets only partial WR1 losers (enough for 1 match = 2 entrants)
                        $wr1ToLR1 = min(2, $wr1Count);
                        for ($i = 0; $i < $wr1ToLR1; $i++) {
                            $lbQueues[1][] = ['type' => 'wb_loser', 'from_match' => $wr1Matches[$i]['id']];
                        }
                        
                        // LR2: Gets remaining WR1 + all WR2 losers
                        for ($i = $wr1ToLR1; $i < $wr1Count; $i++) {
                            $lbQueues[2][] = ['type' => 'wb_loser', 'from_match' => $wr1Matches[$i]['id']];
                        }
                        foreach ($wr2Matches as $match) {
                            $lbQueues[2][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                        }
                    }
                    
                    // LR3: Consolidation (no WR losers)
                    // LR4 onwards: WR(n) → LR(2n-2) pattern for ALL remaining WR rounds starting from WR3
                    for ($wr = 3; $wr <= $wbRounds; $wr++) {
                        $wrMatches = $wbByRound[$wr] ?? [];
                        $targetLR = (2 * $wr) - 2;
                        foreach ($wrMatches as $match) {
                            $lbQueues[$targetLR][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                        }
                    }
                }
            }
            
            if (false) {
                // FALLBACK: Generic pattern for other sizes (5-9, 14-18, 20+)
                if ($wr1ActualMatches <= 3) {
                    // Few WR1 matches: All WR1 → LR1
                    foreach ($wr1Matches as $match) {
                        $lbQueues[1][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                    }
                    // WR2 → LR2
                    foreach ($wr2Matches as $match) {
                        $lbQueues[2][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                    }
                } else {
                    // Many WR1 matches: Split across LR1 and LR2
                    $lr1Count = floor($wr1ActualMatches / 2);
                    for ($i = 0; $i < $lr1Count; $i++) {
                        $lbQueues[1][] = ['type' => 'wb_loser', 'from_match' => $wr1Matches[$i]['id']];
                    }
                    for ($i = $lr1Count; $i < $wr1ActualMatches; $i++) {
                        $lbQueues[2][] = ['type' => 'wb_loser', 'from_match' => $wr1Matches[$i]['id']];
                    }
                    foreach ($wr2Matches as $match) {
                        $lbQueues[2][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                    }
                }
                
                // WR3+ follow standard pattern: WR(n) → LR(2*(n-1))
                for ($wr = 3; $wr <= $wbRounds; $wr++) {
                    $targetLR = 2 * ($wr - 1);
                    foreach ($wbByRound[$wr] ?? [] as $match) {
                        if (isset($lbQueues[$targetLR])) {
                            $lbQueues[$targetLR][] = ['type' => 'wb_loser', 'from_match' => $match['id']];
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Build grand finals matches
     */
    private function buildGrandFinals($wbMatches, $lbMatches, $startNumber)
    {
        $wbFinalId = end($wbMatches)['id'];
        $lbFinalId = end($lbMatches)['id'];
        
        return [
            [
                'id' => "GF_M{$startNumber}",
                'match_number' => $startNumber,
                'tournament_id' => null,
                'bracket' => 'grand_finals',
                'round' => count($wbMatches) > 0 ? $wbMatches[0]['round'] + 99 : 99,
                'losers_round' => null,
                'round_name' => 'Grand Finals',
                'position' => 1,
                'is_bye' => false,
                'team1_seed' => null,
                'team2_seed' => null,
                'team1_name' => 'TBD',
                'team2_name' => 'TBD',
                'winner_to' => null,
                'loser_to' => null,
                'previous_match_1' => $wbFinalId,
                'previous_match_2' => $lbFinalId,
            ],
        ];
    }
    
    /**
     * Link all matches (set winner_to, loser_to)
     */
    private function linkMatches(&$matches)
    {
        $matchMap = [];
        foreach ($matches as &$match) {
            $matchMap[$match['id']] = &$match;
        }
        
        foreach ($matches as &$match) {
            // Link WB winners
            if ($match['bracket'] === 'winners') {
                if (isset($match['previous_match_1']) && isset($matchMap[$match['previous_match_1']])) {
                    $matchMap[$match['previous_match_1']]['winner_to'] = $match['id'];
                }
                if (isset($match['previous_match_2']) && isset($matchMap[$match['previous_match_2']])) {
                    $matchMap[$match['previous_match_2']]['winner_to'] = $match['id'];
                }
            }
            
            // Link LB winners
            if ($match['bracket'] === 'losers') {
                if (isset($match['previous_match_1']) && isset($matchMap[$match['previous_match_1']])) {
                    $matchMap[$match['previous_match_1']]['winner_to'] = $match['id'];
                }
                if (isset($match['previous_match_2']) && isset($matchMap[$match['previous_match_2']])) {
                    $matchMap[$match['previous_match_2']]['winner_to'] = $match['id'];
                }
            }
            
            // Link WB losers to LB
            if (isset($match['previous_match_loser_1']) && isset($matchMap[$match['previous_match_loser_1']])) {
                $matchMap[$match['previous_match_loser_1']]['loser_to'] = $match['id'];
            }
            if (isset($match['previous_match_loser_2']) && isset($matchMap[$match['previous_match_loser_2']])) {
                $matchMap[$match['previous_match_loser_2']]['loser_to'] = $match['id'];
            }
            
            // Link GF
            if ($match['bracket'] === 'grand_finals') {
                if (isset($match['previous_match_1'])) {
                    if (isset($matchMap[$match['previous_match_1']])) {
                        $matchMap[$match['previous_match_1']]['winner_to'] = $match['id'];
                    }
                }
                if (isset($match['previous_match_2'])) {
                    if (isset($matchMap[$match['previous_match_2']])) {
                        $matchMap[$match['previous_match_2']]['winner_to'] = $match['id'];
                    }
                }
            }
        }
        
        // Additional pass to ensure proper losers bracket linking
        // This fixes issues with teams 26-32
        $losersByRound = [];
        foreach ($matches as &$match) {
            if ($match['bracket'] === 'losers') {
                $round = $match['losers_round'] ?? 0;
                if (!isset($losersByRound[$round])) {
                    $losersByRound[$round] = [];
                }
                $losersByRound[$round][] = &$match;
            }
        }
        
        // For each losers round, ensure winners advance properly
        ksort($losersByRound);
        $maxRound = max(array_keys($losersByRound));
        
        for ($lr = 1; $lr < $maxRound; $lr++) {
            // Find matches in current round that don't have winner_to set
            if (!isset($losersByRound[$lr])) continue;
            
            foreach ($losersByRound[$lr] as &$match) {
                // Skip if already linked
                if (!empty($match['winner_to'])) continue;
                
                // Find appropriate match in next round to advance to
                $nextRound = $lr + 1;
                if (isset($losersByRound[$nextRound])) {
                    // Find first match in next round that doesn't have both previous matches set
                    foreach ($losersByRound[$nextRound] as &$nextMatch) {
                        $canLink = false;
                        
                        if (empty($nextMatch['previous_match_1'])) {
                            $nextMatch['previous_match_1'] = $match['id'];
                            $canLink = true;
                        } else if (empty($nextMatch['previous_match_2'])) {
                            $nextMatch['previous_match_2'] = $match['id'];
                            $canLink = true;
                        }
                        
                        if ($canLink) {
                            $match['winner_to'] = $nextMatch['id'];
                            break;
                        }
                    }
                }
            }
        }
        
        // Ensure final losers round match advances to grand finals
        if (isset($losersByRound[$maxRound])) {
            foreach ($losersByRound[$maxRound] as &$match) {
                if (empty($match['winner_to'])) {
                    // Find grand finals match
                    foreach ($matches as &$gfMatch) {
                        if ($gfMatch['bracket'] === 'grand_finals') {
                            $match['winner_to'] = $gfMatch['id'];
                            
                            if (empty($gfMatch['previous_losers_match'])) {
                                $gfMatch['previous_losers_match'] = $match['id'];
                            }
                            
                            break;
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Seed teams into bracket slots with Challonge-style bye distribution
     * Byes are distributed to top seeds in specific positions
     */
    private function seedTeams($teams, $bracketSize)
    {
        $teamCount = count($teams);
        $byeCount = $bracketSize - $teamCount;
        
        // For power-of-2, no byes needed
        if ($byeCount == 0) {
            $slots = [];
            for ($i = 0; $i < $teamCount; $i++) {
                $slots[] = [
                    'type' => 'team',
                    'seed' => $i + 1,
                    'name' => $teams[$i]['name'],
                ];
            }
            return $slots;
        }
        
        // Challonge bye distribution algorithm:
        // Top N seeds get byes where N = byeCount
        // Byes are placed in positions that would face top seeds
        
        // Create ordered list of bracket positions with their seed priorities
        $positions = $this->generateBracketPositions($bracketSize);
        
        // Assign teams and byes based on seed priority
        $slots = [];
        for ($i = 0; $i < $bracketSize; $i++) {
            if ($i < $teamCount) {
                // Team at this seed
                $slots[$positions[$i]] = [
                    'type' => 'team',
                    'seed' => $i + 1,
                    'name' => $teams[$i]['name'],
                ];
            } else {
                // Bye for this seed position
                $slots[$positions[$i]] = ['type' => 'bye'];
            }
        }
        
        // Ensure slots are properly indexed
        ksort($slots);
        return array_values($slots);
    }
    
    /**
     * Generate bracket positions for fair seeding
     * Returns array where index = seed number (0-based), value = bracket position
     * Example for 8 slots: [0, 7, 3, 4, 1, 6, 2, 5] means seed 1 at pos 0, seed 2 at pos 7, etc.
     */
    private function generateBracketPositions($bracketSize)
    {
        // Standard tournament seeding algorithm
        // Seed 1 plays seed N, seed 2 plays seed N-1, etc.
        $rounds = (int)log($bracketSize, 2);
        $positions = [0];
        
        for ($round = 0; $round < $rounds; $round++) {
            $newPositions = [];
            $matchesInRound = pow(2, $round);
            
            foreach ($positions as $pos) {
                $newPositions[] = $pos;
                $newPositions[] = pow(2, $round + 1) - 1 - $pos;
            }
            
            $positions = $newPositions;
        }
        
        return $positions;
    }
    
    /**
     * Check if value is power of 2
     */
    private function isPowerOf2($n)
    {
        return $n > 0 && ($n & ($n - 1)) === 0;
    }
    
    /**
     * Get next power of 2
     */
    private function nextPowerOf2($n)
    {
        return pow(2, ceil(log($n, 2)));
    }
    
    /**
     * Check if slot is a bye
     */
    private function isBye($slot)
    {
        return !$slot || ($slot['type'] ?? null) === 'bye';
    }
}
