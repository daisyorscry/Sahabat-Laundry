<?php

namespace App\Models\OrderService;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Auth\User;

class Outlet extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'phone',
        'email',
        'address_line',
        'city',
        'province',
        'postal_code',
        'is_active',
        'created_by',
        'updated_by',
    ];
    protected $casts = ['is_active' => 'bool'];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function servicePrices()
    {
        return $this->hasMany(ServicePrice::class);
    }
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function scopeActive($q)
    {
        return $q->where('is_active', true);
    }
}
