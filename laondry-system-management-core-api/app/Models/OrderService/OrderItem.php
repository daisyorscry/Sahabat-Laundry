<?php

namespace App\Models\OrderService;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class OrderItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_id',
        'service_id',
        'service_code',
        'service_name',
        'weight_kg',
        'qty',
        'unit_price',
        'line_total'
    ];
    protected $casts = [
        'weight_kg' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
    public function service()
    {
        return $this->belongsTo(Service::class);
    }
    public function addons()
    {
        return $this->hasMany(OrderItemAddon::class, 'order_item_id');
    }
}
