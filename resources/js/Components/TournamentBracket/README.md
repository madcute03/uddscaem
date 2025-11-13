# Challonge-Style Tournament Bracket Component

A React + Tailwind CSS component that replicates the visual layout of Challonge tournament brackets for Single Elimination tournaments.

## 🎯 Features

- **Horizontal Layout**: Rounds displayed as vertical columns from left to right
- **Dynamic Spacing**: Automatic exponential vertical spacing that adapts to team count (4-64+ teams)
- **Visual Connections**: Smooth SVG lines connecting matches with right-angled paths
- **Modern Styling**: TailwindCSS with rounded corners, shadows, and hover effects
- **Responsive Design**: Scrollable container that works on various screen sizes
- **Winner Highlighting**: Green background for winning teams
- **Match Badges**: Visual match numbering
- **Auto Round Labels**: Automatically names rounds (Round 1, Quarterfinals, Semifinals, Finals)

## 📦 Installation

The component is located at:
```
resources/js/Components/TournamentBracket/ChallongeBracket.jsx
```

## 🚀 Usage

### Basic Example

```jsx
import ChallongeBracket from './ChallongeBracket';

const MyTournament = () => {
    const matches = [
        { id: 1, round: 1, slot1: "Team A", slot2: "Team B", winner_to: 3 },
        { id: 2, round: 1, slot1: "Team C", slot2: "Team D", winner_to: 3 },
        { id: 3, round: 2, slot1: "Winner of 1", slot2: "Winner of 2", winner_to: null },
    ];

    return <ChallongeBracket matches={matches} />;
};
```

### With Scores and Winners

```jsx
const matches = [
    { 
        id: 1, 
        round: 1, 
        slot1: "Seed 1", 
        slot2: "Seed 8", 
        winner_to: 5,
        team1_score: 3,
        team2_score: 1,
        winner_slot: 1,
        winner_id: 101
    },
    // ... more matches
];

<ChallongeBracket matches={matches} />
```

## 📋 Props

### `matches` (array, required)

Array of match objects. Each match object should have:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | number | ✅ | Unique match identifier |
| `round` | number | ✅ | Round number (1, 2, 3, ...) |
| `slot1` | string | ✅ | Team 1 name or seed |
| `slot2` | string | ✅ | Team 2 name or seed |
| `winner_to` | number\|null | ✅ | ID of next match for winner (null for finals) |
| `team1_score` | number | ❌ | Score for team 1 |
| `team2_score` | number | ❌ | Score for team 2 |
| `winner_slot` | 1\|2 | ❌ | Which slot won (1 or 2) |
| `winner_id` | number | ❌ | ID of winning team |

## 🎨 Visual Specifications

### Match Card
- **Width**: 180px
- **Height**: 60px
- **Style**: White background, gray border, rounded corners
- **Hover**: Shadow lift + 2% scale
- **Winner**: Green background highlight

### Layout
- **Round Spacing**: 220px horizontal gap between rounds
- **Vertical Spacing**: Exponential (doubles each round)
  - Round 1: Base spacing
  - Round 2: 2× spacing
  - Round 3: 4× spacing
  - Round 4: 8× spacing

### Connection Lines
- **Color**: Gray (#9ca3af)
- **Width**: 2px
- **Style**: Right-angled paths (horizontal → vertical → horizontal)

## 📐 Layout Algorithm

The component uses an exponential spacing algorithm:

1. **Round 1**: Matches are tightly spaced (base spacing)
2. **Round 2**: Spacing doubles to accommodate Round 1 convergence
3. **Round 3+**: Spacing continues to double for tree-like appearance

Formula: `spacing = (matchHeight + baseGap) × 2^roundIndex`

## 🖼️ Example Data Structures

### 4-Team Tournament
```javascript
[
    { id: 1, round: 1, slot1: "Team A", slot2: "Team D", winner_to: 3 },
    { id: 2, round: 1, slot1: "Team B", slot2: "Team C", winner_to: 3 },
    { id: 3, round: 2, slot1: "Winner of 1", slot2: "Winner of 2", winner_to: null },
]
```

### 8-Team Tournament
```javascript
[
    // Round 1 (4 matches)
    { id: 1, round: 1, slot1: "Seed 1", slot2: "Seed 8", winner_to: 5 },
    { id: 2, round: 1, slot1: "Seed 4", slot2: "Seed 5", winner_to: 5 },
    { id: 3, round: 1, slot1: "Seed 2", slot2: "Seed 7", winner_to: 6 },
    { id: 4, round: 1, slot1: "Seed 3", slot2: "Seed 6", winner_to: 6 },
    
    // Round 2 (2 matches)
    { id: 5, round: 2, slot1: "Winner of 1", slot2: "Winner of 2", winner_to: 7 },
    { id: 6, round: 2, slot1: "Winner of 3", slot2: "Winner of 4", winner_to: 7 },
    
    // Round 3 (Finals)
    { id: 7, round: 3, slot1: "Winner of 5", slot2: "Winner of 6", winner_to: null },
]
```

## 🔧 Customization

### Changing Match Dimensions

Edit the constants in `ChallongeBracket.jsx`:

```javascript
const MATCH_WIDTH = 180;        // Match card width
const MATCH_HEIGHT = 60;        // Match card height
const ROUND_SPACING = 220;      // Horizontal spacing
const BASE_VERTICAL_GAP = 20;   // Base vertical gap
```

### Changing Colors

Modify Tailwind classes in the `renderMatch` function:

```javascript
// Match card background
className="bg-white border-gray-300"

// Winner highlight
className="bg-green-100 text-green-800"

// Connection lines
stroke="#9ca3af"
```

### Custom Round Labels

Edit the `renderRoundLabels` function to customize round names.

## 📱 Responsive Behavior

- Component uses horizontal scroll for wide brackets
- Minimum container height: 400px
- Auto-calculated width based on number of rounds
- Works on mobile, tablet, and desktop

## 🎯 Best Practices

1. **Data Structure**: Always provide `winner_to` for proper line connections
2. **Unique IDs**: Ensure all match IDs are unique
3. **Round Numbers**: Start from 1 and increment sequentially
4. **TBD Matches**: Use "TBD" for undecided teams
5. **Finals**: Set `winner_to: null` for championship match

## 🐛 Troubleshooting

### Lines not showing
- Check that `winner_to` values match existing match IDs
- Ensure matches are rendered before lines are calculated
- Verify refs are properly attached to match elements

### Spacing too tight/loose
- Adjust `BASE_VERTICAL_GAP` constant
- Modify the multiplier in `calculateRoundSpacing`

### Matches overlapping
- Increase `ROUND_SPACING` for horizontal space
- Increase `BASE_VERTICAL_GAP` for vertical space

## 📚 Related Files

- **Component**: `ChallongeBracket.jsx`
- **Example**: `ChallongeBracketExample.jsx`
- **Documentation**: This README

## 🤝 Integration with Backend

If integrating with a Laravel backend, structure your API response:

```php
// Example controller response
return response()->json([
    'matches' => [
        [
            'id' => 1,
            'round' => 1,
            'slot1' => $team1->name,
            'slot2' => $team2->name,
            'winner_to' => 5,
            'team1_score' => $match->team1_score,
            'team2_score' => $match->team2_score,
            'winner_slot' => $match->winner_slot,
        ],
        // ...
    ]
]);
```

## 📄 License

Part of the UDDSCAEMS project.

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Author**: Senior Front-End Developer
