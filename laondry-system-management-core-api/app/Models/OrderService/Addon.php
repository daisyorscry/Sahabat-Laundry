<?php

namespace App\Models\OrderService;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Auth\User;
use App\Helpers\ImageStorage;

class Addon extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = ['code', 'name', 'description', 'price', 'is_active', 'icon_path', 'created_by', 'updated_by'];
    protected $casts = ['price' => 'decimal:2', 'is_active' => 'bool'];

    protected $appends = ['icon_url'];

    public function getIconUrlAttribute(): ?string
    {
        return ImageStorage::publicUrl($this->icon_path);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function services()
    {
        return $this->belongsToMany(Service::class, 'service_addons')
            ->withPivot(['is_required'])->withTimestamps();
    }
    public function serviceAddons()
    {
        return $this->hasMany(ServiceAddon::class);
    }

    public function orderItemAddons()
    {
        return $this->hasMany(OrderItemAddon::class, 'addon_id');
    }

    public function scopeActive($q)
    {
        return $q->where('is_active', true);
    }
}
