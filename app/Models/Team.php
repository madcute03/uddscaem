<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'name',
        'members',
        'seed',
    ];

    protected $casts = [
        'members' => 'array',
    ];

    /**
     * Get the event that owns the team.
     */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the matches where this team is team1.
     */
    public function matchesAsTeam1()
    {
        return $this->hasMany(TournamentMatch::class, 'team1_id');
    }

    /**
     * Get the matches where this team is team2.
     */
    public function matchesAsTeam2()
    {
        return $this->hasMany(TournamentMatch::class, 'team2_id');
    }

    /**
     * Get the matches won by this team.
     */
    public function wonMatches()
    {
        return $this->hasMany(TournamentMatch::class, 'winner_id');
    }
}
