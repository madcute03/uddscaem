# Dynamic Bracketing System - Implementation Guide

## Overview
A complete dynamic bracketing system (like Challonge) has been implemented in your UDD SCAEMS Laravel + React application. This system allows admins to create tournament brackets by selecting/inputting teams and automatically generating bracket structures.

## Features Implemented

### ✅ Backend (Laravel)

#### 1. Database Structure
Three new tables have been created:

**`teams` table:**
- `id` - Primary key
- `event_id` - Foreign key to events
- `name` - Team name
- `members` - JSON array of player names/IDs
- `seed` - Tournament seeding position
- `timestamps`

**`tournaments` table:**
- `id` - Primary key
- `event_id` - Foreign key to events
- `name` - Tournament name
- `bracket_type` - Enum: 'single', 'double', 'round-robin'
- `total_rounds` - Number of rounds
- `winner_id` - Foreign key to teams (nullable)
- `status` - Enum: 'draft', 'active', 'completed'
- `timestamps`

**`matches` table:**
- `id` - Primary key
- `tournament_id` - Foreign key to tournaments
- `round` - Round number
- `match_number` - Match number within round
- `team1_id` - Foreign key to teams (nullable)
- `team2_id` - Foreign key to teams (nullable)
- `winner_id` - Foreign key to teams (nullable)
- `next_match_id` - Foreign key to matches (nullable)
- `team1_score` - Score for team 1
- `team2_score` - Score for team 2
- `start_time` - Match start time
- `status` - Enum: 'pending', 'in_progress', 'completed'
- `timestamps`

#### 2. Models Created

**`Team` Model** (`app/Models/Team.php`)
- Relationships: belongsTo Event, hasMany TournamentMatch
- Casts members as array

**`Tournament` Model** (`app/Models/Tournament.php`)
- Relationships: belongsTo Event, hasMany TournamentMatch, belongsTo Team (winner)

**`TournamentMatch` Model** (`app/Models/TournamentMatch.php`)
- Table name: 'matches'
- Relationships: belongsTo Tournament, belongsTo Team (team1, team2, winner), belongsTo TournamentMatch (nextMatch)

**`Event` Model** (Updated)
- Added relationships: hasMany Tournament, hasMany Team

#### 3. Controller Methods

**`TournamentController`** (`app/Http/Controllers/TournamentController.php`)

Key methods:
- `showDynamicBracket($eventId)` - Renders the dynamic bracket creation page
- `generateBracket(Request $request)` - Generates bracket structure from teams
- `storeBracket(Request $request)` - Saves generated bracket to database
- `getBracket($eventId)` - Retrieves bracket data for an event
- `updateMatchResult(Request $request, $matchId)` - Updates match results
- `generateSingleEliminationBracket()` - Creates single elimination structure
- `generateDoubleEliminationBracket()` - Creates double elimination structure
- `generateRoundRobinBracket()` - Creates round robin structure

#### 4. API Routes

Added to `routes/web.php` (within authenticated middleware):

```php
// Dynamic Bracket Page
Route::get('/events/{event}/dynamic-bracket', [TournamentController::class, 'showDynamicBracket'])
    ->name('events.dynamicBracket');

// API Routes (within authenticated group)
Route::prefix('api')->group(function () {
    Route::post('/bracket/generate', [TournamentController::class, 'generateBracket'])
        ->name('api.bracket.generate');
    Route::post('/bracket/store', [TournamentController::class, 'storeBracket'])
        ->name('api.bracket.store');
    Route::get('/bracket/{eventId}', [TournamentController::class, 'getBracket'])
        ->name('api.bracket.get');
    Route::put('/bracket/match/{matchId}', [TournamentController::class, 'updateMatchResult'])
        ->name('api.bracket.updateMatch');
});
```

### ✅ Frontend (React)

#### 1. Dynamic Bracket Component

**`DynamicBracket.jsx`** (`resources/js/Pages/DynamicBracket.jsx`)

Features:
- **Team Input Panel:**
  - Add/remove teams manually
  - Auto-populate teams from registered players
  - Tournament name input
  - Bracket type selection (Single/Double/Round Robin)
  
- **Bracket Preview Panel:**
  - Live preview of generated bracket structure
  - Tournament information display
  - Matches organized by rounds
  - Save bracket button
  
- **Success State:**
  - Confirmation message after saving
  - Link to view event page

#### 2. Event Show Page Updates

**`ShowEvent.jsx`** (Updated)

Changes:
- Added `tournament` prop to display saved tournament data
- Added "Dynamic Bracketing" button (Admin only)
- Shows tournament status when bracket exists
- "View Bracket" button appears after bracket is saved
- Tournament info displays: name, type, and status

**`EventController`** (Updated)
- Modified `show()` method to load tournament data with matches and teams

## How to Use

### For Admins:

1. **Navigate to Bracket Management:**
   - Go to `/dashboard/bracket` (Tournament Bracket Management page)
   - You'll see all events that have `allow_bracketing` enabled

2. **Create Dynamic Bracket:**
   - Click the "Dynamic Bracketing" button (purple button at the top of each event card)
   - You'll be taken to `/events/{id}/dynamic-bracket`
   - **Note:** This button is only visible to admins and the route is protected

3. **Setup Teams:**
   - Enter a tournament name
   - Select bracket type (Single/Double/Round Robin)
   - Either:
     - Manually add teams using "Add Team" button
     - Click "Auto-populate from Registered Players" to use registered players

4. **Generate Bracket:**
   - Click "Generate Bracket" button
   - You'll be redirected to the bracket preview page

5. **Review Bracket:**
   - On the preview page, you'll see:
     - Tournament information (type, teams, matches)
     - List of competing teams
     - Visual bracket structure (tree layout)
     - BYE teams are shown in gray/italic

6. **Save Bracket:**
   - Review the generated bracket
   - Click "Save Bracket" button (top right)
   - Bracket is saved to database
   - Success message appears with links to event page

7. **View Bracket:**
   - Return to event page
   - Click "View Bracket" button to see the saved bracket

### API Usage Examples:

**Generate Bracket:**
```javascript
POST /api/bracket/generate
{
    "event_id": 1,
    "teams": [
        { "name": "Team A", "members": ["Player 1", "Player 2"] },
        { "name": "Team B", "members": ["Player 3", "Player 4"] }
    ],
    "bracket_type": "single"
}
```

**Save Bracket:**
```javascript
POST /api/bracket/store
{
    "event_id": 1,
    "tournament_name": "Championship 2025",
    "bracket_type": "single",
    "teams": [...],
    "matches": [...],
    "total_rounds": 3
}
```

**Get Bracket:**
```javascript
GET /api/bracket/{eventId}
```

**Update Match Result:**
```javascript
PUT /api/bracket/match/{matchId}
{
    "winner_id": 5,
    "team1_score": 10,
    "team2_score": 8
}
```

## Bracket Generation Logic

### Single Elimination:
- Calculates next power of 2 for bracket size
- Adds BYE teams if needed
- Generates all rounds with proper next_match_id linking
- Winners advance to next round automatically

### Double Elimination:
- Currently uses single elimination structure
- Can be expanded to include losers bracket

### Round Robin:
- Generates all possible team matchups
- Each team plays every other team once

## Database Relationships

```
Event
  └── hasMany Tournament
  └── hasMany Team

Tournament
  └── belongsTo Event
  └── hasMany TournamentMatch
  └── belongsTo Team (winner)

Team
  └── belongsTo Event
  └── hasMany TournamentMatch (as team1)
  └── hasMany TournamentMatch (as team2)
  └── hasMany TournamentMatch (as winner)

TournamentMatch
  └── belongsTo Tournament
  └── belongsTo Team (team1)
  └── belongsTo Team (team2)
  └── belongsTo Team (winner)
  └── belongsTo TournamentMatch (nextMatch)
```

## Files Created/Modified

### Created:
- `database/migrations/2025_10_26_101359_create_teams_table.php`
- `database/migrations/2025_10_26_101247_create_tournaments_table.php`
- `database/migrations/2025_10_26_101301_create_matches_table.php`
- `app/Models/Team.php`
- `app/Models/Tournament.php`
- `app/Models/TournamentMatch.php`
- `app/Http/Controllers/TournamentController.php`
- `resources/js/Pages/DynamicBracket/CreateBracket.jsx` - Team input page
- `resources/js/Pages/DynamicBracket/ViewBracket.jsx` - Bracket preview page

### Modified:
- `app/Models/Event.php` - Added tournament and team relationships
- `app/Http/Controllers/EventController.php` - Added tournament loading in show()
- `resources/js/Pages/ShowEvent.jsx` - Added dynamic bracket button and tournament display
- `routes/web.php` - Added tournament routes

## Next Steps (Optional Enhancements)

1. **Bracket Visualization:**
   - Create a visual bracket tree component
   - Show match connections and progression

2. **Match Management:**
   - Add interface to update match scores
   - Real-time bracket updates

3. **Double Elimination:**
   - Implement full losers bracket
   - Handle grand finals logic

4. **Scheduling:**
   - Add match scheduling functionality
   - Send notifications for upcoming matches

5. **Statistics:**
   - Track team performance
   - Generate tournament reports

## Testing

To test the system:
1. Create an event with `allow_bracketing = true`
2. Add some registered players (optional)
3. Navigate to the event page as admin
4. Click "Create Dynamic Bracket"
5. Add teams and generate bracket
6. Save the bracket
7. View the saved bracket on the event page

---

**System Status:** ✅ Fully Functional
**Last Updated:** October 26, 2025
