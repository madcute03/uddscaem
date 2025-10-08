<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_WRITER = 'writer';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'bio',
        'avatar_path',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function scopeWriters($query)
    {
        return $query->where('role', self::ROLE_WRITER);
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }
    
    public function isWriter(): bool
    {
        return $this->role === self::ROLE_WRITER;
    }

    public function news()
    {
        return $this->hasMany(News::class, 'writer_id');
    }

    public function writerProfile()
    {
        return $this->hasOne(Writer::class);
    }
    
}


