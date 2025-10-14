<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RegisteredPlayer extends Model
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
        'status', // optional if you track approval
    ];

    // Relationship: Each registered player belongs to one event
    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
