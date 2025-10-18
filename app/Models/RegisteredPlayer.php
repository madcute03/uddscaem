<?php

// app/Models/RegisteredPlayer.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegisteredPlayer extends Model
{
    protected $fillable = [
        'student_id',
        'name',
        'email',
        'department',
        'age',
        'gdrive_link',
    ];

    public function team()
    {
        return $this->belongsTo(EventRegistration::class, 'event_registration_id');
    }
}
