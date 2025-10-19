<?php

// app/Models/RegisteredPlayer.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegisteredPlayer extends Model
{
    protected $fillable = [
        'event_id',
        'student_id',
        'name',
        'email',
        'department',
        'age',
        'gdrive_link',
        'team_name',
        'status',
        'registered_at',
    ];

    protected $casts = [
        'registered_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function athlete()
    {
        return $this->belongsTo(Athlete::class, 'student_id', 'student_id');
    }
}
