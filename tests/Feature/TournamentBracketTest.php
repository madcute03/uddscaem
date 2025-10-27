<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Http\Controllers\TournamentController;

class TournamentBracketTest extends TestCase
{
    public function test_six_team_single_elimination_bracket()
    {
        // Test event ID
        $eventId = 1;

        // Create 6 teams for testing
        $teams = [
            ['name' => 'Team A', 'members' => []],
            ['name' => 'Team B', 'members' => []],
            ['name' => 'Team C', 'members' => []],
            ['name' => 'Team D', 'members' => []],
            ['name' => 'Team E', 'members' => []],
            ['name' => 'Team F', 'members' => []],
        ];

        // Generate bracket
        $controller = new TournamentController();
        $result = $controller->generateSingleEliminationBracket($teams, $eventId);

        // Verify basic structure
        $this->assertCount(6, $result['teams']);
        
        // Get matches by round
        $matchesByRound = [];
        foreach ($result['matches'] as $match) {
            $matchesByRound[$match['round']][] = $match;
        }

        // Test Round 1 structure (2 matches)
        $this->assertCount(2, $matchesByRound[1]);
        
        // Verify Round 1 matches (Teams 3-6)
        $round1 = $matchesByRound[1];
        $this->assertEquals('Team C', $round1[0]['team1_name']); // 3rd seed
        $this->assertEquals('Team F', $round1[0]['team2_name']); // 6th seed
        $this->assertEquals('Team D', $round1[1]['team1_name']); // 4th seed
        $this->assertEquals('Team E', $round1[1]['team2_name']); // 5th seed

        // Test Round 2 structure (2 matches)
        $this->assertCount(2, $matchesByRound[2]);
        
        // Verify Round 2 matches (Teams 1-2 + R1 winners)
        $round2 = $matchesByRound[2];
        $this->assertEquals('Team A', $round2[0]['team1_name']); // 1st seed
        $this->assertEquals('TBD', $round2[0]['team2_name']); // R1 winner
        $this->assertEquals('Team B', $round2[1]['team1_name']); // 2nd seed
        $this->assertEquals('TBD', $round2[1]['team2_name']); // R1 winner

        // Test Finals structure (1 match)
        $this->assertCount(1, $matchesByRound[3]);

        // Verify match progression connections
        // Round 1 -> Round 2
        $this->assertEquals('match_2_2', $round1[0]['next_match_temp_id']);
        $this->assertEquals('match_2_2', $round1[1]['next_match_temp_id']);

        // Round 2 -> Finals
        $this->assertEquals('match_3_1', $round2[0]['next_match_temp_id']);
        $this->assertEquals('match_3_1', $round2[1]['next_match_temp_id']);

        // Print bracket structure for visual verification
        echo "\nBracket Structure:\n";
        echo "Round 1:\n";
        foreach ($round1 as $match) {
            echo "{$match['team1_name']} vs {$match['team2_name']} -> {$match['next_match_temp_id']}\n";
        }
        echo "\nRound 2:\n";
        foreach ($round2 as $match) {
            echo "{$match['team1_name']} vs {$match['team2_name']} -> {$match['next_match_temp_id']}\n";
        }
        echo "\nFinals:\n";
        echo "Winner of R2M1 vs Winner of R2M2\n";
    }
}