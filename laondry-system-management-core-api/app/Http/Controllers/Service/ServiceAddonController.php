<?php

namespace App\Http\Controllers\Service;

use App\Http\Controllers\Controller;
use App\Models\OrderService\Service;
use App\Models\OrderService\Addon;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;
use Illuminate\Support\Str;

class ServiceAddonController extends Controller
{
    use ApiResponse;

    public function index(Request $request, Service $service)
    {
        try {
            $q            = trim((string) $request->query('q', ''));
            $requiredOnly = $request->boolean('required_only', false);
            $per          = max(1, min((int) $request->query('per_page', 15), 100));

            $rel = $service->addons()
                ->when($q !== '', function (Builder $qq) use ($q) {
                    $qq->where(function ($w) use ($q) {
                        $w->where('addons.name', 'ilike', "%{$q}%")
                            ->orWhere('addons.code', 'ilike', "%{$q}%")
                            ->orWhere('addons.description', 'ilike', "%{$q}%");
                    });
                })
                // ganti wherePivot -> where ke kolom tabel pivot
                ->when($requiredOnly, fn($qq) => $qq->where('service_addons.is_required', true))
                ->orderBy('addons.name');

            $paginator = $rel->paginate($per);

            $items = collect($paginator->items())->map(function (Addon $a) {
                return [
                    'id'          => $a->id,
                    'code'        => $a->code,
                    'name'        => $a->name,
                    'description' => $a->description,
                    'is_active'   => (bool) $a->is_active,
                    'pivot'       => [
                        'is_required' => (bool) optional($a->pivot)->is_required,
                        'attached_at' => optional($a->pivot)->created_at,
                        'updated_at'  => optional($a->pivot)->updated_at,
                    ],
                ];
            });

            return $this->successResponse([
                'items' => $items,
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page'     => $paginator->perPage(),
                    'total'        => $paginator->total(),
                    'last_page'    => $paginator->lastPage(),
                ],
                'query' => ['q' => $q, 'required_only' => $requiredOnly],
            ]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil addons service', 500, ['exception' => $e->getMessage()]);
        }
    }


    public function store(Request $request, Service $service)
    {
        $data = $request->validate([
            'addon_id'    => ['required', 'uuid', 'exists:addons,id'],
            'is_required' => ['sometimes', 'boolean'],
        ]);
        $isRequired = (bool) ($data['is_required'] ?? false);

        try {
            $addon = Addon::query()->whereKey($data['addon_id'])->firstOrFail();

            // Kebijakan: hanya izinkan mapping ke addon aktif
            if (!$addon->is_active) {
                return $this->errorResponse('Addon tidak aktif', 422);
            }

            $existing = $service->serviceAddons()
                ->where('addon_id', $addon->id)
                ->first();

            if ($existing) {
                // Idempotent: tolak duplikat — tidak mengubah is_required
                return $this->successResponse([
                    'service_id' => $service->id,
                    'addon_id'   => $addon->id,
                    'is_required' => (bool) $existing->is_required,
                    'created'    => false,
                    'message'    => 'Addon sudah terpasang pada service',
                ], 'Sudah terpasang');
            }

            DB::transaction(function () use ($service, $addon, $isRequired) {
                $service->addons()->attach($addon->id, [
                    'id'          => (string) Str::uuid(),
                    'is_required' => $isRequired,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            });

            return $this->successResponse([
                'service_id' => $service->id,
                'addon_id'   => $addon->id,
                'is_required' => $isRequired,
                'created'    => true,
            ], 'Addon dipasang ke service');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memasang addon', 422, ['exception' => $e->getMessage()]);
        }
    }

    public function update(Request $request, Service $service, Addon $addon)
    {
        $data = $request->validate([
            'is_required' => ['required', 'boolean'],
        ]);

        try {
            $exists = $service->serviceAddons()
                ->where('addon_id', $addon->id)
                ->exists();

            if (!$exists) {
                return $this->errorResponse('Addon belum terpasang pada service', 404);
            }

            DB::transaction(function () use ($service, $addon, $data) {
                $service->addons()->updateExistingPivot($addon->id, [
                    'is_required' => (bool) $data['is_required'],
                    'updated_at'  => now(),
                ]);
            });

            return $this->successResponse([
                'service_id'  => $service->id,
                'addon_id'    => $addon->id,
                'is_required' => (bool) $data['is_required'],
            ], 'Pivot diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memperbarui pivot addon', 422, ['exception' => $e->getMessage()]);
        }
    }

    public function destroy(Service $service, Addon $addon)
    {
        try {
            $exists = $service->serviceAddons()
                ->where('addon_id', $addon->id)
                ->exists();

            if (!$exists) {
                // Idempotent delete: tidak error jika sudah tidak terpasang
                return $this->successResponse([
                    'service_id' => $service->id,
                    'addon_id'   => $addon->id,
                    'deleted'    => false,
                    'message'    => 'Addon tidak terpasang',
                ], 'Tidak ada perubahan');
            }

            DB::transaction(function () use ($service, $addon) {
                $service->addons()->detach($addon->id);
            });

            return $this->successResponse([
                'service_id' => $service->id,
                'addon_id'   => $addon->id,
                'deleted'    => true,
            ], 'Addon dilepas dari service');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal melepas addon', 422, ['exception' => $e->getMessage()]);
        }
    }
}
