<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tournament extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'name',
        'bracket_type',
        'total_rounds',
        'winners_rounds',
        'losers_rounds',
        'winner_id',
        'status',
    ];

    /**
     * Get the event that owns the tournament.
     */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the matches for the tournament.
     */
    public function matches()
    {
        return $this->hasMany(TournamentMatch::class);
    }

    /**
     * Get the winner team.
     */
    public function winner()
    {
        return $this->belongsTo(Team::class, 'winner_id');
    }
}
