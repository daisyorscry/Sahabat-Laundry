<?php

namespace App\Models\OrderService;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Auth\User;

// App/Models/OrderService/ServiceCategory.php
class ServiceCategory extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    // Hilangkan kolom audit dari fillable (tapi allow untuk testing)
    protected $fillable = ['code', 'name', 'description', 'is_active', 'created_by', 'updated_by'];
    protected $casts = ['is_active' => 'bool'];

    protected static function booted(): void
    {
        static::creating(function ($m) {
            if (auth()->check()) {
                $m->created_by = (string) auth()->id();
                $m->updated_by = (string) auth()->id();
            } else if (config('app.system_user_id')) {
                $m->created_by = (string) config('app.system_user_id');
                $m->updated_by = (string) config('app.system_user_id');
            }
        });

        static::updating(function ($m) {
            if (auth()->check()) {
                $m->updated_by = (string) auth()->id();
            } else if (config('app.system_user_id')) {
                $m->updated_by = (string) config('app.system_user_id');
            }
        });
    }

    public function services()
    {
        return $this->hasMany(Service::class, 'category_id');
    }
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopeActive($q)
    {
        return $q->where('is_active', true);
    }
}
