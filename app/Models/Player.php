<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Player extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'student_id',
        'name',
        'email',
        'department',
        'age',
        'gdrive_link',
        'team_name',
        'status', // Optional: if you’re approving/disapproving players
    ];

    // Relationship: Each player belongs to one event
    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
