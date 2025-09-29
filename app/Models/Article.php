<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Article extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'body',
        'hero_image_path',
        'status',
        'published_at',
        'author_id',
        'category_id',
        'is_featured',
        'is_headline',
        'is_popular',
        'views',
        'reading_time',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_headline' => 'boolean',
        'is_popular' => 'boolean',
        'published_at' => 'datetime',
    ];

    protected $appends = [
        'hero_image_url',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function (Article $article) {
            if (empty($article->slug)) {
                $article->slug = Str::slug($article->title);
            }

            if (empty($article->reading_time)) {
                $article->reading_time = ceil(str_word_count(strip_tags($article->body ?? '')) / 200);
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')->whereNotNull('published_at');
    }

    public function scopeRecent(Builder $query): Builder
    {
        return $query->published()->latest('published_at');
    }

    public function scopePopular(Builder $query): Builder
    {
        return $query->published()->orderByDesc('views');
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->published()->where('is_featured', true);
    }

    public function getHeroImageUrlAttribute(): ?string
    {
        $path = $this->hero_image_path;

        if (empty($path)) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://') || str_starts_with($path, '//')) {
            return $path;
        }

        $storagePath = Storage::url($path);

        if (Storage::disk('public')->exists($path)) {
            return $storagePath;
        }

        return asset($storagePath);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
