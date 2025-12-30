<?php

namespace App\Models\OrderService;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Auth\User;

class Order extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'order_no',
        'customer_id',
        'outlet_id',
        'status',
        'order_type',
        'requested_pickup_at',
        'promised_at',
        'pickup_address',
        'delivery_address',
        'total_weight',
        'total_piece',
        'subtotal',
        'discount',
        'tax',
        'delivery_fee',
        'grand_total',
        'external_invoice_id',
        'external_payment_id',
        'notes',
        'created_by',
        'updated_by'
    ];
    protected $casts = [
        'requested_pickup_at' => 'datetime',
        'promised_at' => 'datetime',
        'total_weight' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'grand_total' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }
    public function outlet()
    {
        return $this->belongsTo(Outlet::class);
    }
    public function statusRef()
    {
        return $this->belongsTo(OrderStatus::class, 'status', 'code');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
    public function logs()
    {
        return $this->hasMany(OrderStatusLog::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // helper hitung total
    public function recalcTotals(): void
    {
        $subtotal = $this->items()->sum('line_total');
        $this->subtotal = $subtotal;
        $this->grand_total = $subtotal - $this->discount + $this->tax + $this->delivery_fee;
    }
}
