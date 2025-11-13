# Integration Guide: Replacing TreeBracket with ChallongeBracket

This guide shows how to replace the existing TreeBracket component with the new Challonge-style bracket component.

## 🔄 Quick Migration

### Step 1: Update Imports

Replace the TreeBracket import with ChallongeBracket in your components:

**Before:**
```jsx
import TreeBracket from "@/Components/TournamentBracket/TreeBracket";
```

**After:**
```jsx
import ChallongeBracket from "@/Components/TournamentBracket/ChallongeBracket";
```

### Step 2: Update Component Usage

Replace the TreeBracket component tag with ChallongeBracket:

**Before:**
```jsx
<TreeBracket 
    matches={generatedBracket.matches}
    tournament={{ 
        name: tournamentName, 
        bracket_type: bracketType,
        team_count: teamCount
    }}
    onReportScore={handleReportScore}
    zoomLevel={0.6}
/>
```

**After (Simplified):**
```jsx
<ChallongeBracket 
    matches={generatedBracket.matches}
/>
```

## 📦 Files That Need Updates

### 1. ViewBracket.jsx

**Location**: `resources/js/Pages/DynamicBracket/ViewBracket.jsx`

**Changes**:
```jsx
// Line 5: Change import
- import TreeBracket from "@/Components/TournamentBracket/TreeBracket";
+ import ChallongeBracket from "@/Components/TournamentBracket/ChallongeBracket";

// Line 237-244: Update component usage
- <TreeBracket 
-     matches={generatedBracket.matches}
-     tournament={{ 
-         name: tournamentName, 
-         bracket_type: bracketType,
-         team_count: teamCount
-     }}
- />
+ <ChallongeBracket 
+     matches={generatedBracket.matches}
+ />
```

### 2. ManageBracket.jsx

**Location**: `resources/js/Pages/DynamicBracket/ManageBracket.jsx`

**Changes**:
```jsx
// Update import
- import TreeBracket from "@/Components/TournamentBracket/TreeBracket";
+ import ChallongeBracket from "@/Components/TournamentBracket/ChallongeBracket";

// Update component
- <TreeBracket 
-     matches={generatedBracket.matches}
-     tournament={{ 
-         name: tournamentName, 
-         bracket_type: bracketType,
-         team_count: teamCount
-     }}
-     onReportScore={handleReportScore}
- />
+ <ChallongeBracket 
+     matches={generatedBracket.matches}
+ />
```

**Note**: If you need the `onReportScore` functionality, you'll need to add it to ChallongeBracket component.

### 3. PublicViewBracket.jsx

**Location**: `resources/js/Pages/DynamicBracket/PublicViewBracket.jsx`

**Changes**:
```jsx
// Update import
- import TreeBracket from "@/Components/TournamentBracket/TreeBracket";
+ import ChallongeBracket from "@/Components/TournamentBracket/ChallongeBracket";

// Update component
- <TreeBracket 
-     matches={generatedBracket.matches}
-     tournament={{ 
-         name: tournamentName, 
-         bracket_type: bracketType,
-         team_count: teamCount
-     }}
- />
+ <ChallongeBracket 
+     matches={generatedBracket.matches}
+ />
```

## 🔧 Data Transformation (if needed)

If your backend returns data in a different format, transform it before passing to ChallongeBracket:

```jsx
// Example transformation function
const transformMatchData = (backendMatches) => {
    return backendMatches.map(match => ({
        id: match.id,
        round: match.round,
        slot1: match.team1?.name || 'TBD',
        slot2: match.team2?.name || 'TBD',
        winner_to: match.next_match_id,
        team1_score: match.team1_score,
        team2_score: match.team2_score,
        winner_slot: match.winner_id === match.team1_id ? 1 : 
                     match.winner_id === match.team2_id ? 2 : null,
        winner_id: match.winner_id
    }));
};

// Usage
<ChallongeBracket 
    matches={transformMatchData(generatedBracket.matches)}
/>
```

## ➕ Adding Report Score Feature

If you need the report score button functionality in ChallongeBracket:

### Option 1: Add as prop
```jsx
// In ChallongeBracket.jsx, add to props
const ChallongeBracket = ({ matches = [], onReportScore }) => {
    // ... existing code ...
    
    // In renderMatch function, add button
    {onReportScore && !hasWinner && team1 !== 'TBD' && team2 !== 'TBD' && (
        <button
            onClick={() => onReportScore(match)}
            className="mt-1 w-full px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
        >
            Report Score
        </button>
    )}
}
```

### Option 2: Use click handler on match
```jsx
// Make entire match clickable
const renderMatch = (match) => {
    // ... existing code ...
    
    return (
        <div
            onClick={() => onMatchClick && onMatchClick(match)}
            className="... cursor-pointer"
            // ... existing code ...
        >
```

## 🎨 Styling Customization

### Match the existing app theme

If you want to match TreeBracket's dark theme:

```jsx
// In ChallongeBracket.jsx
// Change match card styling from:
className="bg-white border-gray-300"

// To dark theme:
className="bg-gray-800 border-gray-700 text-white"

// Update winner highlight from:
className="bg-green-100 text-green-800"

// To dark:
className="bg-green-600 text-white"
```

## 🧪 Testing After Integration

1. **Visual Check**: Verify bracket renders correctly for 4, 8, 16 team tournaments
2. **Lines**: Ensure connecting lines appear between matches
3. **Scrolling**: Test horizontal/vertical scroll on smaller screens
4. **Responsive**: Check on mobile, tablet, desktop
5. **Data**: Verify winner highlighting works
6. **Interactions**: Test any click handlers or buttons

## ⚡ Performance Notes

ChallongeBracket is optimized with:
- Memoized position calculations
- Efficient SVG line rendering
- Minimal re-renders
- Ref-based DOM measurements

## 🐛 Common Issues

### Issue: Lines not connecting
**Solution**: Ensure `winner_to` property matches existing match IDs

### Issue: Layout too wide/narrow
**Solution**: Adjust `ROUND_SPACING` constant in component

### Issue: Matches overlapping vertically
**Solution**: Increase `BASE_VERTICAL_GAP` constant

### Issue: Component not updating
**Solution**: Check that matches array reference changes on updates

## 🔙 Rollback Plan

If you need to revert to TreeBracket:

1. Keep the original TreeBracket.jsx file as backup
2. Use git to revert changes: `git checkout -- [file]`
3. Or manually change imports back to TreeBracket

## 📊 Comparison

| Feature | TreeBracket | ChallongeBracket |
|---------|-------------|------------------|
| Layout Style | Tree/Hierarchical | Horizontal Columns |
| Complexity | High (~1000 lines) | Low (~350 lines) |
| Spacing | Complex adaptive | Simple exponential |
| Double Elim | ✅ Yes | ❌ Single only |
| Customization | Difficult | Easy |
| Performance | Good | Excellent |
| Maintainability | Complex | Simple |

## 🎯 Recommended Approach

**For Single Elimination Only:**
- Use ChallongeBracket ✅
- Cleaner, simpler, more maintainable

**For Double Elimination:**
- Continue using TreeBracket
- Or extend ChallongeBracket with double elim support

## 📞 Support

For issues or questions:
1. Check the README.md
2. Review the example in ChallongeBracketExample.jsx
3. Test with sample data from the examples

---

**Last Updated**: 2024  
**Component Version**: 1.0.0
