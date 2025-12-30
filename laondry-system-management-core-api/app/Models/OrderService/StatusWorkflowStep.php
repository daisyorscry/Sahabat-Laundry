<?php

namespace App\Models\OrderService;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StatusWorkflowStep extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'workflow_template_id',
        'status_code',
        'step_order',
        'is_required',
        'is_skippable'
    ];

    protected $casts = [
        'step_order' => 'int',
        'is_required' => 'bool',
        'is_skippable' => 'bool',
    ];

    public function workflowTemplate()
    {
        return $this->belongsTo(StatusWorkflowTemplate::class, 'workflow_template_id');
    }

    public function status()
    {
        return $this->belongsTo(OrderStatus::class, 'status_code', 'code');
    }
}
