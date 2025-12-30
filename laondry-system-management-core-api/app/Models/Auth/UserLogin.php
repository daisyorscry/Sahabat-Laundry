<?php

namespace App\Models\Auth;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class UserLogin extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'logged_in_at',
        'ip_address',
        'user_agent',
        'device_type',
        'platform',
        'browser',
        'country',
        'region',
        'city',
        'latitude',
        'longitude',
        'timezone',
        'is_suspicious',
        'device_id'
    ];

    protected $casts = [
        'logged_in_at' => 'datetime',
        'latitude' => 'float',
        'longitude' => 'float',
        'is_suspicious' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
