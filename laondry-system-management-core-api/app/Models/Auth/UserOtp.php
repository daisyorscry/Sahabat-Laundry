<?php

namespace App\Models\Auth;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class UserOtp extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'user_otps';

    protected $fillable = [
        'user_id',
        'purpose',
        'otp_code',
        'expired_at',
        'attempt_count',
        'invalidated_at',
        'used_at',
    ];

    protected $casts = [
        'expired_at' => 'datetime',
        'invalidated_at' => 'datetime',
        'used_at' => 'datetime',
        'attempt_count' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
