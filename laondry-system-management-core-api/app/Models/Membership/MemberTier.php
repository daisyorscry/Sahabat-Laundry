<?php

namespace App\Models\Membership;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Auth\User;

class MemberTier extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'min_spending',
        'discount_percentage',
        'benefits',
        'is_active',
        'priority',
    ];

    protected $casts = [
        'min_spending' => 'decimal:2',
        'discount_percentage' => 'integer',
        'benefits' => 'array',
        'is_active' => 'boolean',
        'priority' => 'integer',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'member_tier_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrderedByPriority($query)
    {
        return $query->orderBy('priority', 'desc');
    }
}
