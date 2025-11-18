<?php

require __DIR__ . '/vendor/autoload.php';

// Load the framework
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

// Function to generate bracket for specified team size
function generateBracketForTeamSize($teamCount) {
    $controller = new App\Http\Controllers\ChallongeDoubleEliminationController();
    $teams = [];
    for ($i = 1; $i <= $teamCount; $i++) {
        $teams[] = ['name' => "Team {$i}"];
    }
    return $controller->generateDoubleEliminationBracket($teams, 1);
}

// Analyze matches in a specific losers round
function analyzeLosersRound($teamCount, $bracket, $targetRound) {
    $losersMatches = array_filter($bracket['matches'], function($m) use ($targetRound) {
        return $m['bracket'] === 'losers' && ($m['losers_round'] ?? 0) == $targetRound;
    });
    
    echo "=== TEAM SIZE {$teamCount} - LOSERS ROUND {$targetRound} ANALYSIS ===\n";
    
    foreach ($losersMatches as $match) {
        echo "Match ID: {$match['id']} (#{$match['match_number']})\n";
        echo "  Winner advances to: " . ($match['winner_to'] ?? 'NONE') . "\n";
        echo "  Previous match 1: " . ($match['previous_match_1'] ?? 'NONE') . "\n";
        echo "  Previous match 2: " . ($match['previous_match_2'] ?? 'NONE') . "\n";
        echo "  Previous match loser 1: " . ($match['previous_match_loser_1'] ?? 'NONE') . "\n";
        echo "  Previous match loser 2: " . ($match['previous_match_loser_2'] ?? 'NONE') . "\n\n";
    }
    
    // Also check the next round to see what's coming from this round
    $nextRound = $targetRound + 1;
    $nextRoundMatches = array_filter($bracket['matches'], function($m) use ($nextRound) {
        return $m['bracket'] === 'losers' && ($m['losers_round'] ?? 0) == $nextRound;
    });
    
    if (!empty($nextRoundMatches)) {
        echo "=== NEXT ROUND (LR{$nextRound}) ANALYSIS ===\n";
        foreach ($nextRoundMatches as $match) {
            echo "Match ID: {$match['id']} (#{$match['match_number']})\n";
            echo "  Winner advances to: " . ($match['winner_to'] ?? 'NONE') . "\n";
            echo "  Previous match 1: " . ($match['previous_match_1'] ?? 'NONE') . "\n";
            echo "  Previous match 2: " . ($match['previous_match_2'] ?? 'NONE') . "\n";
            echo "  Previous match loser 1: " . ($match['previous_match_loser_1'] ?? 'NONE') . "\n";
            echo "  Previous match loser 2: " . ($match['previous_match_loser_2'] ?? 'NONE') . "\n\n";
        }
    } else {
        echo "No matches in LR{$nextRound}\n\n";
    }
    
    // Check match in the finals
    $finalsMatches = array_filter($bracket['matches'], function($m) {
        return $m['bracket'] === 'grand_finals';
    });
    
    if (!empty($finalsMatches)) {
        echo "=== GRAND FINALS ANALYSIS ===\n";
        foreach ($finalsMatches as $match) {
            echo "Match ID: {$match['id']} (#{$match['match_number']})\n";
            echo "  Previous winners match: " . ($match['previous_winners_match'] ?? 'NONE') . "\n";
            echo "  Previous losers match: " . ($match['previous_losers_match'] ?? 'NONE') . "\n\n";
        }
    }
}

// Generate brackets
$bracket25 = generateBracketForTeamSize(25);
$bracket26 = generateBracketForTeamSize(26);

// Analyze specific rounds
analyzeLosersRound(25, $bracket25, 7);
analyzeLosersRound(26, $bracket26, 7);

// Let's also look at LR8 for both
analyzeLosersRound(25, $bracket25, 8);
analyzeLosersRound(26, $bracket26, 8);

echo "Done.\n";
