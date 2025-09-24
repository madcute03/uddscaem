<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'coordinator_name',
        'category',
        'other_category',
        'event_type',
        'other_event_type',
        'event_date',
        'registration_end_date',
        'has_registration_end_date',
        'required_players',
        'is_done',
        'allow_bracketing',
    ];

    protected $casts = [
        'is_done' => 'boolean',
        'allow_bracketing' => 'boolean',
        'has_registration_end_date' => 'boolean',
        'event_date' => 'datetime',
        'registration_end_date' => 'datetime',
    ];
    
    protected $attributes = [
        'event_type' => 'competition', // Default value
        'category' => 'sport', // Default value
        'is_done' => false,
        'allow_bracketing' => false,
        'has_registration_end_date' => false,
    ];
    
    protected $dates = [
        'event_date',
        'registration_end_date',
        'created_at',
        'updated_at',
    ];


    // Event images
    public function images()
    {
        return $this->hasMany(EventImage::class);
    }

    // Event registrations
    public function registrations()
    {
        return $this->hasMany(EventRegistration::class);
    }

    // Event bracket
    public function bracket()
    {
        return $this->hasOne(Bracket::class, 'event_id');
    }
}
