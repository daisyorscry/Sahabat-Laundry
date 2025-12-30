<?php

namespace App\Models\Auth;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;


class User extends Authenticatable
{
    use HasFactory, SoftDeletes, HasUuids, Notifiable, HasApiTokens;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'full_name',
        'email',
        'phone_number',
        'password_hash',
        'pin_hash',
        'is_active',
        'member_tier_id',
        'balance',
        'customer_status_id',
        'banned_reason',
        'token_version',
        'avatar_disk',
        'avatar_path',

    ];

    protected $hidden = [
        'password_hash',
        'pin_hash',
        'remember_token', // kalau pakai

    ];

    protected $casts = [
        'is_active' => 'boolean',
        'balance' => 'decimal:2',
        'email_verified_at' => 'datetime',
        'deleted_at' => 'datetime',
        'token_version' => 'integer',
        'member_tier_id' => 'integer',
    ];

    protected $appends = ['avatar_url'];

    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar_path)
            return null;
        $disk = $this->avatar_disk ?: 'public';
        try {
            return Storage::disk($disk)->url($this->avatar_path);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function scopeSearchAll($q, string $term)
    {
        $t = trim($term);
        return $q->where(function ($w) use ($t) {
            $w->where('full_name', 'ilike', "%$t%")
                ->orWhere('email', 'ilike', "%$t%")
                ->orWhere('phone_number', 'ilike', "%$t%")
                ->orWhere('banned_reason', 'ilike', "%$t%");
        });
    }

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    // relasi
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles')->withTimestamps();
    }

    public function addresses()
    {
        return $this->hasMany(UserAddress::class);
    }

    public function otps()
    {
        return $this->hasMany(UserOtp::class);
    }

    public function staffPositions()
    {
        return $this->hasMany(StaffPosition::class);
    }

    public function customerStatus()
    {
        return $this->belongsTo(CustomerStatus::class);
    }

    public function memberTier()
    {
        return $this->belongsTo(\App\Models\Membership\MemberTier::class, 'member_tier_id');
    }

    public function logins()
    {
        return $this->hasMany(UserLogin::class);
    }

    public function orders()
    {
        return $this->hasMany(\App\Models\OrderService\Order::class, 'customer_id');
    }

    public function getAddressAttribute()
    {
        return $this->addresses()->where('is_primary', true)->value('address');
    }
}
