<?php

// app/Models/Bracket.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bracket extends Model {
    use HasFactory;

    protected $fillable = ['event_id', 'matches', 'champion'];

    protected $casts = [
        'matches' => 'array', // automatically cast JSON to array
    ];

    public function event() {
        return $this->belongsTo(Event::class,'event_id');
    }
}
