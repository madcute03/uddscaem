<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use App\Models\Bracket;

class Event extends Model
{
    use HasFactory;
    
    /**
     * The "booting" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::deleting(function ($event) {
            // Delete all associated images from storage and database
            $event->images->each(function ($image) {
                try {
                    if (Storage::disk('public')->exists($image->image_path)) {
                        Storage::disk('public')->delete($image->image_path);
                    }
                    $image->delete();
                } catch (\Exception $e) {
                    // Log the error but don't stop the deletion process
                    \Log::error('Error deleting event image: ' . $e->getMessage(), [
                        'image_id' => $image->id,
                        'event_id' => $event->id
                    ]);
                }
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
        'event_type' => 'competition', // Default value
        'category' => 'sport', // Default value
        'is_done' => false,
        'allow_bracketing' => false,
        'has_registration_end_date' => false,
    ];
    
    protected $dates = [
        'event_date',
        'event_end_date',
        'registration_end_date',
        'created_at',
        'updated_at',
    ];

    /**
     * Get the event's images.
     */
    public function images()
    {
        return $this->hasMany(EventImage::class);
    }

    /**
     * Get the event's registrations.
     */
    public function registrations()
    {
        return $this->hasMany(EventRegistration::class);
    }

    /**
     * Get the bracket associated with the event.
     */
    public function bracket()
    {
        return $this->hasOne(Bracket::class, 'event_id');
    }
}
