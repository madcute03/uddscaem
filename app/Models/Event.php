<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Event extends Model
{
    use HasFactory;

    /**
     * Automatically handle cleanup when deleting an event.
     */
    protected static function booted()
    {
        static::deleting(function ($event) {
            // Delete all associated images from storage (but not from DB since cascade will handle it)
            $event->images->each(function ($image) use ($event) {
                try {
                    if (Storage::disk('public')->exists($image->image_path)) {
                        Storage::disk('public')->delete($image->image_path);
                    }
                } catch (\Exception $e) {
                    \Log::error('Error deleting event image from storage: ' . $e->getMessage(), [
                        'image_id' => $image->id,
                        'event_id' => $event->id
                    ]);
                }
            });

            // Delete all player registrations when an event is deleted
            $event->registrations()->each(function ($registration) {
                $registration->delete();
            });
        });
    }

    protected $fillable = [
        'title',
        'description',
        'coordinator_name',
        'venue',
        'participants',
        'category',
        'other_category',
        'event_type',
        'other_event_type',
        'event_date',
        'event_end_date',
        'registration_end_date',
        'has_registration_end_date',
        'registration_type',
        'team_size',
        'required_players',
        'is_done',
        'allow_bracketing',
        'bracket_type',
        'teams',
    ];

    protected $casts = [
        'is_done' => 'boolean',
        'allow_bracketing' => 'boolean',
        'has_registration_end_date' => 'boolean',
        'event_date' => 'datetime',
        'event_end_date' => 'date',
        'registration_end_date' => 'datetime',
        'participants' => 'array',
    ];

    protected $attributes = [
        'event_type' => 'competition',
        'category' => 'sport',
        'is_done' => false,
        'allow_bracketing' => false,
        'has_registration_end_date' => false,
        'registration_type' => 'single',
    ];

    protected $dates = [
        'event_date',
        'event_end_date',
        'registration_end_date',
        'created_at',
        'updated_at',
    ];

    /**
     * Each event can have multiple images.
     */
    public function images()
    {
        return $this->hasMany(EventImage::class);
    }

    /**
     * Each event can have multiple single-player registrations.
     */
    public function registrations()
    {
        return $this->hasMany(RegisteredPlayer::class, 'event_id');
    }

    /**
     * Each event can have one bracket (for competitions).
     */
    public function bracket()
    {
        return $this->hasOne(Bracket::class, 'event_id');
    }
}
