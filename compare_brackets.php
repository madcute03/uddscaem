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

// Function to print stats for a bracket
function printBracketStats($teamCount, $bracket) {
    $winnersMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'winners');
    $losersMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'losers');
    $finalsMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'grand_finals' || $m['bracket'] === 'grand_finals_reset');
    
    // Group losers matches by round
    $losersByRound = [];
    foreach ($losersMatches as $match) {
        $lr = $match['losers_round'] ?? 0;
        if (!isset($losersByRound[$lr])) {
            $losersByRound[$lr] = [];
        }
        $losersByRound[$lr][] = $match;
    }
    
    // Sort losers rounds
    ksort($losersByRound);
    
    echo "=== BRACKET FOR {$teamCount} TEAMS ===\n";
    echo "Winners Rounds: {$bracket['winners_rounds']}\n";
    echo "Losers Rounds: {$bracket['losers_rounds']}\n";
    echo "Total Winners Matches: " . count($winnersMatches) . "\n";
    echo "Total Losers Matches: " . count($losersMatches) . "\n";
    echo "Finals Matches: " . count($finalsMatches) . "\n";
    echo "Total Matches: " . count($bracket['matches']) . "\n\n";
    
    echo "Losers Rounds Breakdown:\n";
    foreach ($losersByRound as $lr => $matches) {
        echo "LR{$lr}: " . count($matches) . " matches\n";
    }
    
    echo "\n";
}

// Compare brackets for 25 and 26 teams
$bracket25 = generateBracketForTeamSize(25);
$bracket26 = generateBracketForTeamSize(26);

printBracketStats(25, $bracket25);
printBracketStats(26, $bracket26);

// Check for routing issues in losers bracket
echo "=== CHECKING LOSERS BRACKET ROUTING ISSUES ===\n";

// Function to check for issues in losers matches
function checkLosersBracketIssues($teamCount, $bracket) {
    $losersMatches = array_filter($bracket['matches'], fn($m) => $m['bracket'] === 'losers');
    
    $issueCount = 0;
    $missingWinnerTo = 0;
    $missingLoserFrom = 0;
    
    foreach ($losersMatches as $match) {
        // Check if match is properly linked to next match
        if (empty($match['winner_to']) && $match['losers_round'] < $bracket['losers_rounds']) {
            $issueCount++;
            $missingWinnerTo++;
            echo "{$teamCount} Teams - Match {$match['id']} (LR{$match['losers_round']}) has no winner_to link!\n";
        }
        
        // Check if match is properly fed by previous matches
        if (($match['losers_round'] > 1) && 
            empty($match['previous_match_1']) && 
            empty($match['previous_match_2']) &&
            empty($match['previous_match_loser_1']) && 
            empty($match['previous_match_loser_2'])) {
            $issueCount++;
            $missingLoserFrom++;
            echo "{$teamCount} Teams - Match {$match['id']} (LR{$match['losers_round']}) has no previous match links!\n";
        }
    }
    
    echo "{$teamCount} Teams - Total Issues: {$issueCount} (Missing winner_to: {$missingWinnerTo}, Missing source: {$missingLoserFrom})\n\n";
}

checkLosersBracketIssues(25, $bracket25);
checkLosersBracketIssues(26, $bracket26);

echo "Done.\n";
