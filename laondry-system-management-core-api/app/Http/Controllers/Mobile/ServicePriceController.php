<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Models\OrderService\{Service, ServicePrice};
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

class ServicePriceController extends Controller
{
    use ApiResponse;

    // GET /mobile/service-prices?service_id=&outlet_id=&member_tier=&is_express=&active_at=
    public function effective(Request $request)
    {
        $request->validate([
            'service_id' => ['required', 'uuid', Rule::exists('services', 'id')->whereNull('deleted_at')],
            'outlet_id' => ['required', 'uuid', Rule::exists('outlets', 'id')->whereNull('deleted_at')],
            'member_tier' => ['nullable', 'string', 'max:50'],
            'is_express' => ['required', 'boolean'],
            'active_at' => ['nullable', 'date'],
        ]);

        try {
            $sid = $request->query('service_id');
            $oid = $request->query('outlet_id');
            $tier = $request->query('member_tier');
            $exp = $request->boolean('is_express');
            $date = $request->query('active_at') ? Carbon::parse($request->query('active_at'))->toDateString() : Carbon::now()->toDateString();

            $service = Service::findOrFail($sid);

            $q = ServicePrice::query()
                ->where('service_id', $sid)->where('outlet_id', $oid)->where('is_express', $exp)
                ->whereDate('effective_start', '<=', $date)
                ->where(function (Builder $w) use ($date) {
                    $w->whereNull('effective_end')->orWhereDate('effective_end', '>=', $date);
                });

            $row = $tier
                ? (clone $q)->where(function (Builder $w) use ($tier) {
                    $w->where('member_tier', $tier)->orWhereNull('member_tier');
                })
                    ->orderByRaw("CASE WHEN member_tier = ? THEN 0 ELSE 1 END", [$tier])
                    ->latest('effective_start')->first()
                : (clone $q)->whereNull('member_tier')->latest('effective_start')->first();

            if ($row) {
                return $this->successResponse([
                    'service_id' => $sid,
                    'outlet_id' => $oid,
                    'member_tier' => $row->member_tier,
                    'is_express' => $row->is_express,
                    'unit_price' => (float) $row->price,
                    'source' => 'service_prices',
                    'effective_start' => $row->effective_start?->toDateString(),
                    'effective_end' => $row->effective_end?->toDateString(),
                    'active_at' => $date,
                ]);
            }

            return $this->successResponse([
                'service_id' => $sid,
                'outlet_id' => $oid,
                'member_tier' => null,
                'is_express' => $exp,
                'unit_price' => (float) $service->base_price,
                'source' => 'base_price',
                'effective_start' => null,
                'effective_end' => null,
                'active_at' => $date,
            ]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil harga efektif', 422, ['exception' => $e->getMessage()]);
        }
    }
}
