<?php

namespace App\Models\OrderService;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Auth\User;

class OrderStatusLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['order_id', 'from_status', 'to_status', 'changed_by', 'note', 'changed_at'];
    protected $casts = ['changed_at' => 'datetime'];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
    public function from()
    {
        return $this->belongsTo(OrderStatus::class, 'from_status', 'code');
    }
    public function to()
    {
        return $this->belongsTo(OrderStatus::class, 'to_status', 'code');
    }
    public function changer()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
