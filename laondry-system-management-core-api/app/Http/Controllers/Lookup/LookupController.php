<?php

namespace App\Http\Controllers\Lookup;

use App\Http\Controllers\Controller;
use App\Models\OrderService\OrderStatus;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Throwable;

class LookupController extends Controller
{
    use ApiResponse;

    // GET /lookups/order-statuses
    public function orderStatuses(Request $request)
    {
        try {
            $items = OrderStatus::query()
                ->orderBy('code')
                ->get(['code', 'name', 'is_final']);

            return $this->successResponse(['items' => $items]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil order statuses', 500, ['exception' => $e->getMessage()]);
        }
    }

    // GET /lookups/pricing-models
    public function pricingModels()
    {
        try {
            return $this->successResponse(['items' => ['weight', 'piece']]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil pricing models', 500, ['exception' => $e->getMessage()]);
        }
    }

    // GET /lookups/member-tiers
    public function memberTiers()
    {
        try {
            $tiers = config('membership.tiers');

            if (!is_array($tiers) || empty($tiers)) {
                $tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
            }

            return $this->successResponse(['items' => array_values($tiers)]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil member tiers', 500, ['exception' => $e->getMessage()]);
        }
    }
}
