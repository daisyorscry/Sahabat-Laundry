<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Mobile\Quote\QuoteRequest;
use App\Models\OrderService\{Service, Addon, ServicePrice};
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Throwable;

class QuoteController extends Controller
{
    use ApiResponse;

    // POST /mobile/quote
    public function quote(QuoteRequest $request)
    {
        try {
            $p = $request->validated();
            $outletId = $p['outlet_id'];
            $tier = $p['member_tier'] ?? null;
            $date = isset($p['date']) && $p['date'] ? Carbon::parse($p['date'])->toDateString() : Carbon::now()->toDateString();

            $serviceIds = collect($p['items'])->pluck('service_id')->unique()->all();
            $services = Service::whereIn('id', $serviceIds)->get(['id', 'code', 'name', 'pricing_model', 'base_price', 'is_express_available'])->keyBy('id');

            $addonIds = collect($p['items'])->flatMap(fn($r) => collect($r['addons'] ?? [])->pluck('addon_id'))->unique()->all();
            $addons = $addonIds ? Addon::whereIn('id', $addonIds)->get(['id', 'code', 'name', 'price'])->keyBy('id') : collect();

            $lines = [];
            $warnings = [];
            foreach ($p['items'] as $idx => $row) {
                $svc = $services->get($row['service_id']);
                if (!$svc) {
                    $warnings[] = "Service baris " . ($idx + 1) . " tidak ditemukan";
                    continue;
                }

                $expressReq = (bool) ($row['is_express'] ?? false);
                $useExpress = $expressReq && $svc->is_express_available;
                if ($expressReq && !$svc->is_express_available) {
                    $warnings[] = "Express diminta untuk {$svc->code} tapi tidak tersedia; dipakai non-express.";
                }

                [$unitPrice, $source] = $this->resolveUnitPrice($svc->id, $outletId, $date, $tier, $useExpress, (float) $svc->base_price);

                $qtyOrWeight = $svc->pricing_model === 'weight' ? (float) ($row['weight_kg'] ?? 0) : (int) ($row['qty'] ?? 0);
                $baseTotal = round($unitPrice * $qtyOrWeight, 2);

                $addonLines = [];
                $addonsTotal = 0.0;
                foreach (($row['addons'] ?? []) as $ax) {
                    $a = $addons->get($ax['addon_id'] ?? null);
                    if (!$a)
                        continue;
                    $aqty = (int) ($ax['qty'] ?? 1);
                    $aprice = (float) $a->price;
                    $aline = round($aprice * $aqty, 2);
                    $addonsTotal += $aline;
                    $addonLines[] = [
                        'addon_id' => $a->id,
                        'addon_code' => $a->code,
                        'addon_name' => $a->name,
                        'qty' => $aqty,
                        'unit_price' => $aprice,
                        'line_total' => $aline
                    ];
                }

                $lines[] = [
                    'service_id' => $svc->id,
                    'service_code' => $svc->code,
                    'service_name' => $svc->name,
                    'pricing_model' => $svc->pricing_model,
                    'is_express' => $useExpress,
                    'member_tier' => $tier,
                    'date' => $date,
                    'qty' => $svc->pricing_model === 'piece' ? $qtyOrWeight : null,
                    'weight_kg' => $svc->pricing_model === 'weight' ? $qtyOrWeight : null,
                    'unit_price' => $unitPrice,
                    'price_source' => $source,
                    'base_total' => $baseTotal,
                    'addons' => $addonLines,
                    'addons_total' => round($addonsTotal, 2),
                    'line_total' => round($baseTotal + $addonsTotal, 2),
                ];
            }

            $subtotal = round(collect($lines)->sum('line_total'), 2);

            return $this->successResponse([
                'meta' => ['outlet_id' => $outletId, 'member_tier' => $tier, 'date' => $date, 'warnings' => $warnings],
                'items' => $lines,
                'subtotal' => $subtotal,
                'grand_total' => $subtotal,
            ], 'Quote dihitung');
        } catch (Throwable $e) {
            return $this->errorResponse($e->getMessage(), 422, ['exception' => $e->getMessage()]);
        }
    }

    private function resolveUnitPrice(string $serviceId, string $outletId, string $date, ?string $tier, bool $express, float $fallback): array
    {
        $q = ServicePrice::query()
            ->where('service_id', $serviceId)->where('outlet_id', $outletId)->where('is_express', $express)
            ->whereDate('effective_start', '<=', $date)
            ->where(function (Builder $w) use ($date) {
                $w->whereNull('effective_end')->orWhereDate('effective_end', '>=', $date);
            });

        $row = $tier
            ? (clone $q)->where(function (Builder $w) use ($tier) {
                $w->where('member_tier', $tier)->orWhereNull('member_tier');
            })
                ->orderByRaw("CASE WHEN member_tier = ? THEN 0 WHEN member_tier IS NULL THEN 1 ELSE 2 END", [$tier])
                ->latest('effective_start')->first()
            : (clone $q)->whereNull('member_tier')->latest('effective_start')->first();

        return $row ? [(float) $row->price, 'service_prices'] : [$fallback, 'base_price'];
    }
}
