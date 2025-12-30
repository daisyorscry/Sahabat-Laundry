<?php

namespace App\Models\OrderService;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Auth\User;
use App\Helpers\ImageStorage;

class Service extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'code',
        'category_id',
        'name',
        'description',
        'pricing_model',
        'base_price',
        'min_qty',
        'est_duration_hours',
        'is_express_available',
        'is_active',
        'icon_path',
        'workflow_template_id',
        'created_by',
        'updated_by'
    ];
    protected $casts = [
        'base_price' => 'decimal:2',
        'min_qty' => 'decimal:2',
        'is_express_available' => 'bool',
        'is_active' => 'bool',
    ];

    protected $appends = ['icon_url'];

    public function getIconUrlAttribute(): ?string
    {
        return ImageStorage::publicUrl($this->icon_path);
    }

    public function category()
    {
        return $this->belongsTo(ServiceCategory::class, 'category_id');
    }
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Pivot M2M
    public function addons()
    {
        return $this->belongsToMany(Addon::class, 'service_addons')
            ->withPivot(['is_required', 'created_at', 'updated_at'])
            ->withTimestamps();
    }
    public function serviceAddons()
    {
        return $this->hasMany(ServiceAddon::class);
    }

    public function prices()
    {
        return $this->hasMany(ServicePrice::class);
    }
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function workflowTemplate()
    {
        return $this->belongsTo(StatusWorkflowTemplate::class, 'workflow_template_id');
    }

    public function scopeActive($q)
    {
        return $q->where('is_active', true);
    }
}
