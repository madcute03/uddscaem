<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BorrowRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_name',
        'student_id',
        'email',
        'item_id',
        'status',
        'requested_at',
        'approved_at',
        'denied_at',
        'returned_at',
        'purpose',
        'quantity',
        'contact_number',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'denied_at' => 'datetime',
        'returned_at' => 'datetime',
        'quantity' => 'integer',
    ];

    protected $attributes = [
        'quantity' => 1,
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}


