<?php

namespace App\Models\OrderService;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StatusWorkflowTemplate extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'bool',
    ];

    public function steps()
    {
        return $this->hasMany(StatusWorkflowStep::class, 'workflow_template_id')->orderBy('step_order');
    }

    public function services()
    {
        return $this->hasMany(Service::class, 'workflow_template_id');
    }

    public function scopeActive($q)
    {
        return $q->where('is_active', true);
    }

    // Helper: Get all status codes in order
    public function getStatusCodesInOrder()
    {
        return $this->steps()->pluck('status_code')->toArray();
    }

    // Helper: Get next status
    public function getNextStatus(string $currentStatusCode): ?string
    {
        $statuses = $this->getStatusCodesInOrder();
        $currentIndex = array_search($currentStatusCode, $statuses);

        if ($currentIndex === false || $currentIndex >= count($statuses) - 1) {
            return null;
        }

        return $statuses[$currentIndex + 1];
    }

    // Helper: Get previous status
    public function getPreviousStatus(string $currentStatusCode): ?string
    {
        $statuses = $this->getStatusCodesInOrder();
        $currentIndex = array_search($currentStatusCode, $statuses);

        if ($currentIndex === false || $currentIndex <= 0) {
            return null;
        }

        return $statuses[$currentIndex - 1];
    }
}
