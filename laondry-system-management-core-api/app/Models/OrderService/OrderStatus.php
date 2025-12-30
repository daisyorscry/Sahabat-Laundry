<?php

namespace App\Models\OrderService;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class OrderStatus extends Model
{
    use HasFactory;

    protected $table = 'order_statuses';
    protected $primaryKey = 'code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['code', 'name', 'color', 'icon', 'description', 'is_final', 'is_visible_to_customer'];
    protected $casts = [
        'is_final' => 'bool',
        'is_visible_to_customer' => 'bool',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class, 'status', 'code');
    }
    public function fromLogs()
    {
        return $this->hasMany(OrderStatusLog::class, 'from_status', 'code');
    }
    public function toLogs()
    {
        return $this->hasMany(OrderStatusLog::class, 'to_status', 'code');
    }

    // Workflow relationships
    public function workflowSteps()
    {
        return $this->hasMany(StatusWorkflowStep::class, 'status_code', 'code');
    }

    public function transitionsFrom()
    {
        return $this->hasMany(StatusTransition::class, 'from_status', 'code');
    }

    public function transitionsTo()
    {
        return $this->hasMany(StatusTransition::class, 'to_status', 'code');
    }

    // Scope for customer-visible statuses
    public function scopeVisibleToCustomer($q)
    {
        return $q->where('is_visible_to_customer', true);
    }
}
