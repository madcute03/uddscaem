<?php

// app/Models/Bracket.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bracket extends Model {
    use HasFactory;

    protected $fillable = [
        'event_id',
        'matches',
        'champion',
        'game_number',
        'round',
        'home_team_id',
        'visitor_team_id',
        'home_score',
        'visitor_score'
    ];

    protected $casts = [
        'matches' => 'array', // automatically cast JSON to array
    ];

    public function event() {
        return $this->belongsTo(Event::class,'event_id');
    }
}
