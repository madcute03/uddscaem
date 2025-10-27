<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TournamentMatch extends Model
{
    use HasFactory;

    protected $table = 'matches';

    protected $fillable = [
        'tournament_id',
        'round',
        'match_number',
        'team1_id',
        'team2_id',
        'winner_id',
        'next_match_id',
        'team1_score',
        'team2_score',
        'start_time',
        'status',
    ];

    protected $casts = [
        'start_time' => 'datetime',
    ];

    /**
     * Get the tournament that owns the match.
     */
    public function tournament()
    {
        return $this->belongsTo(Tournament::class);
    }

    /**
     * Get team 1.
     */
    public function team1()
    {
        return $this->belongsTo(Team::class, 'team1_id');
    }

    /**
     * Get team 2.
     */
    public function team2()
    {
        return $this->belongsTo(Team::class, 'team2_id');
    }

    /**
     * Get the winner team.
     */
    public function winner()
    {
        return $this->belongsTo(Team::class, 'winner_id');
    }

    /**
     * Get the next match in the bracket.
     */
    public function nextMatch()
    {
        return $this->belongsTo(TournamentMatch::class, 'next_match_id');
    }
}
