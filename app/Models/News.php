<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class News extends Model
{
    use HasFactory;

    protected $fillable = [
        'writer_id',
        'writer_name',
        'title',
        'slug',
        'category',
        'description',
        'date',
        'status',
        'image',
    ];

    protected $casts = [
        'date' => 'datetime',
    ];

    /**
     * Get the writer that owns the news.
     */
    public function writer()
    {
        return $this->belongsTo(User::class, 'writer_id');
    }

    /**
     * Scope a query to only include active news.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to only include pending news.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope a query to only include inactive news.
     */
    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }
}
