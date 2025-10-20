<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Athlete extends Model
{
    protected $fillable = [
        'student_id',
        'name',
        'email',
        'contact_number',
        'birthdate',
        'department',
        'course',
        'year_level',
        'age',
        'enrolled_units',
        'scholarship_status',
        'sport_team',
        'team_name',
        'gdrive_link',
        'status',
        'registered_at',
    ];

    protected $casts = [
        'registered_at' => 'datetime',
        'birthdate' => 'date',
    ];

    /**
     * Get athlete's event registrations
     */
    public function eventRegistrations()
    {
        return $this->hasMany(RegisteredPlayer::class, 'student_id', 'student_id');
    }
}
