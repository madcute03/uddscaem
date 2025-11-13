<?php

namespace App\Models;

use App\Models\BorrowRequest;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'quantity',
    ];

    public function borrowRequests()
    {
        return $this->hasMany(BorrowRequest::class);
    }

    public function availableCount(): int
    {
        $borrowed = $this->borrowRequests()
            ->where('status', 'approved')
            ->whereNull('returned_at')
            ->sum('quantity');
        return max(0, (int) $this->quantity - $borrowed);
    }
}


