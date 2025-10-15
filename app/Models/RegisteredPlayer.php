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
        'team_name',
        'status', // optional if you track approval
        'registered_at', // Track when player registered
    ];

    protected $dates = [
        'registered_at',
    ];

    // Set default registered_at to current timestamp if not provided
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($player) {
            if (empty($player->registered_at)) {
                $player->registered_at = now();
            }
        });
    }

    // Relationship: Each registered player belongs to one event
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Check if this registration is considered "new"
     * @param int $hours Hours threshold (default: 24 hours)
     * @return bool
     */
    public function isNew($hours = 24)
    {
        if (!$this->registered_at) {
            return false;
        }

        return $this->registered_at->gt(now()->subHours($hours));
    }

    /**
     * Scope to get recent registrations for an event
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $hours Hours threshold (default: 24 hours)
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeRecent($query, $hours = 24)
    {
        return $query->where('registered_at', '>', now()->subHours($hours));
    }

    /**
     * Get count of new registrations for a specific event
     * @param int $eventId
     * @param int $hours Hours threshold (default: 24 hours)
     * @return int
     */
    public static function getNewRegistrationsCount($eventId, $hours = 24)
    {
        return static::where('event_id', $eventId)
                    ->recent($hours)
                    ->count();
    }

    /**
     * Get new registrations for a specific event
     * @param int $eventId
     * @param int $hours Hours threshold (default: 24 hours)
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getNewRegistrations($eventId, $hours = 24)
    {
        return static::where('event_id', $eventId)
                    ->recent($hours)
                    ->orderBy('registered_at', 'desc')
                    ->get();
    }
}
