<?php

namespace App\Models\OrderService;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Builder;

class ServicePrice extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'service_id',
        'outlet_id',
        'member_tier',
        'price',
        'effective_start',
        'effective_end',
        'is_express'
    ];
    protected $casts = [
        'price' => 'decimal:2',
        'effective_start' => 'date',
        'effective_end' => 'date',
        'is_express' => 'bool',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
    public function outlet()
    {
        return $this->belongsTo(Outlet::class);
    }
    public function memberTier()
    {
        return $this->belongsTo(\App\Models\Membership\MemberTier::class, 'member_tier', 'code');
    }

    // Scopes resolver harga aktif
    public function scopeEffectiveAt(Builder $q, $date)
    {
        return $q->where('effective_start', '<=', $date)
            ->where(function ($w) use ($date) {
                $w->whereNull('effective_end')->orWhere('effective_end', '>=', $date);
            });
    }
    public function scopeForTier(Builder $q, $tier)
    {
        return $tier ? $q->where('member_tier', $tier) : $q->whereNull('member_tier');
    }
    public function scopeExpress(Builder $q, bool $express)
    {
        return $q->where('is_express', $express);
    }

    // Helper ambil satu harga aktif
    public static function resolvePrice(string $serviceId, string $outletId, $date, ?string $tier, bool $express = false): ?self
    {
        // Try to find exact tier match first
        if ($tier) {
            $exactMatch = static::where('service_id', $serviceId)
                ->where('outlet_id', $outletId)
                ->where('member_tier', $tier)
                ->effectiveAt($date)
                ->express($express)
                ->latest('effective_start')
                ->first();

            if ($exactMatch) {
                return $exactMatch;
            }
        }

        // Fallback to NULL tier (base outlet price)
        return static::where('service_id', $serviceId)
            ->where('outlet_id', $outletId)
            ->whereNull('member_tier')
            ->effectiveAt($date)
            ->express($express)
            ->latest('effective_start')
            ->first();
    }
}
