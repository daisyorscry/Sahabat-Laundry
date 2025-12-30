<?php

namespace App\Models\OrderService;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StatusTransition extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'from_status',
        'to_status',
        'condition',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'bool',
    ];

    public function fromStatus()
    {
        return $this->belongsTo(OrderStatus::class, 'from_status', 'code');
    }

    public function toStatus()
    {
        return $this->belongsTo(OrderStatus::class, 'to_status', 'code');
    }

    public function scopeActive($q)
    {
        return $q->where('is_active', true);
    }

    // Helper: Check if transition is allowed
    public static function isAllowed(string $fromStatus, string $toStatus): bool
    {
        return self::active()
            ->where('from_status', $fromStatus)
            ->where('to_status', $toStatus)
            ->exists();
    }

    // Helper: Get allowed next statuses
    public static function getAllowedNextStatuses(string $fromStatus): array
    {
        return self::active()
            ->where('from_status', $fromStatus)
            ->pluck('to_status')
            ->toArray();
    }
}
