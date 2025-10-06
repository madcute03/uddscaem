<?php

// app/Models/RegisteredPlayer.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegisteredPlayer extends Model
{
    protected $fillable = [
        'event_registration_id',
        'student_id',
        'name',
        'email',
        'department',
        'age',
        'player_image',
        'whiteform_image'
    ];

    public function team()
    {
        return $this->belongsTo(EventRegistration::class, 'event_registration_id');
    }
}
