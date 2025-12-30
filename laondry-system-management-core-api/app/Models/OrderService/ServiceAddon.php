<?php

namespace App\Models\OrderService;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ServiceAddon extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['service_id', 'addon_id', 'is_required'];
    protected $casts = ['is_required' => 'bool'];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
    public function addon()
    {
        return $this->belongsTo(Addon::class);
    }
}
