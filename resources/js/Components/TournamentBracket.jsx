import React from 'react';
import Bracket from '@g-loot/react-tournament-brackets';

const transformMatches = (matches) => {
  // Create a map to track match IDs and their corresponding next match IDs
  const matchMap = {};
  const transformedMatches = [];

  // First pass: Create a map of match IDs to their next match IDs
  matches.forEach(match => {
    if (match.next_match_id) {
      matchMap[match.id] = match.next_match_id;
    }
  });

  // Second pass: Transform each match
  matches.forEach(match => {
    const transformedMatch = {
      id: match.id.toString(),
      name: `Match ${match.match_number || match.id}`,
      nextMatchId: match.next_match_id ? match.next_match_id.toString() : null,
      tournamentRoundText: match.round ? `Round ${match.round}` : '1',
      state: match.status === 'completed' ? 'DONE' : 'SCHEDULED',
      participants: []
    };

    // Add team 1 if exists
    if (match.slot1 || match.team1_name) {
      transformedMatch.participants.push({
        id: match.team1_id ? match.team1_id.toString() : `t1-${match.id}`,
        name: match.slot1 || match.team1_name || 'TBD',
        resultText: match.team1_score?.toString() || '',
        isWinner: match.winner_id === match.team1_id
      });
    }

    // Add team 2 if exists
    if (match.slot2 || match.team2_name) {
      transformedMatch.participants.push({
        id: match.team2_id ? match.team2_id.toString() : `t2-${match.id}`,
        name: match.slot2 || match.team2_name || 'TBD',
        resultText: match.team2_score?.toString() || '',
        isWinner: match.winner_id === match.team2_id
      });
    }

    transformedMatches.push(transformedMatch);
  });

  return transformedMatches;
};

const TournamentBracket = ({ matches, onMatchClick }) => {
  if (!matches || matches.length === 0) {
    return <div>No matches available</div>;
  }

  const transformedMatches = transformMatches(matches);

  return (
    <div className="bracket-container" style={{ width: '100%', overflow: 'auto' }}>
      <Bracket 
        matches={transformedMatches}
        matchComponent={({ match, onMatchClick }) => (
          <div 
            className="match-card p-2 bg-gray-800 rounded border border-gray-700 m-1 cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => onMatchClick && onMatchClick(match)}
          >
            <div className="text-sm font-semibold text-gray-300 mb-1">
              {match.name}
            </div>
            {match.participants.map((participant, i) => (
              <div 
                key={i} 
                className={`p-1 text-sm ${participant.isWinner ? 'text-green-400' : 'text-gray-300'}`}
              >
                {participant.name} {participant.resultText ? `(${participant.resultText})` : ''}
              </div>
            ))}
          </div>
        )}
        onMatchClick={onMatchClick}
      />
    </div>
  );
};

export default TournamentBracket;