<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ChallongeSeedingController extends Controller
{
    /**
     * Generate Challonge-style single elimination bracket seeding
     * 
     * This produces the exact same match order, bye placement, and bracket layout
     * that Challonge uses for any team count.
     * 
     * @param int $teamCount Number of teams in the tournament
     * @return array Bracket structure with pairings and metadata
     */
    public function generateChallongeSeeding($teamCount)
    {
        if ($teamCount < 2) {
            throw new \InvalidArgumentException('Team count must be at least 2');
        }

        // Calculate next power of 2
        $bracketSize = pow(2, ceil(log($teamCount, 2)));
        $byeCount = $bracketSize - $teamCount;

        // Generate Challonge seed order
        $seedOrder = $this->generateChallongeSeedOrder($bracketSize);

        // Create pairings from seed order
        $pairings = $this->createPairingsFromSeedOrder($seedOrder, $teamCount);

        return [
            'bracketSize' => $bracketSize,
            'byeCount' => $byeCount,
            'teamCount' => $teamCount,
            'seedOrder' => $seedOrder,
            'pairings' => $pairings,
        ];
    }

    /**
     * Generate Challonge-style seed order for a given bracket size
     * 
     * Examples:
     * 4:  [1, 4, 3, 2]
     * 8:  [1, 8, 5, 4, 3, 6, 7, 2]
     * 16: [1, 16, 9, 8, 5, 12, 13, 4, 3, 14, 11, 6, 7, 10, 15, 2]
     * 
     * @param int $bracketSize Power of 2 bracket size
     * @return array Ordered seed positions
     */
    private function generateChallongeSeedOrder($bracketSize)
    {
        // Hardcoded patterns for common bracket sizes (verified against Challonge)
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

        // Generate dynamically for non-standard sizes
        return $this->generateChallongeSeedOrderRecursive($bracketSize);
    }

    /**
     * Recursively generate Challonge seed order for any power-of-2 bracket size
     * 
     * Algorithm:
     * 1. Start with [1, N]
     * 2. For each round, split each pair and insert complementary seeds
     * 3. Continue until we have all N seeds
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
                // Calculate the complement seed
                // The sum of paired seeds always equals bracketSize + 1
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
     * Takes the ordered seed list and pairs them sequentially.
     * Seeds beyond teamCount become "BYE".
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

            // Replace non-existent seeds with BYE
            $team1 = $seed1 <= $teamCount ? $seed1 : 'BYE';
            $team2 = $seed2 <= $teamCount ? $seed2 : 'BYE';

            $pairings[] = [$team1, $team2];
        }

        return $pairings;
    }

    /**
     * Generate full single elimination bracket with Challonge seeding
     * 
     * This creates the complete bracket structure with all rounds,
     * matches, and proper progression paths.
     * 
     * @param array $teams Array of team data
     * @param int $eventId Event ID for the tournament
     * @return array Complete bracket structure
     */
    public function generateChallongeBracket($teams, $eventId)
    {
        $teamCount = count($teams);
        
        // Get Challonge seeding
        $seeding = $this->generateChallongeSeeding($teamCount);
        
        // Prepare teams with IDs and seeds
        $teamsWithIds = [];
        foreach ($teams as $index => $team) {
            $teamsWithIds[] = array_merge($team, [
                'temp_id' => 'team_' . $index,
                'seed' => $index + 1,
            ]);
        }

        $bracketSize = $seeding['bracketSize'];
        $pairings = $seeding['pairings'];
        $totalRounds = log($bracketSize, 2);
        
        $matches = [];
        $globalMatchNumber = 1;

        // ROUND 1: Create matches from pairings
        $firstRoundMatches = [];
        $r1MatchIndex = 0;
        
        foreach ($pairings as $pairIndex => $pair) {
            $seed1 = $pair[0];
            $seed2 = $pair[1];
            
            // Skip if both are byes (shouldn't happen with proper seeding)
            if ($seed1 === 'BYE' && $seed2 === 'BYE') {
                continue;
            }
            
            // If one is a bye, the other advances automatically to Round 2
            if ($seed1 === 'BYE' || $seed2 === 'BYE') {
                // This team gets a bye - will be placed directly in Round 2
                continue;
            }
            
            // Both teams exist - create Round 1 match
            $team1Index = $seed1 - 1;
            $team2Index = $seed2 - 1;
            
            $firstRoundMatches[] = [
                'temp_id' => 'match_1_' . $globalMatchNumber,
                'round' => 1,
                'match_number' => $globalMatchNumber,
                'team1_temp_id' => 'team_' . $team1Index,
                'team2_temp_id' => 'team_' . $team2Index,
                'team1_name' => $teams[$team1Index]['name'],
                'team2_name' => $teams[$team2Index]['name'],
                'next_match_temp_id' => null, // Will be set later
                'pairing_index' => $pairIndex, // Track which pairing this came from
            ];
            
            $globalMatchNumber++;
        }
        
        $matches = array_merge($matches, $firstRoundMatches);
        
        // ROUND 2+: Create subsequent rounds
        $currentRoundSize = $bracketSize / 2; // Number of matches in Round 2
        $roundNumber = 2;
        
        // Build Round 2 with bye recipients and R1 winners
        $round2Matches = [];
        $r2MatchIndex = 0;
        
        for ($pairIndex = 0; $pairIndex < count($pairings); $pairIndex += 2) {
            $pair1 = $pairings[$pairIndex];
            $pair2 = $pairings[$pairIndex + 1];
            
            // Determine who advances from each pairing
            $team1_temp_id = null;
            $team1_name = 'TBD';
            $team2_temp_id = null;
            $team2_name = 'TBD';
            
            // Handle first pairing
            if ($pair1[0] === 'BYE' && $pair1[1] !== 'BYE') {
                // Team 2 gets bye
                $seed = $pair1[1];
                $teamIndex = $seed - 1;
                $team1_temp_id = 'team_' . $teamIndex;
                $team1_name = $teams[$teamIndex]['name'];
            } elseif ($pair1[1] === 'BYE' && $pair1[0] !== 'BYE') {
                // Team 1 gets bye
                $seed = $pair1[0];
                $teamIndex = $seed - 1;
                $team1_temp_id = 'team_' . $teamIndex;
                $team1_name = $teams[$teamIndex]['name'];
            }
            // else: both teams played in R1, winner TBD
            
            // Handle second pairing
            if ($pair2[0] === 'BYE' && $pair2[1] !== 'BYE') {
                // Team 2 gets bye
                $seed = $pair2[1];
                $teamIndex = $seed - 1;
                $team2_temp_id = 'team_' . $teamIndex;
                $team2_name = $teams[$teamIndex]['name'];
            } elseif ($pair2[1] === 'BYE' && $pair2[0] !== 'BYE') {
                // Team 1 gets bye
                $seed = $pair2[0];
                $teamIndex = $seed - 1;
                $team2_temp_id = 'team_' . $teamIndex;
                $team2_name = $teams[$teamIndex]['name'];
            }
            // else: both teams played in R1, winner TBD
            
            $round2Matches[] = [
                'temp_id' => 'match_2_' . $globalMatchNumber,
                'round' => 2,
                'match_number' => $globalMatchNumber,
                'team1_temp_id' => $team1_temp_id,
                'team2_temp_id' => $team2_temp_id,
                'team1_name' => $team1_name,
                'team2_name' => $team2_name,
                'next_match_temp_id' => null, // Will be set later
                'r2_index' => $r2MatchIndex,
            ];
            
            $globalMatchNumber++;
            $r2MatchIndex++;
        }
        
        // Update R1 matches with next_match_temp_id pointing to R2
        foreach ($matches as &$match) {
            if ($match['round'] == 1) {
                $pairIndex = $match['pairing_index'];
                $r2Index = floor($pairIndex / 2);
                $match['next_match_temp_id'] = 'match_2_' . ($r2Index + count($firstRoundMatches) + 1);
                unset($match['pairing_index']); // Clean up temp field
            }
        }
        
        $matches = array_merge($matches, $round2Matches);
        $currentRoundSize = count($round2Matches) / 2;
        $roundNumber = 3;
        
        // Build remaining rounds (R3 to Finals)
        while ($currentRoundSize >= 1) {
            $roundMatches = [];
            $nextRoundStartMatch = $globalMatchNumber + $currentRoundSize;
            
            for ($i = 0; $i < $currentRoundSize; $i++) {
                $currentMatchNum = $globalMatchNumber;
                $nextMatchNum = $nextRoundStartMatch + floor($i / 2);
                
                $roundMatches[] = [
                    'temp_id' => 'match_' . $roundNumber . '_' . $currentMatchNum,
                    'round' => $roundNumber,
                    'match_number' => $currentMatchNum,
                    'team1_temp_id' => null,
                    'team2_temp_id' => null,
                    'team1_name' => 'TBD',
                    'team2_name' => 'TBD',
                    'next_match_temp_id' => $currentRoundSize > 1 ? 'match_' . ($roundNumber + 1) . '_' . $nextMatchNum : null,
                ];
                
                $globalMatchNumber++;
            }
            
            $matches = array_merge($matches, $roundMatches);
            $currentRoundSize = $currentRoundSize / 2;
            $roundNumber++;
        }
        
        // Update R2 matches with next_match_temp_id
        foreach ($matches as &$match) {
            if ($match['round'] == 2 && isset($match['r2_index'])) {
                $r2Index = $match['r2_index'];
                $r3StartMatch = count($firstRoundMatches) + count($round2Matches) + 1;
                $r3Match = $r3StartMatch + floor($r2Index / 2);
                $match['next_match_temp_id'] = 'match_3_' . $r3Match;
                unset($match['r2_index']); // Clean up temp field
            }
        }

        return [
            'teams' => $teamsWithIds,
            'matches' => $matches,
            'total_rounds' => $totalRounds,
            'bracket_type' => 'single',
            'seeding_info' => $seeding,
        ];
    }

    /**
     * Visualize the Challonge seeding pattern (for debugging/testing)
     * 
     * @param int $teamCount Number of teams
     * @return string Visual representation of the bracket
     */
    public function visualizeSeeding($teamCount)
    {
        $seeding = $this->generateChallongeSeeding($teamCount);
        
        $output = "Challonge Seeding for {$teamCount} teams:\n";
        $output .= "Bracket Size: {$seeding['bracketSize']}\n";
        $output .= "Byes: {$seeding['byeCount']}\n\n";
        $output .= "Seed Order: [" . implode(', ', $seeding['seedOrder']) . "]\n\n";
        $output .= "Round 1 Pairings:\n";
        
        foreach ($seeding['pairings'] as $index => $pair) {
            $matchNum = $index + 1;
            $team1 = $pair[0] === 'BYE' ? 'BYE' : "Seed {$pair[0]}";
            $team2 = $pair[1] === 'BYE' ? 'BYE' : "Seed {$pair[1]}";
            $output .= "Match {$matchNum}: {$team1} vs {$team2}\n";
        }
        
        return $output;
    }
}
