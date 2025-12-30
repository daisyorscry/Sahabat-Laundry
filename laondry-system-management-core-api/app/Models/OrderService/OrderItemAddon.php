<?php

namespace App\Models\OrderService;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class OrderItemAddon extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_item_id',
        'addon_id',
        'addon_code',
        'addon_name',
        'qty',
        'unit_price',
        'line_total'
    ];
    protected $casts = [
        'qty' => 'int',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function item()
    {
        return $this->belongsTo(OrderItem::class, 'order_item_id');
    }
    public function addon()
    {
        return $this->belongsTo(Addon::class, 'addon_id');
    }
}
