<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Writer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bio',
        'specialization',
        'news_count',
        'status',
    ];

    /**
     * Get the user that owns the writer profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the news for the writer.
     */
    public function news()
    {
        return $this->hasManyThrough(News::class, User::class, 'id', 'writer_id', 'user_id', 'id');
    }
}
