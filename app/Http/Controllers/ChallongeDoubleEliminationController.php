<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ChallongeDoubleEliminationController extends Controller
{
    /**
     * Generate Challonge-style double elimination bracket
     * 
     * This creates a complete double elimination bracket with:
     * - Winners bracket using Challonge seeding
     * - Losers bracket with proper loser routing
     * - Match linking (winner_to, loser_to)
     * - Bye handling for non-power-of-2 team counts
     * - Grand Finals with optional bracket reset
     * 
     * @param array $teams Array of team data
     * @param int $eventId Event ID for the tournament
     * @return array Complete double elimination bracket structure
     */
    /**
     * Check if a number is a power of two
     */
    private function isPowerOfTwo($n)
    {
        return ($n > 0) && (($n & ($n - 1)) == 0);
    }
    
    /**
     * Get next power of two greater than or equal to n
     */
    private function getNextPowerOfTwo($n)
    {
        return pow(2, ceil(log($n, 2)));
    }
    
    /**
     * Generate a Challonge-style double elimination bracket
     * Uses simulation-based approach for all team sizes
     */
    public function generateDoubleEliminationBracket($teams, $tournamentId)
    {
        // Use new simulation-based approach for ALL team sizes
        $simulator = new \App\Http\Controllers\DoubleEliminationSimulator();
        $result = $simulator->generate($teams, $tournamentId);
        
        // Add tournament_id to all matches
        foreach ($result['matches'] as &$match) {
            $match['tournament_id'] = $tournamentId;
        }
        
        return $result;
        
        // OLD CODE BELOW - Keep as backup for now
        // ============================================
        
        $teamCount = count($teams);
        
        // Route based on team count
        if (false && $this->isPowerOfTwo($teamCount)) {
            // CLEAN PATH: Power-of-2 teams (4, 8, 16, 32)
            // Uses pure mathematical formulas, no special cases
            return $this->generatePowerOfTwoBracket($teams, $tournamentId);
        } else {
            // COMPLEX PATH: Non-power-of-2 teams (3, 5, 6, 7, 9-15)
            // Uses bye-adjusted formulas to match Challonge structure
            return $this->generateNonPowerOfTwoBracket($teams, $tournamentId);
        }
    }
    
    /**
     * Generate bracket for power-of-two team sizes (4, 8, 16, 32)
     * Clean, mathematical approach with no byes
     */
    private function generatePowerOfTwoBracket($teams, $tournamentId)
    {
        $teamCount = count($teams);
        
        // Get next power of 2 for bracket size
        $bracketSize = $this->getNextPowerOfTwo($teamCount);
        
        // Calculate rounds  
        $winnersRounds = log($bracketSize, 2);
        
        // Get Challonge seed order
        $seedOrder = $this->generateChallongeSeedOrder($bracketSize);
        
        // Create pairings from seed order
        $pairings = $this->createPairingsFromSeedOrder($seedOrder, $teamCount);
        
        // Generate complete bracket structure
        $bracket = $this->buildDoubleEliminationStructure($teams, $pairings, $bracketSize, $tournamentId);
        
        return array_merge($bracket, [
            'bracket_type' => 'double',
            'bracket_size' => $bracketSize,
            'team_count' => $teamCount,
            'bye_count' => 0,
        ]);
    }
    
    /**
     * Generate bracket for non-power-of-two team sizes (3, 5, 6, 7, 9-15)
     * Complex, bye-adjusted approach to match Challonge structure
     */
    private function generateNonPowerOfTwoBracket($teams, $tournamentId)
    {
        $teamCount = count($teams);
        
        if ($teamCount < 3) {
            throw new \InvalidArgumentException('Double elimination requires at least 3 teams');
        }

        // Calculate bracket size and byes
        $bracketSize = pow(2, ceil(log($teamCount, 2)));
        $byeCount = $bracketSize - $teamCount;
        
        // Get Challonge seed order
        $seedOrder = $this->generateChallongeSeedOrder($bracketSize);
        
        // Create pairings from seed order
        $pairings = $this->createPairingsFromSeedOrder($seedOrder, $teamCount);
        
        // Generate complete bracket structure
        $bracket = $this->buildDoubleEliminationStructure($teams, $pairings, $bracketSize, $tournamentId);
        
        return array_merge($bracket, [
            'bracket_type' => 'double',
            'bracket_size' => $bracketSize,
            'team_count' => $teamCount,
            'bye_count' => $byeCount,
        ]);
    }

    /**
     * Generate Challonge-style seed order (same as single elimination)
     * 
     * @param int $bracketSize Power of 2 bracket size
     * @return array Ordered seed positions
     */
    private function generateChallongeSeedOrder($bracketSize)
    {
        $patterns = [
            2 => [1, 2],
            4 => [1, 4, 3, 2],
            8 => [1, 8, 5, 4, 3, 6, 7, 2],
            16 => [1, 16, 9, 8, 5, 12, 13, 4, 3, 14, 11, 6, 7, 10, 15, 2],
            32 => [1, 32, 17, 16, 9, 24, 25, 8, 5, 28, 21, 12, 13, 20, 29, 4,
                   3, 30, 19, 14, 11, 22, 27, 6, 7, 26, 23, 10, 15, 18, 31, 2],
            64 => [1, 64, 33, 32, 17, 48, 49, 16, 9, 56, 41, 24, 25, 40, 57, 8,
                   5, 60, 37, 28, 21, 44, 53, 12, 13, 52, 45, 20, 29, 36, 61, 4,
                   3, 62, 35, 30, 19, 46, 51, 14, 11, 54, 43, 22, 27, 38, 59, 6,
                   7, 58, 39, 26, 23, 42, 55, 10, 15, 50, 47, 18, 31, 34, 63, 2],
        ];

        if (isset($patterns[$bracketSize])) {
            return $patterns[$bracketSize];
        }

        return $this->generateChallongeSeedOrderRecursive($bracketSize);
    }

    /**
     * Recursively generate Challonge seed order for any power-of-2 bracket size
     * 
     * @param int $bracketSize Power of 2 bracket size
     * @return array Ordered seed positions
     */
    private function generateChallongeSeedOrderRecursive($bracketSize)
    {
        if ($bracketSize == 2) {
            return [1, 2];
        }

        $rounds = log($bracketSize, 2);
        $seeds = [1, $bracketSize];

        for ($round = 1; $round < $rounds; $round++) {
            $newSeeds = [];
            foreach ($seeds as $seed) {
                $newSeeds[] = $seed;
                $complement = $bracketSize + 1 - $seed;
                $newSeeds[] = $complement;
            }
            $seeds = $newSeeds;
        }

        return $seeds;
    }

    /**
     * Create match pairings from Challonge seed order
     * 
     * @param array $seedOrder Challonge-ordered seed positions
     * @param int $teamCount Actual number of teams
     * @return array Array of [seedA, seedB] pairings
     */
    private function createPairingsFromSeedOrder($seedOrder, $teamCount)
    {
        $pairings = [];
        $numPairs = count($seedOrder) / 2;

        for ($i = 0; $i < $numPairs; $i++) {
            $seed1 = $seedOrder[$i * 2];
            $seed2 = $seedOrder[$i * 2 + 1];

            $team1 = $seed1 <= $teamCount ? $seed1 : 'BYE';
            $team2 = $seed2 <= $teamCount ? $seed2 : 'BYE';

            $pairings[] = [$team1, $team2];
        }

        return $pairings;
    }

    /**
     * Build complete double elimination bracket structure
     * 
     * @param array $teams Team data
     * @param array $pairings Initial match pairings
     * @param int $bracketSize Bracket size (power of 2)
     * @param int $eventId Event ID
     * @return array Complete bracket with winners and losers brackets
     */
    private function buildDoubleEliminationStructure($teams, $pairings, $bracketSize, $eventId)
    {
        $matches = [];
        $matchCounter = 1;
        
        // Calculate rounds  
        $winnersRounds = log($bracketSize, 2);
        
        // Build Winners Bracket first to analyze structure
        $winnersMatches = $this->buildWinnersBracket($teams, $pairings, $bracketSize, $matchCounter);
        $matches = array_merge($matches, $winnersMatches['matches']);
        $matchCounter = $winnersMatches['next_match_id'];
        
        // Calculate losers rounds: (winnersRounds * 2) - 1
        // This matches Challonge: 8-bracket=5LR, 16-bracket=7LR, etc.
        $losersRounds = ($winnersRounds * 2) - 1;
        
        // Build Losers Bracket
        $losersMatches = $this->buildLosersBracket(
            $winnersMatches['matches'],
            $winnersRounds,
            $losersRounds,
            $matchCounter,
            count($teams)
        );
        $matches = array_merge($matches, $losersMatches['matches']);
        $matchCounter = $losersMatches['next_match_id'];
        
        // Add Grand Finals
        $grandFinals = $this->buildGrandFinals($winnersMatches, $losersMatches, $matchCounter);
        $matches = array_merge($matches, $grandFinals['matches']);
        
        // Link matches (set winner_to and loser_to)
        $this->linkMatches($matches);
        
        return [
            'matches' => $matches,
            'total_rounds' => $winnersRounds + $losersRounds + 1, // +1 for Grand Finals
            'winners_rounds' => $winnersRounds,
            'losers_rounds' => $losersRounds,
        ];
    }

    /**
     * Build Winners Bracket with proper seeding (Challonge-style: ALL positions numbered)
     *
     * @param array $teams
     * @param array $pairings Initial match pairings
     * @param int $bracketSize Bracket size (power of 2)
     * @param int $matchCounter Starting match ID
     * @return array Winners bracket matches and metadata
     */
    private function buildWinnersBracket($teams, $pairings, $bracketSize, $matchCounter)
    {
        $matches = [];
        $winnersRounds = log($bracketSize, 2);
        $startMatchId = $matchCounter;
        
        // Round 1: Create matches from initial pairings
        // CHALLONGE STYLE: ALL bracket positions get match numbers, even byes
        $round1Matches = [];
        foreach ($pairings as $pairIndex => $pair) {
            $seed1 = $pair[0];
            $seed2 = $pair[1];
            
            // Skip if both are byes (no position at all)
            if ($seed1 === 'BYE' && $seed2 === 'BYE') {
                continue;
            }
            
            // Determine if this is a bye match or real match
            $isBye = ($seed1 === 'BYE' || $seed2 === 'BYE');
            
            // Create match with numbered ID (even for byes!)
            $matchId = $matchCounter;
            $round1Matches[] = [
                'id' => 'WR1_M' . $matchId,
                'match_number' => $matchId,
                'bracket' => 'winners',
                'round' => 1,
                'round_name' => 'Winners Round 1',
                'team1_seed' => $seed1 !== 'BYE' ? $seed1 : null,
                'team2_seed' => $seed2 !== 'BYE' ? $seed2 : null,
                'team1_name' => $seed1 !== 'BYE' ? $teams[$seed1 - 1]['name'] : null,
                'team2_name' => $seed2 !== 'BYE' ? $teams[$seed2 - 1]['name'] : null,
                'winner_to' => null, // Set later
                'loser_to' => null, // Set later
                'is_bye' => $isBye,
                'winner_seed' => $isBye ? ($seed1 !== 'BYE' ? $seed1 : $seed2) : null,
                'pairing_index' => $pairIndex,
            ];
            
            $matchCounter++; // Increment for EVERY position
        }
        
        $matches = array_merge($matches, $round1Matches);
        
        // Build subsequent winners rounds
        $currentRoundMatches = $round1Matches;
        for ($round = 2; $round <= $winnersRounds; $round++) {
            $nextRoundMatches = [];
            $matchesInRound = count($currentRoundMatches) / 2;
            
            for ($i = 0; $i < $matchesInRound; $i++) {
                $match1 = $currentRoundMatches[$i * 2];
                $match2 = $currentRoundMatches[$i * 2 + 1];
                
                // Check if either match is a bye and pre-populate team names
                $team1Seed = null;
                $team1Name = 'TBD';
                $team2Seed = null;
                $team2Name = 'TBD';
                
                // If match1 is a bye, use its winner seed
                if (isset($match1['is_bye']) && $match1['is_bye'] && isset($match1['winner_seed'])) {
                    $team1Seed = $match1['winner_seed'];
                    $team1Name = $teams[$team1Seed - 1]['name'];
                }
                
                // If match2 is a bye, use its winner seed
                if (isset($match2['is_bye']) && $match2['is_bye'] && isset($match2['winner_seed'])) {
                    $team2Seed = $match2['winner_seed'];
                    $team2Name = $teams[$team2Seed - 1]['name'];
                }
                
                $nextRoundMatches[] = [
                    'id' => 'WR' . $round . '_M' . $matchCounter,
                    'match_number' => $matchCounter,
                    'bracket' => 'winners',
                    'round' => $round,
                    'round_name' => 'Winners Round ' . $round,
                    'team1_seed' => $team1Seed,
                    'team2_seed' => $team2Seed,
                    'team1_name' => $team1Name,
                    'team2_name' => $team2Name,
                    'winner_to' => null, // Set later
                    'loser_to' => null, // Set later
                    'previous_match_1' => $match1['id'],
                    'previous_match_2' => $match2['id'],
                ];
                
                $matchCounter++;
            }
            
            $matches = array_merge($matches, $nextRoundMatches);
            $currentRoundMatches = $nextRoundMatches;
        }
        
        return [
            'matches' => $matches,
            'next_match_id' => $matchCounter,
            'final_match_id' => $currentRoundMatches[0]['id'],
        ];
    }

    /**
     * Build Losers Bracket (Challonge-accurate version)
     *
     * Challonge Pattern:
     * - Odd rounds (1,3,5...): Pair previous round winners
     * - Even rounds (2,4,6...): Feed WR losers + previous LR winners
     * - Last round: Single advancement if only 1 match remains
     *
     * @param array $winnersMatches
     * @param int $winnersRounds
     * @param int $losersRounds
     * @param int $matchCounter
     * @return array
     */
    private function buildLosersBracket($winnersMatches, $winnersRounds, $losersRounds, $matchCounter, $teamCount = null)
    {
        $matches = [];
        $winnersByRound = [];
        
        // Calculate bracket size from winners rounds
        $bracketSize = pow(2, $winnersRounds);

        // Group winners by round - only REAL matches (not byes)
        foreach ($winnersMatches as $m) {
            if (!($m['is_bye'] ?? false)) {
                $winnersByRound[$m['round']][] = $m;
            }
        }

        // Collect early WR losers for LR1
        // Pattern: Combine WR1 and WR2 losers until we have pairs
        $wr1Matches = $winnersByRound[1] ?? [];
        $wr2Matches = $winnersByRound[2] ?? [];
        
        // Determine LR1 source strategy
        $wr1Count = count($wr1Matches);
        $wr2Count = count($wr2Matches);
        
        $lr1Sources = [];
        $lr1SourceRound = 1; // Default: LR1 from WR1
        $lr2SourceRound = 3; // Default: LR2 gets from WR3
        
        if ($wr1Count >= 3 && $bracketSize <= 8) {
            // 7-8 teams ONLY: LR1 from WR1 only
            $lr1Sources = $wr1Matches;
            $lr1SourceRound = 1;
            $lr2SourceRound = 2;
        } else if ($bracketSize <= 4) {
            // 3-4 teams: LR1 from WR1 only (WR2 is finals, feeds directly to LR2)
            $lr1Sources = $wr1Matches;
            $lr1SourceRound = 1;
            $lr2SourceRound = 2;
        } else {
            // 5-6, 9-10, 11+ teams: LR1 combines WR1 + limited WR2
            // Pattern: pair WR1 count with equal WR2 count
            $wr2ForLR1 = min($wr1Count, $wr2Count);
            $lr1Sources = array_merge($wr1Matches, array_slice($wr2Matches, 0, $wr2ForLR1));
            $lr1SourceRound = 2; // Mark that we used WR2 for LR1
            $lr2SourceRound = 2; // LR2 gets remaining WR2 (+ potentially WR3 for larger brackets)
        }

        $prevRoundMatches = [];
        $oddCarryover = null;
        $oddLR1Source = null; // Track odd LR1 source (3rd WR1 loser) to feed into LR2
        $usedWR2Count = 0; // Track how many WR2 matches fed into LR1

        // Track which WR round we're feeding from
        $nextWRFeedRound = $lr1SourceRound == 1 ? 2 : 3; // Start feeding from next WR round after LR1 source
        
        for ($lr = 1; $lr <= $losersRounds; $lr++) {
            $roundMatches = [];
            
            // Determine if this is a pairing round or feeding round
            // After LR1, alternate: even rounds feed WR, odd rounds pair
            $isOddRound = ($lr % 2 == 1);
            $shouldFeedWR = !$isOddRound && ($lr > 1); // Even rounds after LR1 feed WR
            
            if ($lr == 1) {
                // LR1: Use collected sources
                $pairsToMake = floor(count($lr1Sources) / 2);
                
                // For 10 teams: pair (WR1 M1 + WR1 M2) and (WR2 M3 + WR2 M4)
                // For 6 teams: pair (WR1 M1 + WR1 M2) and (WR2 M3 + WR2 M4)
                for ($i = 0; $i < $pairsToMake; $i++) {
                    $idx1 = $i * 2;
                    $idx2 = $i * 2 + 1;
                    
                    $roundMatches[] = [
                        'id' => "LR1_M{$matchCounter}",
                        'match_number' => $matchCounter++,
                        'bracket' => 'losers',
                        'round' => $winnersRounds + 1,
                        'losers_round' => 1,
                        'round_name' => 'Losers Round 1',
                        'team1_seed' => null,
                        'team2_seed' => null,
                        'team1_name' => 'TBD',
                        'team2_name' => 'TBD',
                        'winner_to' => null,
                        'feeds_from_match_1' => $lr1Sources[$idx1]['id'],
                        'feeds_from_match_2' => $lr1Sources[$idx2]['id'],
                        'previous_match_loser_1' => $lr1Sources[$idx1]['id'], // Take LOSER from this match
                        'previous_match_loser_2' => $lr1Sources[$idx2]['id'], // Take LOSER from this match
                    ];
                }
                
                // Track how many WR2 we used
                $usedWR2Count = max(0, ($pairsToMake * 2) - $wr1Count);
                
                // Handle odd LR1 source - feed directly into LR2
                if (count($lr1Sources) % 2 == 1) {
                    $oddLR1Source = $lr1Sources[count($lr1Sources) - 1]['id'];
                    // This will be used in LR2 generation
                } else {
                    $oddLR1Source = null;
                }
            } else {
                // LR2+: Pair previous winners OR merge with WR losers
                $prevCount = count($prevRoundMatches);
                
                // Try to get WR losers if this is a feeding round
                $wrLosers = [];
                if ($lr == 2) {
                    // LR2 sources vary by bracket type
                    $remainingWR2 = array_slice($wr2Matches, $usedWR2Count);
                    
                    // LR2 ALWAYS gets only remaining WR2 (never WR3)
                    // WR3 losers feed into LR4 via the else block below
                    $wrLosers = $remainingWR2;
                    
                    // Add odd LR1 source if exists (3rd WR1 loser for 7 teams)
                    if (isset($oddLR1Source) && $oddLR1Source) {
                        // Convert to match array format to merge with wrLosers
                        $wrLosers[] = ['id' => $oddLR1Source];
                    }
                } else if ($isOddRound) {
                    // Odd rounds (LR3, LR5...): usually pair previous only
                    // EXCEPT: LR3 gets WR3 if LR1 consumed WR2 (meaning WR3 wasn't reserved for LR2)
                    if ($lr == 3 && $lr1SourceRound == 2 && isset($winnersByRound[3])) {
                        $wrLosers = $winnersByRound[3];
                    } else {
                        $wrLosers = [];
                    }
                } else {
                    // Even rounds (LR4, LR6...): feed next WR
                    // EXCEPT: For non-power-of-2 with 4 WR rounds, LR4 doesn't get WR3 (it already went to LR3)
                    if ($lr == 4 && $winnersRounds == 4 && !$this->isPowerOfTwo($teamCount)) {
                        // Skip WR3, get next WR
                        $wrSourceRound = 4;
                    } else {
                        $wrSourceRound = $lr2SourceRound + ($lr / 2) - 1;
                    }
                    
                    // For non-power-of-2 with 4 WR rounds, LR6+ should not get any WR losers
                    // (WR4 was already consumed by LR4)
                    if ($lr >= 6 && $winnersRounds == 4 && !$this->isPowerOfTwo($teamCount)) {
                        $wrLosers = [];
                    }
                    // Check if we have WR losers available for this round
                    else if ($wrSourceRound <= $winnersRounds && isset($winnersByRound[$wrSourceRound])) {
                        $wrLosers = $winnersByRound[$wrSourceRound];
                    } else {
                        $wrLosers = []; // No more WR losers available
                    }
                }
                
                $wrCount = count($wrLosers);
                
                // If we have WR losers, merge with LR winners (always try to merge first)
                if ($wrCount > 0) {
                    $startIndex = 0;
                    
                    // Handle odd carryover
                    if ($oddCarryover) {
                        $roundMatches[] = [
                            'id' => "LR{$lr}_M{$matchCounter}",
                            'match_number' => $matchCounter++,
                            'bracket' => 'losers',
                            'round' => $winnersRounds + $lr,
                            'losers_round' => $lr,
                            'round_name' => "Losers Round {$lr}",
                            'team1_seed' => null,
                            'team2_seed' => null,
                            'team1_name' => 'TBD',
                            'team2_name' => 'TBD',
                            'winner_to' => null,
                            'feeds_from_match_1' => $oddCarryover,
                            'feeds_from_match_2' => $wrLosers[0]['id'],
                            'previous_match_1' => $oddCarryover, // Winner from previous LR
                            'previous_match_loser_2' => $wrLosers[0]['id'], // LOSER from WR
                        ];
                        $oddCarryover = null;
                        $startIndex = 1;
                    }
                    
                    // Pair LR winners with WR losers 1-to-1
                    $matchCount = min($prevCount, $wrCount - $startIndex);
                    
                    for ($i = 0; $i < $matchCount; $i++) {
                        $roundMatches[] = [
                            'id' => "LR{$lr}_M{$matchCounter}",
                            'match_number' => $matchCounter++,
                            'bracket' => 'losers',
                            'round' => $winnersRounds + $lr,
                            'losers_round' => $lr,
                            'round_name' => "Losers Round {$lr}",
                            'team1_seed' => null,
                            'team2_seed' => null,
                            'team1_name' => 'TBD',
                            'team2_name' => 'TBD',
                            'winner_to' => null,
                            'feeds_from_match_1' => $prevRoundMatches[$i]['id'], // LR winner
                            'feeds_from_match_2' => $wrLosers[$i + $startIndex]['id'], // WR loser
                            'previous_match_1' => $prevRoundMatches[$i]['id'], // Winner from previous LR
                            'previous_match_loser_2' => $wrLosers[$i + $startIndex]['id'], // LOSER from WR
                        ];
                    }
                    
                    // Handle extra WR losers (when wrCount > prevCount)
                    $remainingWR = $wrCount - $startIndex - $matchCount;
                    if ($remainingWR > 0) {
                        $wrStartIdx = $startIndex + $matchCount;
                        // Pair remaining WR losers together
                        $extraPairs = floor($remainingWR / 2);
                        for ($i = 0; $i < $extraPairs; $i++) {
                            $idx1 = $wrStartIdx + ($i * 2);
                            $idx2 = $wrStartIdx + ($i * 2) + 1;
                            $roundMatches[] = [
                                'id' => "LR{$lr}_M{$matchCounter}",
                                'match_number' => $matchCounter++,
                                'bracket' => 'losers',
                                'round' => $winnersRounds + $lr,
                                'losers_round' => $lr,
                                'round_name' => "Losers Round {$lr}",
                                'team1_seed' => null,
                                'team2_seed' => null,
                                'team1_name' => 'TBD',
                                'team2_name' => 'TBD',
                                'winner_to' => null,
                                'feeds_from_match_1' => $wrLosers[$idx1]['id'],
                                'feeds_from_match_2' => $wrLosers[$idx2]['id'],
                                'previous_match_loser_1' => $wrLosers[$idx1]['id'],
                                'previous_match_loser_2' => $wrLosers[$idx2]['id'],
                            ];
                        }
                        // Handle odd remaining WR loser - DON'T use oddCarryover for WR matches!
                        // WR losers can't be carried over as they're not LR winners
                        // This odd WR loser will be skipped/handled by match structure
                        if ($remainingWR % 2 == 1) {
                            // BUG FIX: Don't set oddCarryover to WR match ID!
                            // $oddCarryover = $wrLosers[$wrCount - 1]['id'];  // ❌ REMOVED
                            // The odd WR loser will naturally not have a match this round
                        }
                    }
                    
                    // Handle extra LR winners (when prevCount > matchCount)
                    $remainingLR = $prevCount - $matchCount;
                    if ($remainingLR > 0) {
                        $lrStartIdx = $matchCount;
                        // Pair remaining LR winners together
                        $extraPairs = floor($remainingLR / 2);
                        for ($i = 0; $i < $extraPairs; $i++) {
                            $idx1 = $lrStartIdx + ($i * 2);
                            $idx2 = $lrStartIdx + ($i * 2) + 1;
                            $roundMatches[] = [
                                'id' => "LR{$lr}_M{$matchCounter}",
                                'match_number' => $matchCounter++,
                                'bracket' => 'losers',
                                'round' => $winnersRounds + $lr,
                                'losers_round' => $lr,
                                'round_name' => "Losers Round {$lr}",
                                'team1_seed' => null,
                                'team2_seed' => null,
                                'team1_name' => 'TBD',
                                'team2_name' => 'TBD',
                                'winner_to' => null,
                                'feeds_from_match_1' => $prevRoundMatches[$idx1]['id'],
                                'feeds_from_match_2' => $prevRoundMatches[$idx2]['id'],
                                'previous_match_1' => $prevRoundMatches[$idx1]['id'],
                                'previous_match_2' => $prevRoundMatches[$idx2]['id'],
                            ];
                        }
                        // Handle odd remaining LR winner
                        if ($remainingLR % 2 == 1) {
                            $oddCarryover = $prevRoundMatches[$prevCount - 1]['id'];
                        }
                    }
                } else {
                    // No WR losers: just pair previous winners
                    $startIndex = 0;
                    
                    // Handle odd carryover from previous round
                    // Create a match UNLESS oddCarryover is the same as the only prevRoundMatch
                    if ($oddCarryover && $prevCount > 0) {
                        // Skip if we would be pairing a match with itself
                        if ($prevCount == 1 && $oddCarryover === $prevRoundMatches[0]['id']) {
                            // Don't create a match, just carry forward
                        } else {
                        $roundMatches[] = [
                            'id' => "LR{$lr}_M{$matchCounter}",
                            'match_number' => $matchCounter++,
                            'bracket' => 'losers',
                            'round' => $winnersRounds + $lr,
                            'losers_round' => $lr,
                            'round_name' => "Losers Round {$lr}",
                            'team1_seed' => null,
                            'team2_seed' => null,
                            'team1_name' => 'TBD',
                            'team2_name' => 'TBD',
                            'winner_to' => null,
                            'previous_match_1' => $oddCarryover,
                            'previous_match_2' => $prevRoundMatches[0]['id'],
                        ];
                        $oddCarryover = null;
                        $startIndex = 1;
                        }
                    }
                    
                    // Pair remaining previous winners
                    $remaining = $prevCount - $startIndex;
                    $pairsToMake = floor($remaining / 2);
                    for ($i = 0; $i < $pairsToMake; $i++) {
                        $idx1 = $startIndex + ($i * 2);
                        $idx2 = $startIndex + ($i * 2) + 1;
                        $roundMatches[] = [
                            'id' => "LR{$lr}_M{$matchCounter}",
                            'match_number' => $matchCounter++,
                            'bracket' => 'losers',
                            'round' => $winnersRounds + $lr,
                            'losers_round' => $lr,
                            'round_name' => "Losers Round {$lr}",
                            'team1_seed' => null,
                            'team2_seed' => null,
                            'team1_name' => 'TBD',
                            'team2_name' => 'TBD',
                            'winner_to' => null,
                            'previous_match_1' => $prevRoundMatches[$idx1]['id'],
                            'previous_match_2' => $prevRoundMatches[$idx2]['id'],
                        ];
                    }
                    
                    // Carry odd forward
                    if ($remaining % 2 == 1) {
                        $oddCarryover = $prevRoundMatches[$prevCount - 1]['id'];
                    }
                }
            }

            if (count($roundMatches) > 0) {
                $matches = array_merge($matches, $roundMatches);
                $prevRoundMatches = $roundMatches;
            }
        }

        // Get final match ID
        $finalMatchId = null;
        if (!empty($prevRoundMatches)) {
            $finalMatchId = end($prevRoundMatches)['id'];
        }

        return [
            'matches' => $matches,
            'next_match_id' => $matchCounter,
            'final_match_id' => $finalMatchId,
        ];
    }



    /**
     * Build Grand Finals matches
     * 
     * @param array $winnersData Winners bracket data
     * @param array $losersData Losers bracket data
     * @param int $matchCounter Starting match ID
     * @return array Grand Finals matches
     */
    private function buildGrandFinals($winnersData, $losersData, $matchCounter)
    {
        $matches = [];
        
        // Grand Finals Match 1
        $gf1 = [
            'id' => 'GF1_M' . $matchCounter,
            'match_number' => $matchCounter,
            'bracket' => 'grand_finals',
            'round' => 999, // Special round number for finals
            'round_name' => 'Grand Finals',
            'team1_seed' => null,
            'team2_seed' => null,
            'team1_name' => 'TBD',
            'team2_name' => 'TBD',
            'winner_to' => null,
            'previous_winners_match' => $winnersData['final_match_id'],
            'previous_losers_match' => $losersData['final_match_id'],
            'is_grand_finals' => true,
            'reset_match' => 'GF2_M' . ($matchCounter + 1),
        ];
        
        $matches[] = $gf1;
        $matchCounter++;
        
        // Grand Finals Match 2 (Bracket Reset - optional, hidden initially)
        $gf2 = [
            'id' => 'GF2_M' . $matchCounter,
            'match_number' => $matchCounter,
            'bracket' => 'grand_finals_reset', // Different bracket type to avoid showing both
            'round' => 1000, // Higher round number
            'round_name' => 'Grand Finals (Reset)',
            'team1_seed' => null,
            'team2_seed' => null,
            'team1_name' => 'TBD',
            'team2_name' => 'TBD',
            'winner_to' => null,
            'previous_match' => $gf1['id'],
            'is_bracket_reset' => true,
            'is_grand_finals' => true,
            'is_bye' => true, // Mark as bye so it's skipped initially
        ];
        
        $matches[] = $gf2;
        
        return [
            'matches' => $matches,
            'next_match_id' => $matchCounter + 1,
        ];
    }

    /**
     * Link all matches with winner_to and loser_to relationships
     * 
     * @param array &$matches All bracket matches (passed by reference)
     */
    private function linkMatches(&$matches)
    {
        // Create lookup map
        $matchMap = [];
        foreach ($matches as &$match) {
            $matchMap[$match['id']] = &$match;
        }
        
        // Link winners bracket
        foreach ($matches as &$match) {
            if ($match['bracket'] === 'winners' && isset($match['previous_match_1'])) {
                // Set winner_to for previous matches
                $matchMap[$match['previous_match_1']]['winner_to'] = $match['id'];
                $matchMap[$match['previous_match_2']]['winner_to'] = $match['id'];
            }
        }
        
        // Link losers bracket
        foreach ($matches as &$match) {
            if ($match['bracket'] === 'losers') {
                // Link from previous losers matches (WINNERS advance)
                // Check both previous_match_X and feeds_from_match_X (without loser)
                if (isset($match['previous_match_1']) && !isset($match['previous_match_loser_1'])) {
                    $matchMap[$match['previous_match_1']]['winner_to'] = $match['id'];
                }
                if (isset($match['previous_match_2']) && !isset($match['previous_match_loser_2'])) {
                    $matchMap[$match['previous_match_2']]['winner_to'] = $match['id'];
                }
                
                // Also check feeds_from_match for LR matches feeding other LR matches
                if (isset($match['feeds_from_match_1']) && !isset($match['previous_match_loser_1'])) {
                    $sourceMatch = $matchMap[$match['feeds_from_match_1']] ?? null;
                    if ($sourceMatch && ($sourceMatch['bracket'] ?? '') === 'losers') {
                        $matchMap[$match['feeds_from_match_1']]['winner_to'] = $match['id'];
                    }
                }
                if (isset($match['feeds_from_match_2']) && !isset($match['previous_match_loser_2'])) {
                    $sourceMatch = $matchMap[$match['feeds_from_match_2']] ?? null;
                    if ($sourceMatch && ($sourceMatch['bracket'] ?? '') === 'losers') {
                        $matchMap[$match['feeds_from_match_2']]['winner_to'] = $match['id'];
                    }
                }
                
                if (isset($match['previous_losers_match'])) {
                    $matchMap[$match['previous_losers_match']]['winner_to'] = $match['id'];
                }
                
                // Link LOSERS from winners or losers bracket
                if (isset($match['previous_match_loser_1'])) {
                    $matchMap[$match['previous_match_loser_1']]['loser_to'] = $match['id'];
                }
                if (isset($match['previous_match_loser_2'])) {
                    $matchMap[$match['previous_match_loser_2']]['loser_to'] = $match['id'];
                }
                
                // Link losers from winners bracket ONLY (legacy)
                if (isset($match['feeds_from_match_1']) && !isset($match['previous_match_loser_1'])) {
                    $sourceMatch = $matchMap[$match['feeds_from_match_1']] ?? null;
                    // Only set loser_to if source is from winners bracket
                    if ($sourceMatch && ($sourceMatch['bracket'] ?? '') === 'winners') {
                        $matchMap[$match['feeds_from_match_1']]['loser_to'] = $match['id'];
                    }
                }
                if (isset($match['feeds_from_match_2']) && !isset($match['previous_match_loser_2'])) {
                    $sourceMatch = $matchMap[$match['feeds_from_match_2']] ?? null;
                    // Only set loser_to if source is from winners bracket
                    if ($sourceMatch && ($sourceMatch['bracket'] ?? '') === 'winners') {
                        $matchMap[$match['feeds_from_match_2']]['loser_to'] = $match['id'];
                    }
                }
                
                if (isset($match['feeds_from_winners'])) {
                    $matchMap[$match['feeds_from_winners']]['loser_to'] = $match['id'];
                }
            }
        }
        
        // Link to Grand Finals
        foreach ($matches as &$match) {
            if (isset($match['is_grand_finals']) && $match['is_grand_finals']) {
                if (isset($match['previous_winners_match'])) {
                    $matchMap[$match['previous_winners_match']]['winner_to'] = $match['id'];
                }
                if (isset($match['previous_losers_match'])) {
                    $matchMap[$match['previous_losers_match']]['winner_to'] = $match['id'];
                }
            }
        }
    }

    /**
     * Visualize double elimination bracket structure (for debugging)
     * 
     * @param int $teamCount Number of teams
     * @return string Visual representation
     */
    public function visualizeBracket($teamCount)
    {
        $teams = [];
        for ($i = 1; $i <= $teamCount; $i++) {
            $teams[] = ['name' => 'Team ' . $i];
        }
        
        $bracket = $this->generateDoubleEliminationBracket($teams, 1);
        
        $output = "Double Elimination Bracket for {$teamCount} teams:\n";
        $output .= "Bracket Size: {$bracket['bracket_size']}\n";
        $output .= "Byes: {$bracket['bye_count']}\n";
        $output .= "Total Matches: " . count($bracket['matches']) . "\n";
        $output .= "Winners Rounds: {$bracket['winners_rounds']}\n";
        $output .= "Losers Rounds: {$bracket['losers_rounds']}\n\n";
        
        // Group by bracket
        $winnerMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'winners');
        $loserMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'losers');
        $finalMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'grand_finals');
        
        $output .= "=== WINNERS BRACKET ===\n";
        foreach ($winnerMatches as $match) {
            if (!isset($match['is_bye']) || !$match['is_bye']) {
                $output .= "[{$match['id']}] {$match['round_name']}: ";
                $output .= "{$match['team1_name']} vs {$match['team2_name']}";
                $output .= " → Winner: {$match['winner_to']}, Loser: {$match['loser_to']}\n";
            }
        }
        
        $output .= "\n=== LOSERS BRACKET ===\n";
        foreach ($loserMatches as $match) {
            $output .= "[{$match['id']}] {$match['round_name']}: ";
            $output .= "{$match['team1_name']} vs {$match['team2_name']}";
            $output .= " → Winner: {$match['winner_to']}\n";
        }
        
        $output .= "\n=== GRAND FINALS ===\n";
        foreach ($finalMatches as $match) {
            $output .= "[{$match['id']}] {$match['round_name']}\n";
        }
        
        return $output;
    }
}
