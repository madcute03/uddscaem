<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Http\Controllers\ChallongeSeedingController;

class ChallongeSeedingTest extends TestCase
{
    private $controller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new ChallongeSeedingController();
    }

    /**
     * Test 4-team Challonge seeding
     */
    public function test_4_team_challonge_seeding()
    {
        $result = $this->controller->generateChallongeSeeding(4);

        $this->assertEquals(4, $result['bracketSize']);
        $this->assertEquals(0, $result['byeCount']);
        $this->assertEquals([1, 4, 3, 2], $result['seedOrder']);
        $this->assertEquals([
            [1, 4],
            [3, 2]
        ], $result['pairings']);
    }

    /**
     * Test 8-team Challonge seeding
     */
    public function test_8_team_challonge_seeding()
    {
        $result = $this->controller->generateChallongeSeeding(8);

        $this->assertEquals(8, $result['bracketSize']);
        $this->assertEquals(0, $result['byeCount']);
        $this->assertEquals([1, 8, 5, 4, 3, 6, 7, 2], $result['seedOrder']);
        $this->assertEquals([
            [1, 8],
            [5, 4],
            [3, 6],
            [7, 2]
        ], $result['pairings']);
    }

    /**
     * Test 16-team Challonge seeding
     */
    public function test_16_team_challonge_seeding()
    {
        $result = $this->controller->generateChallongeSeeding(16);

        $this->assertEquals(16, $result['bracketSize']);
        $this->assertEquals(0, $result['byeCount']);
        $this->assertEquals([1, 16, 9, 8, 5, 12, 13, 4, 3, 14, 11, 6, 7, 10, 15, 2], $result['seedOrder']);
        $this->assertEquals([
            [1, 16],
            [9, 8],
            [5, 12],
            [13, 4],
            [3, 14],
            [11, 6],
            [7, 10],
            [15, 2]
        ], $result['pairings']);
    }

    /**
     * Test 10-team Challonge seeding with byes
     */
    public function test_10_team_challonge_seeding_with_byes()
    {
        $result = $this->controller->generateChallongeSeeding(10);

        $this->assertEquals(16, $result['bracketSize']);
        $this->assertEquals(6, $result['byeCount']);
        $this->assertEquals([1, 16, 9, 8, 5, 12, 13, 4, 3, 14, 11, 6, 7, 10, 15, 2], $result['seedOrder']);
        
        // Expected pairings with BYEs
        $expectedPairings = [
            [1, 'BYE'],      // Seed 16 doesn't exist
            [9, 8],          // Both exist
            [5, 'BYE'],      // Seed 12 doesn't exist
            ['BYE', 4],      // Seed 13 doesn't exist
            [3, 'BYE'],      // Seed 14 doesn't exist
            ['BYE', 6],      // Seed 11 doesn't exist
            [7, 10],         // Both exist
            ['BYE', 2]       // Seed 15 doesn't exist
        ];
        
        $this->assertEquals($expectedPairings, $result['pairings']);
    }

    /**
     * Test 6-team Challonge seeding with byes
     */
    public function test_6_team_challonge_seeding_with_byes()
    {
        $result = $this->controller->generateChallongeSeeding(6);

        $this->assertEquals(8, $result['bracketSize']);
        $this->assertEquals(2, $result['byeCount']);
        $this->assertEquals([1, 8, 5, 4, 3, 6, 7, 2], $result['seedOrder']);
        
        $expectedPairings = [
            [1, 'BYE'],      // Seed 8 doesn't exist
            [5, 4],          // Both exist
            [3, 6],          // Both exist
            ['BYE', 2]       // Seed 7 doesn't exist
        ];
        
        $this->assertEquals($expectedPairings, $result['pairings']);
    }

    /**
     * Test 5-team Challonge seeding with byes
     */
    public function test_5_team_challonge_seeding_with_byes()
    {
        $result = $this->controller->generateChallongeSeeding(5);

        $this->assertEquals(8, $result['bracketSize']);
        $this->assertEquals(3, $result['byeCount']);
        
        $expectedPairings = [
            [1, 'BYE'],      // Seed 8 doesn't exist
            [5, 4],          // Both exist
            [3, 'BYE'],      // Seed 6 doesn't exist
            ['BYE', 2]       // Seed 7 doesn't exist
        ];
        
        $this->assertEquals($expectedPairings, $result['pairings']);
    }

    /**
     * Test 32-team Challonge seeding
     */
    public function test_32_team_challonge_seeding()
    {
        $result = $this->controller->generateChallongeSeeding(32);

        $this->assertEquals(32, $result['bracketSize']);
        $this->assertEquals(0, $result['byeCount']);
        
        // Verify first few pairings
        $this->assertEquals([1, 32], $result['pairings'][0]);
        $this->assertEquals([17, 16], $result['pairings'][1]);
        $this->assertEquals([9, 24], $result['pairings'][2]);
        $this->assertEquals([25, 8], $result['pairings'][3]);
    }

    /**
     * Test visualization output
     */
    public function test_visualization_output()
    {
        $output = $this->controller->visualizeSeeding(10);

        $this->assertStringContainsString('Challonge Seeding for 10 teams', $output);
        $this->assertStringContainsString('Bracket Size: 16', $output);
        $this->assertStringContainsString('Byes: 6', $output);
        $this->assertStringContainsString('Seed Order:', $output);
        $this->assertStringContainsString('Round 1 Pairings:', $output);
    }

    /**
     * Test full bracket generation with Challonge seeding
     */
    public function test_full_bracket_generation()
    {
        $teams = [
            ['name' => 'Team A'],
            ['name' => 'Team B'],
            ['name' => 'Team C'],
            ['name' => 'Team D'],
            ['name' => 'Team E'],
            ['name' => 'Team F'],
        ];

        $result = $this->controller->generateChallongeBracket($teams, 1);

        $this->assertCount(6, $result['teams']);
        $this->assertEquals(3, $result['total_rounds']); // 8-team bracket = 3 rounds
        $this->assertEquals('single', $result['bracket_type']);
        $this->assertArrayHasKey('seeding_info', $result);
        
        // Verify matches were created
        $this->assertNotEmpty($result['matches']);
        
        // Group matches by round
        $matchesByRound = [];
        foreach ($result['matches'] as $match) {
            $matchesByRound[$match['round']][] = $match;
        }
        
        // Should have Round 1 matches (only for non-bye pairings)
        $this->assertArrayHasKey(1, $matchesByRound);
        
        // Should have Round 2 and Finals
        $this->assertArrayHasKey(2, $matchesByRound);
        $this->assertArrayHasKey(3, $matchesByRound);
    }

    /**
     * Test edge case: 2 teams
     */
    public function test_2_team_seeding()
    {
        $result = $this->controller->generateChallongeSeeding(2);

        $this->assertEquals(2, $result['bracketSize']);
        $this->assertEquals(0, $result['byeCount']);
        $this->assertEquals([[1, 2]], $result['pairings']);
    }

    /**
     * Test edge case: 3 teams
     */
    public function test_3_team_seeding()
    {
        $result = $this->controller->generateChallongeSeeding(3);

        $this->assertEquals(4, $result['bracketSize']);
        $this->assertEquals(1, $result['byeCount']);
        
        $expectedPairings = [
            [1, 'BYE'],      // Seed 4 doesn't exist
            [3, 2]           // Both exist
        ];
        
        $this->assertEquals($expectedPairings, $result['pairings']);
    }

    /**
     * Test that seed order maintains symmetry
     */
    public function test_seed_order_symmetry()
    {
        $result = $this->controller->generateChallongeSeeding(16);
        $seedOrder = $result['seedOrder'];

        // In Challonge seeding, seed 1 and 2 should be at opposite ends
        $this->assertEquals(1, $seedOrder[0]);
        $this->assertEquals(2, $seedOrder[count($seedOrder) - 1]);
        
        // Verify sum property: paired seeds should sum to bracketSize + 1
        $pairings = $result['pairings'];
        foreach ($pairings as $pair) {
            if ($pair[0] !== 'BYE' && $pair[1] !== 'BYE') {
                $this->assertEquals(17, $pair[0] + $pair[1]);
            }
        }
    }

    /**
     * Test recursive generation for non-standard size (128 teams)
     */
    public function test_large_bracket_generation()
    {
        $result = $this->controller->generateChallongeSeeding(128);

        $this->assertEquals(128, $result['bracketSize']);
        $this->assertEquals(0, $result['byeCount']);
        $this->assertCount(128, $result['seedOrder']);
        $this->assertCount(64, $result['pairings']);
        
        // Verify symmetry
        $this->assertEquals(1, $result['seedOrder'][0]);
        $this->assertEquals(2, $result['seedOrder'][127]);
    }
}
