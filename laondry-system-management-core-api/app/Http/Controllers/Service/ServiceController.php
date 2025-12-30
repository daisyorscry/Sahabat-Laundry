<?php

namespace App\Http\Controllers\Service;

use App\Http\Controllers\Controller;
use App\Http\Requests\Service\StoreServiceRequest;
use App\Http\Requests\Service\UpdateServiceRequest;
use App\Models\OrderService\Service as ServiceModel;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Helpers\ImageStorage;

class ServiceController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        try {
            $q          = trim((string) $request->query('q', ''));
            $categoryId = $request->query('category_id');
            $pricing    = $request->query('pricing_model'); // weight|piece
            $isActive   = $request->has('is_active') ? $request->boolean('is_active') : null;
            $isExpress  = $request->has('is_express_available') ? $request->boolean('is_express_available') : null;

            $outletId = $request->query('outlet_id');
            $date     = $request->query('date') ? Carbon::parse($request->query('date'))->toDateString() : now()->toDateString();
            $tier     = $request->query('tier'); // nullable
            $express  = (bool) $request->boolean('express', false);

            $sort = $request->query('sort', 'created_at');
            $order = strtolower($request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';
            $per = (int) $request->query('per_page', 15);
            $per = max(1, min($per, 100));

            $sortable = ['created_at', 'updated_at', 'code', 'name', 'pricing_model', 'is_active', 'is_express_available'];
            if (!in_array($sort, $sortable, true)) {
                $sort = 'created_at';
            }

            $base = ServiceModel::query()
                ->when($q !== '', function (Builder $query) use ($q) {
                    $query->where(function (Builder $w) use ($q) {
                        $w->where('name', 'ilike', "%{$q}%")
                            ->orWhere('code', 'ilike', "%{$q}%")
                            ->orWhere('description', 'ilike', "%{$q}%");
                    });
                })
                ->when($categoryId, fn($qq) => $qq->where('category_id', $categoryId))
                ->when(in_array($pricing, ['weight', 'piece'], true), fn($qq) => $qq->where('pricing_model', $pricing))
                ->when(!is_null($isActive), fn($qq) => $qq->where('is_active', $isActive))
                ->when(!is_null($isExpress), fn($qq) => $qq->where('is_express_available', $isExpress))
                ->with([
                    'category',
                    'creator' => fn($q) => $q->select('id')->addSelect(DB::raw('"full_name" as "name"'))->addSelect('email'),
                    'updater' => fn($q) => $q->select('id')->addSelect(DB::raw('"full_name" as "name"'))->addSelect('email'),
                    'addons'  => fn($q) => $q->withPivot(['is_required']),
                ])
                ->withCount('orderItems');

            if ($outletId) {
                $base->with(['prices' => function ($q) use ($outletId, $date, $tier, $express) {
                    $q->where('outlet_id', $outletId)
                        ->where('effective_start', '<=', $date)
                        ->where(function ($w) use ($date) {
                            $w->whereNull('effective_end')->orWhere('effective_end', '>=', $date);
                        })
                        ->where('is_express', $express)
                        ->where(function ($w) use ($tier) {
                            if ($tier) {
                                $w->where('member_tier', $tier)->orWhereNull('member_tier');
                            } else {
                                $w->whereNull('member_tier');
                            }
                        })
                        ->orderByRaw('CASE WHEN member_tier IS NULL THEN 1 ELSE 0 END ASC')
                        ->orderByDesc('effective_start');
                }]);
            }

            $paginator = $base->orderBy($sort, $order)->paginate($per);

            $items = collect($paginator->items())->map(function (ServiceModel $m) use ($outletId) {
                $arr = $m->toArray();

                if (isset($arr['creator']) && is_array($arr['creator'])) {
                    // sudah ada 'name' hasil alias; biarkan
                }
                if (isset($arr['updater']) && is_array($arr['updater'])) {
                    // sudah ada 'name' hasil alias; biarkan
                }

                if ($outletId && $m->relationLoaded('prices')) {
                    $price = optional($m->prices->first());
                    $arr['resolved_price'] = $price ? [
                        'id'              => $price->id,
                        'price'           => $price->price,
                        'member_tier'     => $price->member_tier,
                        'effective_start' => $price->effective_start?->toDateString(),
                        'effective_end'   => $price->effective_end?->toDateString(),
                        'is_express'      => (bool) $price->is_express,
                    ] : null;
                }

                unset($arr['prices']);
                return $arr;
            })->values();


            $data = [
                'items' => $items,
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                ],
                'query' => [
                    'q' => $q,
                    'category_id' => $categoryId,
                    'pricing_model' => $pricing,
                    'is_active' => $isActive,
                    'is_express_available' => $isExpress,
                    'sort' => $sort,
                    'order' => $order,
                    // harga
                    'outlet_id' => $outletId,
                    'date' => $date,
                    'tier' => $tier,
                    'express' => $express,
                ],
            ];

            return $this->successResponse($data);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil daftar service', 500, ['exception' => $e->getMessage()]);
        }
    }

    // GET /admin/services/{id}
    public function show(Request $request, ServiceModel $service)
    {
        try {
            // Resolver harga opsional
            $outletId = $request->query('outlet_id');
            $date     = $request->query('date') ? Carbon::parse($request->query('date'))->toDateString() : now()->toDateString();
            $tier     = $request->query('tier');
            $express  = (bool) $request->boolean('express', false);

            $service->load([
                'category',
                'creator:id,name,email',
                'updater:id,name,email',
                'addons' => fn($q) => $q->withPivot(['is_required']),
            ])->loadCount('orderItems');

            $resolved = null;
            if ($outletId) {
                // pakai query subset agar tidak tarik semua
                $resolved = $service->prices()
                    ->where('outlet_id', $outletId)
                    ->where('effective_start', '<=', $date)
                    ->where(function ($w) use ($date) {
                        $w->whereNull('effective_end')->orWhere('effective_end', '>=', $date);
                    })
                    ->where('is_express', $express)
                    ->where(function ($w) use ($tier) {
                        if ($tier) {
                            $w->where('member_tier', $tier)->orWhereNull('member_tier');
                        } else {
                            $w->whereNull('member_tier');
                        }
                    })
                    ->orderByRaw('CASE WHEN member_tier IS NULL THEN 1 ELSE 0 END')
                    ->latest('effective_start')
                    ->first();
            }

            $payload = $service->toArray();
            $payload['resolved_price'] = $resolved ? [
                'id' => $resolved->id,
                'price' => $resolved->price,
                'member_tier' => $resolved->member_tier,
                'effective_start' => $resolved->effective_start?->toDateString(),
                'effective_end' => $resolved->effective_end?->toDateString(),
                'is_express' => (bool) $resolved->is_express,
            ] : null;

            return $this->successResponse($payload);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil service', 500, ['exception' => $e->getMessage()]);
        }
    }
    public function store(StoreServiceRequest $request)
    {
        try {
            $userId = (string) optional($request->user())->id;
            if (!$userId) {
                $userId = (string) config('app.system_user_id');
            }

            $service = DB::transaction(function () use ($request, $userId) {
                $payload = $request->validated();

                $payload['base_price']           = $this->toDecimal($payload['base_price'] ?? 0);
                $payload['min_qty']              = $this->toDecimal($payload['min_qty'] ?? 0);
                $payload['est_duration_hours']   = $this->toInt($payload['est_duration_hours'] ?? 24);
                $payload['is_express_available'] = (bool) ($payload['is_express_available'] ?? false);
                $payload['is_active']            = (bool) ($payload['is_active'] ?? true);

                $m = new ServiceModel();
                $m->fill([
                    'category_id'          => $payload['category_id'],
                    'code'                 => $payload['code'],
                    'name'                 => $payload['name'],
                    'description'          => $payload['description'] ?? null,
                    'pricing_model'        => $payload['pricing_model'],
                    'base_price'           => $payload['base_price'],
                    'min_qty'              => $payload['min_qty'],
                    'est_duration_hours'   => $payload['est_duration_hours'],
                    'is_express_available' => $payload['is_express_available'],
                    'is_active'            => $payload['is_active'],
                ]);
                $m->created_by = $userId;
                $m->updated_by = $userId;

                if (!empty($payload['icon_path'])) {
                    $relative = ImageStorage::saveJsonToPublic($payload['icon_path'], 'addons', $payload['name'] ?? null);
                    $payload['icon_path'] = $relative;
                }

                $m->save();

                if (!empty($payload['addons'])) {
                    $unique = collect($payload['addons'])
                        ->unique(fn($a) => $a['addon_id'])
                        ->values();

                    foreach ($unique as $row) {
                        DB::table('service_addons')->insert([
                            'id'          => (string) Str::uuid(),
                            'service_id'  => $m->id,
                            'addon_id'    => $row['addon_id'],
                            'is_required' => (bool) ($row['is_required'] ?? false),
                            'created_at'  => now(),
                            'updated_at'  => now(),
                        ]);
                    }
                }

                if (!empty($payload['prices'])) {
                    foreach ($payload['prices'] as $p) {
                        // normalisasi price
                        $price = $this->toDecimal($p['price']);

                        DB::table('service_prices')->insert([
                            'id'              => (string) Str::uuid(),
                            'service_id'      => $m->id,
                            'outlet_id'       => $p['outlet_id'],
                            'member_tier'     => $p['member_tier'] ?? null,
                            'price'           => $price,
                            'effective_start' => Carbon::parse($p['effective_start'])->toDateString(),
                            'effective_end'   => isset($p['effective_end']) ? Carbon::parse($p['effective_end'])->toDateString() : null,
                            'is_express'      => (bool) ($p['is_express'] ?? false),
                            'created_at'      => now(),
                            'updated_at'      => now(),
                        ]);
                    }
                }

                return $m->fresh([
                    'category',
                    'creator' => fn($q) => $q->select('id')->addSelect(DB::raw('"full_name" as "name"'))->addSelect('email'),
                    'updater' => fn($q) => $q->select('id')->addSelect(DB::raw('"full_name" as "name"'))->addSelect('email'),
                    'addons'  => fn($q) => $q->withPivot(['is_required']),
                ])->loadCount('orderItems');
            });

            return $this->successResponse($service, 'Service dibuat');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal membuat service', 422, ['exception' => $e->getMessage()]);
        }
    }

    public function update(UpdateServiceRequest $request, ServiceModel $service)
    {
        try {
            $userId = (string) optional($request->user())->id;
            if (!$userId) {
                throw ValidationException::withMessages(['auth' => 'Unauthorized']);
            }

            $service = DB::transaction(function () use ($request, $service, $userId) {
                $payload = $request->validated();

                // --- Normalisasi nilai numerik/boolean hanya jika ada di payload
                if (array_key_exists('base_price', $payload)) {
                    $payload['base_price'] = $this->toDecimal($payload['base_price']);
                }
                if (array_key_exists('min_qty', $payload)) {
                    $payload['min_qty'] = $this->toDecimal($payload['min_qty']);
                }
                if (array_key_exists('est_duration_hours', $payload)) {
                    $payload['est_duration_hours'] = $this->toInt($payload['est_duration_hours']);
                }
                if (array_key_exists('is_express_available', $payload)) {
                    $payload['is_express_available'] = (bool) $payload['is_express_available'];
                }
                if (array_key_exists('is_active', $payload)) {
                    $payload['is_active'] = (bool) $payload['is_active'];
                }

                $service->fill(Arr::only($payload, [
                    'category_id',
                    'code',
                    'name',
                    'description',
                    'pricing_model',
                    'base_price',
                    'min_qty',
                    'est_duration_hours',
                    'is_express_available',
                    'is_active',
                ]));

                if (!empty($payload['icon_path'])) {
                    $relative = ImageStorage::saveJsonToPublic($payload['icon_path'], 'addons', $payload['name'] ?? null);
                    $payload['icon_path'] = $relative;
                }

                $service->updated_by = $userId;
                $service->save();

                if (array_key_exists('addons', $payload)) {
                    $rows = collect($payload['addons'] ?? [])
                        ->filter(fn($r) => !empty($r['addon_id']))
                        ->unique(fn($r) => $r['addon_id'])
                        ->mapWithKeys(function ($r) {
                            return [
                                $r['addon_id'] => [
                                    'is_required' => (bool) ($r['is_required'] ?? false),
                                    'created_at'  => now(),
                                    'updated_at'  => now(),
                                ],
                            ];
                        })
                        ->all();

                    $service->addons()->sync($rows);
                }

                if (array_key_exists('prices', $payload)) {
                    $priceRows = [];
                    foreach ($payload['prices'] ?? [] as $p) {
                        if (empty($p['outlet_id']) || !array_key_exists('price', $p) || empty($p['effective_start'])) {
                            continue; // skip baris tidak lengkap
                        }
                        $priceRows[] = [
                            'id'              => $p['id'] ?? (string) Str::uuid(),
                            'service_id'      => $service->id,
                            'outlet_id'       => $p['outlet_id'],
                            'member_tier'     => $p['member_tier'] ?? null,
                            'price'           => $this->toDecimal($p['price']),
                            'effective_start' => Carbon::parse($p['effective_start'])->toDateString(),
                            'effective_end'   => isset($p['effective_end']) && $p['effective_end'] !== null
                                ? Carbon::parse($p['effective_end'])->toDateString()
                                : null,
                            'is_express'      => (bool) ($p['is_express'] ?? false),
                            'created_at'      => now(),
                            'updated_at'      => now(),
                        ];
                    }

                    if (!empty($priceRows)) {
                        DB::table('service_prices')->upsert(
                            $priceRows,
                            ['service_id', 'outlet_id', 'member_tier', 'is_express', 'effective_start'],
                            ['price', 'effective_end', 'updated_at'] // kolom yang di-update
                        );
                    }
                }

                if (!empty($payload['remove_price_ids']) && is_array($payload['remove_price_ids'])) {
                    DB::table('service_prices')
                        ->where('service_id', $service->id)
                        ->whereIn('id', $payload['remove_price_ids'])
                        ->delete();
                }

                return $service->fresh([
                    'category',
                    'creator' => fn($q) => $q->select('id')->addSelect(DB::raw('"full_name" as "name"'))->addSelect('email'),
                    'updater' => fn($q) => $q->select('id')->addSelect(DB::raw('"full_name" as "name"'))->addSelect('email'),
                    'addons'  => fn($q) => $q->withPivot(['is_required']),
                ])->loadCount('orderItems');
            });

            return $this->successResponse($service, 'Service diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memperbarui service', 422, ['exception' => $e->getMessage()]);
        }
    }


    public function destroy(Request $request, ServiceModel $service)
    {
        try {
            $userId = (string) optional($request->user())->id;
            if (!$userId) {
                throw ValidationException::withMessages(['auth' => 'Unauthorized']);
            }

            DB::transaction(function () use ($service, $userId) {
                $service->updated_by = $userId;
                $service->save();
                $service->delete();
            });

            return $this->successResponse(['id' => $service->id], 'Service dihapus');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menghapus service', 422, ['exception' => $e->getMessage()]);
        }
    }

    public function activate(Request $request, ServiceModel $service)
    {
        $request->validate(['is_active' => ['required', 'boolean']]);

        try {
            $userId = (string) optional($request->user())->id;
            if (!$userId) {
                throw ValidationException::withMessages(['auth' => 'Unauthorized']);
            }

            $next = (bool) $request->boolean('is_active');

            $service = DB::transaction(function () use ($service, $userId, $next) {
                if ($service->is_active !== $next) {
                    $service->is_active = $next;
                    $service->updated_by = $userId;
                    $service->save();
                }

                return $service->fresh([
                    'category',
                    'creator' => fn($q) => $q->select('id')->addSelect(DB::raw('"full_name" as "name"'))->addSelect('email'),
                    'updater' => fn($q) => $q->select('id')->addSelect(DB::raw('"full_name" as "name"'))->addSelect('email'),
                    'addons'  => fn($q) => $q->withPivot(['is_required']),
                ])->loadCount('orderItems');
            });

            return $this->successResponse($service, 'Status service diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengubah status service', 422, ['exception' => $e->getMessage()]);
        }
    }


    private function toDecimal($v): string
    {
        if ($v === '' || $v === null) {
            return '0.00';
        }
        if (is_string($v)) {
            $clean = str_replace(['.', ' '], ['', ''], $v);
            $clean = str_replace(',', '.', $clean);
            $v = is_numeric($clean) ? $clean : 0;
        }
        return number_format((float) $v, 2, '.', '');
    }

    private function toInt($v): int
    {
        if ($v === '' || $v === null) {
            return 0;
        }
        return (int) $v;
    }
}
