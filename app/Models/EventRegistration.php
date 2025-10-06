<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'team_name',
    ];

    // Relationship: A registration has many players
    public function players()
{
    return $this->hasMany(Player::class, 'event_registration_id');
}

public function event()
{
    return $this->belongsTo(Event::class);
}


}
