<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Http\Controllers\ChallongeDoubleEliminationController;

class ChallongeDoubleEliminationTest extends TestCase
{
    private $controller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new ChallongeDoubleEliminationController();
    }

    /**
     * Helper: Generate teams array
     */
    private function generateTeams($count)
    {
        $teams = [];
        for ($i = 1; $i <= $count; $i++) {
            $teams[] = ['name' => "Team {$i}"];
        }
        return $teams;
    }

    /**
     * Test 4-team double elimination bracket
     */
    public function test_4_team_double_elimination()
    {
        $teams = $this->generateTeams(4);
        $bracket = $this->controller->generateDoubleEliminationBracket($teams, 1);

        $this->assertEquals('double', $bracket['bracket_type']);
        $this->assertEquals(4, $bracket['bracket_size']);
        $this->assertEquals(0, $bracket['bye_count']);
        
        // Expected: 2 WR1 + 1 WSF + 1 LR1 + 1 LR2 + 2 GF = 7 matches
        $this->assertEquals(7, count($bracket['matches']));
        
        // Verify winners bracket
        $winnersMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'winners');
        $this->assertEquals(3, count($winnersMatches)); // WR1(2) + WSF(1)
        
        // Verify losers bracket
        $losersMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'losers');
        $this->assertEquals(2, count($losersMatches)); // LR1(1) + LR2(1)
        
        // Verify grand finals
        $finalsMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'grand_finals');
        $this->assertEquals(2, count($finalsMatches)); // GF1 + GF2 (reset)
    }

    /**
     * Test 8-team double elimination bracket
     */
    public function test_8_team_double_elimination()
    {
        $teams = $this->generateTeams(8);
        $bracket = $this->controller->generateDoubleEliminationBracket($teams, 1);

        $this->assertEquals(8, $bracket['bracket_size']);
        $this->assertEquals(0, $bracket['bye_count']);
        
        // Expected: WR1(4) + WR2(2) + WSF(1) + LR1(2) + LR2(2) + LR3(1) + LR4(1) + GF(2) = 15 matches
        $this->assertEquals(15, count($bracket['matches']));
        
        $winnersMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'winners');
        $this->assertEquals(7, count($winnersMatches)); // 4 + 2 + 1
        
        $losersMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'losers');
        $this->assertEquals(6, count($losersMatches)); // 2 + 2 + 1 + 1
    }

    /**
     * Test 6-team double elimination bracket (with byes)
     */
    public function test_6_team_double_elimination_with_byes()
    {
        $teams = $this->generateTeams(6);
        $bracket = $this->controller->generateDoubleEliminationBracket($teams, 1);

        $this->assertEquals(8, $bracket['bracket_size']);
        $this->assertEquals(2, $bracket['bye_count']);
        
        // Top 2 seeds should get byes
        $winnersMatches = array_filter($bracket['matches'], fn($m) => 
            $m['bracket'] === 'winners' && 
            (!isset($m['is_bye']) || !$m['is_bye'])
        );
        
        // Should have fewer R1 matches due to byes
        $wr1Matches = array_filter($winnersMatches, fn($m) => $m['round'] === 1);
        $this->assertLessThan(4, count($wr1Matches));
    }

    /**
     * Test 10-team double elimination bracket
     */
    public function test_10_team_double_elimination()
    {
        $teams = $this->generateTeams(10);
        $bracket = $this->controller->generateDoubleEliminationBracket($teams, 1);

        $this->assertEquals(16, $bracket['bracket_size']);
        $this->assertEquals(6, $bracket['bye_count']);
        $this->assertEquals('double', $bracket['bracket_type']);
        
        // Verify total matches is reasonable
        $this->assertGreaterThan(15, count($bracket['matches']));
        $this->assertLessThan(30, count($bracket['matches']));
    }

    /**
     * Test 16-team double elimination bracket (power of 2)
     */
    public function test_16_team_double_elimination()
    {
        $teams = $this->generateTeams(16);
        $bracket = $this->controller->generateDoubleEliminationBracket($teams, 1);

        $this->assertEquals(16, $bracket['bracket_size']);
        $this->assertEquals(0, $bracket['bye_count']);
        
        // Expected: WR1(8) + WR2(4) + WR3(2) + WR4(1) + many losers rounds + GF(2)
        $winnersMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'winners');
        $this->assertEquals(15, count($winnersMatches)); // 8+4+2+1
        
        $losersMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'losers');
        $this->assertGreaterThan(10, count($losersMatches));
    }

    /**
     * Test match linking: winner_to and loser_to
     */
    public function test_match_linking()
    {
        $teams = $this->generateTeams(4);
        $bracket = $this->controller->generateDoubleEliminationBracket($teams, 1);

        foreach ($bracket['matches'] as $match) {
            // Winners bracket matches should have both winner_to and loser_to
            if ($match['bracket'] === 'winners' && !isset($match['is_bye'])) {
                $this->assertNotNull($match['winner_to'], "Match {$match['id']} should have winner_to");
                
                // All except final winners match should have loser_to
                if ($match['round'] < $bracket['winners_rounds']) {
                    $this->assertNotNull($match['loser_to'], "Match {$match['id']} should have loser_to");
                }
            }
            
            // Losers bracket matches should have winner_to
            if ($match['bracket'] === 'losers') {
                $this->assertNotNull($match['winner_to'], "Match {$match['id']} should have winner_to");
            }
        }
    }

    /**
     * Test seeding pattern follows Challonge
     */
    public function test_challonge_seeding_pattern()
    {
        $teams = $this->generateTeams(8);
        $bracket = $this->controller->generateDoubleEliminationBracket($teams, 1);

        // Get first winners round matches
        $wr1Matches = array_filter($bracket['matches'], fn($m) => 
            $m['bracket'] === 'winners' && 
            $m['round'] === 1 &&
            (!isset($m['is_bye']) || !$m['is_bye'])
        );
        
        // Expected pairings for 8 teams: [1v8, 5v4, 3v6, 7v2]
        $pairings = [];
        foreach ($wr1Matches as $match) {
            $pairings[] = [$match['team1_seed'], $match['team2_seed']];
        }
        
        // Verify seed 1 plays seed 8
        $found1v8 = false;
        foreach ($pairings as $pair) {
            if (($pair[0] == 1 && $pair[1] == 8) || ($pair[0] == 8 && $pair[1] == 1)) {
                $found1v8 = true;
                break;
            }
        }
        $this->assertTrue($found1v8, 'Seed 1 should play Seed 8');
        
        // Verify all seeds sum to 9 (1+8, 2+7, 3+6, 4+5)
        foreach ($pairings as $pair) {
            $sum = $pair[0] + $pair[1];
            $this->assertEquals(9, $sum, "Pairing seeds should sum to 9");
        }
    }

    /**
     * Test losers bracket receives losers from winners bracket
     */
    public function test_losers_bracket_feeds()
    {
        $teams = $this->generateTeams(8);
        $bracket = $this->controller->generateDoubleEliminationBracket($teams, 1);

        // Get WR1 matches
        $wr1Matches = array_filter($bracket['matches'], fn($m) => 
            $m['bracket'] === 'winners' && 
            $m['round'] === 1 &&
            (!isset($m['is_bye']) || !$m['is_bye'])
        );
        
        // Each WR1 match should feed losers to LR1
        foreach ($wr1Matches as $wrMatch) {
            $this->assertNotNull($wrMatch['loser_to']);
            $this->assertStringStartsWith('LR1_', $wrMatch['loser_to']);
        }
        
        // Get LR1 matches
        $lr1Matches = array_filter($bracket['matches'], fn($m) => 
            $m['bracket'] === 'losers' && 
            isset($m['losers_round']) &&
            $m['losers_round'] === 1
        );
        
        // LR1 should receive feeds from WR1
        foreach ($lr1Matches as $lrMatch) {
            $this->assertTrue(
                isset($lrMatch['feeds_from_match_1']) || 
                isset($lrMatch['feeds_from_match_2']),
                'LR1 matches should feed from WR1'
            );
        }
    }

    /**
     * Test grand finals structure
     */
    public function test_grand_finals_structure()
    {
        $teams = $this->generateTeams(4);
        $bracket = $this->controller->generateDoubleEliminationBracket($teams, 1);

        $finalsMatches = array_filter($bracket['matches'], fn($m) => 
            $m['bracket'] === 'grand_finals'
        );
        
        $this->assertEquals(2, count($finalsMatches), 'Should have 2 grand finals matches');
        
        $gf1 = array_values($finalsMatches)[0];
        $gf2 = array_values($finalsMatches)[1];
        
        $this->assertTrue($gf1['is_grand_finals']);
        $this->assertTrue($gf2['is_grand_finals']);
        $this->assertTrue($gf2['is_bracket_reset']);
        
        // GF1 should reference winners and losers finals
        $this->assertNotNull($gf1['previous_winners_match']);
        $this->assertNotNull($gf1['previous_losers_match']);
    }

    /**
     * Test edge case: 3 teams (minimum for double elimination)
     */
    public function test_3_team_minimum()
    {
        $teams = $this->generateTeams(3);
        $bracket = $this->controller->generateDoubleEliminationBracket($teams, 1);

        $this->assertEquals(4, $bracket['bracket_size']);
        $this->assertEquals(1, $bracket['bye_count']);
        $this->assertGreaterThanOrEqual(4, count($bracket['matches']));
    }

    /**
     * Test that match IDs are unique
     */
    public function test_unique_match_ids()
    {
        $teams = $this->generateTeams(8);
        $bracket = $this->controller->generateDoubleEliminationBracket($teams, 1);

        $ids = array_map(fn($m) => $m['id'], $bracket['matches']);
        $uniqueIds = array_unique($ids);
        
        $this->assertEquals(
            count($ids), 
            count($uniqueIds), 
            'All match IDs should be unique'
        );
    }

    /**
     * Test round numbering is correct
     */
    public function test_round_numbering()
    {
        $teams = $this->generateTeams(8);
        $bracket = $this->controller->generateDoubleEliminationBracket($teams, 1);

        // Winners rounds should be sequential
        $winnersMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'winners');
        $winnersRounds = array_unique(array_map(fn($m) => $m['round'], $winnersMatches));
        sort($winnersRounds);
        
        $expectedWinnersRounds = [1, 2, 3];
        $this->assertEquals($expectedWinnersRounds, $winnersRounds);
        
        // Losers rounds should be after winners rounds
        $losersMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'losers');
        foreach ($losersMatches as $match) {
            $this->assertGreaterThan($bracket['winners_rounds'], $match['round']);
        }
    }

    /**
     * Test visualization output
     */
    public function test_visualization()
    {
        $output = $this->controller->visualizeBracket(4);
        
        $this->assertStringContainsString('Double Elimination Bracket', $output);
        $this->assertStringContainsString('WINNERS BRACKET', $output);
        $this->assertStringContainsString('LOSERS BRACKET', $output);
        $this->assertStringContainsString('GRAND FINALS', $output);
    }
}
