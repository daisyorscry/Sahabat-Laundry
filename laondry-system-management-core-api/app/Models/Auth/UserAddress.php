<?php

namespace App\Models\Auth;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids as HasUuidsTrait;

class UserAddress extends Model
{
    use HasFactory, HasUuidsTrait;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'label',
        'address',
        'latitude',
        'longitude',
        'is_primary'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
