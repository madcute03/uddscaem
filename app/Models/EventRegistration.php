<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'event_name',
        'event_date',
        'bracket_type',
    ];

    // One registration can have multiple players (for team registrations)
    public function players()
    {
        return $this->hasMany(Player::class, 'event_registration_id');
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
