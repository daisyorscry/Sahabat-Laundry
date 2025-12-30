<?php

namespace App\Http\Controllers\ServicePrice;

use App\Http\Controllers\Controller;
use App\Http\Requests\ServicePrice\StoreServicePriceRequest;
use App\Http\Requests\ServicePrice\UpdateServicePriceRequest;
use App\Models\OrderService\ServicePrice;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class ServicePriceController extends Controller
{
    use ApiResponse;

    // GET /admin/service-prices
    public function index(Request $request)
    {
        try {
            $serviceId = $request->query('service_id');
            $outletId  = $request->query('outlet_id');

            // --- Member tier handling:
            // null/""/"null"  => no filter (GET ALL)
            // "__NULL__"      => filter IS NULL  (opsional; pakai kalau perlu)
            // lainnya         => filter = nilai spesifik
            $tierParamRaw = $request->query('member_tier'); // bisa null/""/"null"/"GOLD"/"__NULL__"
            $tierMode = 'all';
            $tierValue = null;

            if ($request->has('member_tier')) {
                $val = is_string($tierParamRaw) ? trim($tierParamRaw) : $tierParamRaw;

                if ($val === null || $val === '' || strtolower((string)$val) === 'null') {
                    // GET ALL — tidak pasang where apa pun untuk member_tier
                    $tierMode = 'all';
                } elseif ($val === '__NULL__') {
                    // filter ke NULL (opsional)
                    $tierMode = 'is_null';
                } else {
                    // filter ke nilai spesifik
                    $tierMode = 'value';
                    $tierValue = (string) $val;
                }
            }

            $isExpress = $request->has('is_express') ? $request->boolean('is_express') : null;
            $activeAt  = $request->query('active_at'); // YYYY-MM-DD atau null/''

            $sort  = $request->query('sort', 'effective_start');
            $order = strtolower($request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';
            $per   = (int) $request->query('per_page', 15);
            $per   = max(1, min($per, 100));

            $sortable = [
                'effective_start',
                'effective_end',
                'price',
                'created_at',
                'updated_at',
                'is_express',
                'member_tier'
            ];
            if (!in_array($sort, $sortable, true)) {
                $sort = 'effective_start';
            }

            $q = ServicePrice::query()
                ->with([
                    'service:id,code,name,pricing_model',
                    'outlet:id,code,name'
                ])
                ->when($serviceId, fn(Builder $qq) => $qq->where('service_id', $serviceId))
                ->when($outletId, fn(Builder $qq) => $qq->where('outlet_id', $outletId))
                ->when(!is_null($isExpress), fn(Builder $qq) => $qq->where('is_express', $isExpress))
                // member_tier filter sesuai mode
                ->when($tierMode === 'is_null', fn(Builder $qq) => $qq->whereNull('member_tier'))
                ->when($tierMode === 'value', fn(Builder $qq) => $qq->where('member_tier', $tierValue))
                // active_at window
                ->when($activeAt, function (Builder $qq) use ($activeAt) {
                    $qq->whereDate('effective_start', '<=', $activeAt)
                        ->where(function (Builder $w) use ($activeAt) {
                            $w->whereNull('effective_end')
                                ->orWhereDate('effective_end', '>=', $activeAt);
                        });
                })
                ->orderBy($sort, $order);

            $paginator = $q->paginate($per);

            $data = [
                'items' => $paginator->items(),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page'     => $paginator->perPage(),
                    'total'        => $paginator->total(),
                    'last_page'    => $paginator->lastPage(),
                ],
                'query' => [
                    'service_id'  => $serviceId,
                    'outlet_id'   => $outletId,
                    // kembalikan apa adanya dari request agar client bisa tahu apa yang dikirim
                    'member_tier' => $request->query('member_tier', null),
                    'is_express'  => $isExpress,
                    'active_at'   => $activeAt,
                    'sort'        => $sort,
                    'order'       => $order,
                ],
            ];

            return $this->successResponse($data);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil daftar service prices', 500, [
                'exception' => $e->getMessage()
            ]);
        }
    }


    // POST /admin/service-prices
    public function store(StoreServicePriceRequest $request)
    {
        try {
            $payload = $request->validated();

            // Validasi overlap
            $this->assertNoOverlap(
                $payload['service_id'],
                $payload['outlet_id'],
                $payload['member_tier'] ?? null,
                (bool) $payload['is_express'],
                $payload['effective_start'],
                $payload['effective_end'] ?? null,
                null // creating (no current id)
            );

            $price = DB::transaction(function () use ($payload) {
                $m = new ServicePrice($payload);
                $m->save();
                return $m->fresh();
            });

            return $this->successResponse($price, 'Harga dibuat');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal membuat harga', 422, ['exception' => $e->getMessage()]);
        }
    }

    // GET /admin/service-prices/{id}
    public function show(ServicePrice $price)
    {
        try {
            return $this->successResponse($price);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil harga', 500, ['exception' => $e->getMessage()]);
        }
    }

    // PUT/PATCH /admin/service-prices/{id}
    public function update(UpdateServicePriceRequest $request, ServicePrice $price)
    {
        try {
            $payload = $request->validated();

            // pakai nilai lama untuk field yang tidak dikirim (agar overlap check konsisten)
            $serviceId = $payload['service_id'] ?? $price->service_id;
            $outletId = $payload['outlet_id'] ?? $price->outlet_id;
            $tier = array_key_exists('member_tier', $payload) ? $payload['member_tier'] : $price->member_tier;
            $isExpress = array_key_exists('is_express', $payload) ? (bool) $payload['is_express'] : (bool) $price->is_express;
            $start = $payload['effective_start'] ?? $price->effective_start->toDateString();
            $end = array_key_exists('effective_end', $payload) ? $payload['effective_end'] : ($price->effective_end?->toDateString());

            // Validasi overlap
            $this->assertNoOverlap($serviceId, $outletId, $tier, $isExpress, $start, $end, $price->id);

            $updated = DB::transaction(function () use ($price, $payload) {
                $price->fill($payload);
                $price->save();
                return $price->fresh();
            });

            return $this->successResponse($updated, 'Harga diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memperbarui harga', 422, ['exception' => $e->getMessage()]);
        }
    }

    // DELETE /admin/service-prices/{id}
    public function destroy(ServicePrice $price)
    {
        try {
            DB::transaction(fn() => $price->delete());
            return $this->successResponse(['id' => $price->id], 'Harga dihapus');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menghapus harga', 422, ['exception' => $e->getMessage()]);
        }
    }

    // POST /admin/service-prices/bulk  (stub sederhana; bisa diupgrade nanti)
    public function bulk(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt'],
        ]);

        try {
            // TODO: implement real CSV parsing/validation; sementara beri 501
            return $this->errorResponse('Bulk import belum diimplementasikan', 501);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memproses bulk import', 422, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * Cek overlap periode untuk kombinasi (service, outlet, tier, express).
     * Overlap jika: existing_start <= new_end AND new_start <= existing_end
     * Dengan NULL end = infinity.
     */
    private function assertNoOverlap(
        string $serviceId,
        string $outletId,
        ?string $memberTier,
        bool $isExpress,
        string $startDate,          // 'YYYY-MM-DD'
        ?string $endDate,           // nullable
        ?string $ignoreId           // id yang sedang di-update (abaikan diri sendiri)
    ): void {
        $newStart = $startDate;
        $newEndInf = $endDate ?? 'infinity';   // Postgres: date 'infinity'

        $exists = ServicePrice::query()
            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->where('service_id', $serviceId)
            ->where('outlet_id', $outletId)
            // NULL-safe equality untuk member_tier
            ->whereRaw('member_tier IS NOT DISTINCT FROM ?', [$memberTier])
            ->where('is_express', $isExpress)
            ->where(function (Builder $w) use ($newStart, $newEndInf) {
                // effective_start <= new_end AND new_start <= COALESCE(effective_end, 'infinity')
                $w->whereRaw('effective_start <= ?', [$newEndInf])
                    ->whereRaw('? <= COALESCE(effective_end, date \'infinity\')', [$newStart]);
            })
            ->exists();

        if ($exists) {
            abort(response()->json([
                'status' => 'error',
                'message' => 'Periode harga overlap untuk kombinasi service/outlet/tier/express',
                'errors' => ['effective_start' => ['overlap'], 'effective_end' => ['overlap']],
            ], 422));
        }
    }
}
