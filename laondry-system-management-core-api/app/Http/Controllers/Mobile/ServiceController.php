<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Models\OrderService\{Service, Addon};
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

use Throwable;

class ServiceController extends Controller
{
    use ApiResponse;

    // GET /mobile/services
    public function index(Request $request)
    {
        try {
            $q = trim((string) $request->query('q', ''));
            $categoryId = $request->query('category_id');
            $pricing = $request->query('pricing_model'); // weight|piece
            $express = $request->has('is_express_available') ? $request->boolean('is_express_available') : null;
            $per = max(1, min((int) $request->query('per_page', 50), 100));

            // Parameters untuk service price
            $outletId = $request->query('outlet_id');
            // Ambil member tier code dari user yang sedang login
            $user = \Illuminate\Support\Facades\Auth::user();

            // Load memberTier relation if not loaded
            if ($user && !$user->relationLoaded('memberTier')) {
                $user->load('memberTier');
            }

            $memberTierCode = $user && $user->memberTier ? $user->memberTier->code : null;
            $isExpress = $request->boolean('is_express', false);

            // Debug logging
            Log::info('ServiceController::index', [
                'user_id' => $user?->id,
                'member_tier_id' => $user?->member_tier_id,
                'member_tier_code' => $memberTierCode,
                'outlet_id' => $outletId,
                'is_express' => $isExpress,
            ]);

            $p = Service::query()
                ->where('is_active', true)
                ->with(['category:id,code,name'])
                ->when($q !== '', function (Builder $w) use ($q) {
                    $w->where('name', 'ilike', "%{$q}%")
                        ->orWhere('code', 'ilike', "%{$q}%")
                        ->orWhere('description', 'ilike', "%{$q}%");
                })
                ->when($categoryId, fn($w) => $w->where('category_id', $categoryId))
                ->when(in_array($pricing, ['weight', 'piece'], true), fn($w) => $w->where('pricing_model', $pricing))
                ->when(!is_null($express), fn($w) => $w->where('is_express_available', $express))
                ->orderBy('name')
                ->paginate($per, ['id', 'code', 'name', 'description', 'pricing_model', 'is_express_available', 'icon_path', 'category_id', 'min_qty', 'est_duration_hours', 'base_price']);

            // Attach service prices if outlet_id provided
            $items = collect($p->items())->map(function ($service) use ($outletId, $memberTierCode, $isExpress) {
                $serviceData = $service->toArray();

                if ($outletId) {
                    $servicePrice = \App\Models\OrderService\ServicePrice::resolvePrice(
                        $service->id,
                        $outletId,
                        now(),
                        $memberTierCode,
                        $isExpress
                    );

                    $serviceData['service_price'] = $servicePrice ? [
                        'id' => $servicePrice->id,
                        'outlet_id' => $servicePrice->outlet_id,
                        'member_tier' => $servicePrice->member_tier,
                        'unit_price' => (float) $servicePrice->price,
                        'is_express' => $servicePrice->is_express,
                        'effective_start' => $servicePrice->effective_start?->format('Y-m-d'),
                        'effective_end' => $servicePrice->effective_end?->format('Y-m-d'),
                    ] : null;
                }

                return $serviceData;
            });

            return $this->successResponse([
                'items' => $items,
                'pagination' => [
                    'current_page' => $p->currentPage(),
                    'per_page' => $p->perPage(),
                    'total' => $p->total(),
                    'last_page' => $p->lastPage(),
                ],
                'query' => compact('q', 'categoryId', 'pricing', 'express'),
            ]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil services', 500, ['exception' => $e->getMessage()]);
        }
    }

    // GET /mobile/services/{id}?outlet_id=&is_express=
    public function show(Request $request, Service $service)
    {
        try {
            $service->load(['category:id,code,name']);
            $serviceData = $service->toArray();

            // Parameters untuk service price
            $outletId = $request->query('outlet_id');
            $isExpress = $request->boolean('is_express', false);

            // Ambil member tier code dari user yang sedang login
            $user = \Illuminate\Support\Facades\Auth::user();

            // Load memberTier relation if not loaded
            if ($user && !$user->relationLoaded('memberTier')) {
                $user->load('memberTier');
            }

            $memberTierCode = $user && $user->memberTier ? $user->memberTier->code : null;

            // Attach service price if outlet_id provided
            if ($outletId) {
                $servicePrice = \App\Models\OrderService\ServicePrice::resolvePrice(
                    $service->id,
                    $outletId,
                    now(),
                    $memberTierCode,
                    $isExpress
                );

                $serviceData['service_price'] = $servicePrice ? [
                    'id' => $servicePrice->id,
                    'outlet_id' => $servicePrice->outlet_id,
                    'member_tier' => $servicePrice->member_tier,
                    'unit_price' => (float) $servicePrice->price,
                    'is_express' => $servicePrice->is_express,
                    'effective_start' => $servicePrice->effective_start?->format('Y-m-d'),
                    'effective_end' => $servicePrice->effective_end?->format('Y-m-d'),
                ] : null;
            }

            return $this->successResponse($serviceData);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil detail service', 500, ['exception' => $e->getMessage()]);
        }
    }

    // GET /mobile/services/{id}/addons
    public function addons(Service $service)
    {
        try {
            $addons = $service->addons()
                ->where('addons.is_active', true)
                ->withPivot(['is_required'])
                ->orderBy('addons.name')
                ->get(['addons.id', 'addons.code', 'addons.name', 'addons.price']);

            $items = $addons->map(fn($a) => [
                'id' => $a->id,
                'code' => $a->code,
                'name' => $a->name,
                'price' => $a->price,
                'is_required' => (bool) $a->pivot->is_required,
            ]);

            return $this->successResponse(['service_id' => $service->id, 'items' => $items]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil addons service', 500, ['exception' => $e->getMessage()]);
        }
    }
}
