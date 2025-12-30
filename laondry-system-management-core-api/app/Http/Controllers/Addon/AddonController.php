<?php

namespace App\Http\Controllers\Addon;

use App\Http\Controllers\Controller;
use App\Http\Requests\Addon\StoreAddonRequest;
use App\Http\Requests\Addon\UpdateAddonRequest;
use App\Models\OrderService\Addon;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;
use App\Helpers\ImageStorage;

class AddonController extends Controller
{
    use ApiResponse;

    // GET /admin/addons
    public function index(Request $request)
    {
        try {
            $q = trim((string) $request->query('q', ''));
            $isActive = $request->has('is_active') ? $request->boolean('is_active') : null;

            $sort = $request->query('sort', 'created_at');
            $order = strtolower($request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';
            $per = (int) $request->query('per_page', 15);
            $per = max(1, min($per, 100));

            $sortable = ['created_at', 'updated_at', 'code', 'name', 'price', 'is_active'];
            if (!in_array($sort, $sortable, true))
                $sort = 'created_at';

            $paginator = Addon::query()
                ->when($q !== '', function (Builder $query) use ($q) {
                    $query->where(function (Builder $w) use ($q) {
                        $w->where('name', 'ilike', "%{$q}%")
                            ->orWhere('code', 'ilike', "%{$q}%")
                            ->orWhere('description', 'ilike', "%{$q}%");
                    });
                })
                ->when(!is_null($isActive), fn($qq) => $qq->where('is_active', $isActive))
                ->orderBy($sort, $order)
                ->paginate($per);

            $data = [
                'items' => $paginator->items(),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                ],
                'query' => compact('q', 'isActive', 'sort', 'order'),
            ];

            return $this->successResponse($data);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil daftar addons', 500, ['exception' => $e->getMessage()]);
        }
    }

    // POST /admin/addons
    public function store(StoreAddonRequest $request)
    {
        try {
            $userId = (string) optional($request->user())->id;

            $addon = DB::transaction(function () use ($request, $userId) {
                $payload = $request->validated();

                $m = new Addon($payload);
                if ($userId) {
                    $m->created_by = $userId;
                    $m->updated_by = $userId;
                } else {
                    $m->created_by =  (string) config('app.system_user_id');
                    $m->updated_by =  (string) config('app.system_user_id');
                }

                if (!empty($payload['icon_path'])) {
                    $relative = ImageStorage::saveJsonToPublic($payload['icon_path'], 'addons', $payload['name'] ?? null);
                    $payload['icon_path'] = $relative;
                }

                $m->save();

                return $m->fresh();
            });

            return $this->successResponse($addon, 'Addon dibuat');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal membuat addon', 422, ['exception' => $e->getMessage()]);
        }
    }

    // GET /admin/addons/{id}
    public function show(Addon $addon)
    {
        try {
            return $this->successResponse($addon);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil addon', 500, ['exception' => $e->getMessage()]);
        }
    }

    // PUT/PATCH /admin/addons/{id}
    public function update(UpdateAddonRequest $request, Addon $addon)
    {
        try {
            $userId = (string) optional($request->user())->id;

            $addon = DB::transaction(function () use ($request, $addon, $userId) {
                $payload = $request->validated();
                $addon->fill($payload);
                if ($userId) {
                    $addon->updated_by = $userId;
                }
                if (!empty($payload['icon_path'])) {
                    $relative = ImageStorage::saveJsonToPublic($payload['icon_path'], 'addons', $payload['name'] ?? null);
                    $payload['icon_path'] = $relative;
                }

                $addon->save();

                return $addon->fresh();
            });

            return $this->successResponse($addon, 'Addon diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memperbarui addon', 422, ['exception' => $e->getMessage()]);
        }
    }

    // DELETE /admin/addons/{id}
    public function destroy(Request $request, Addon $addon)
    {
        try {
            DB::transaction(function () use ($request, $addon) {
                if ($request->user()) {
                    $addon->updated_by = (string) $request->user()->id;
                    $addon->save();
                }
                $addon->delete(); // soft delete
            });

            return $this->successResponse(['id' => $addon->id], 'Addon dihapus');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menghapus addon', 422, ['exception' => $e->getMessage()]);
        }
    }

    // PATCH /admin/addons/{id}/activate
    public function activate(Request $request, Addon $addon)
    {
        $request->validate(['is_active' => ['required', 'boolean']]);

        try {
            $userId = (string) optional($request->user())->id;

            $addon = DB::transaction(function () use ($request, $addon, $userId) {
                $addon->is_active = $request->boolean('is_active');
                if ($userId) {
                    $addon->updated_by = $userId;
                }
                $addon->save();

                return $addon->fresh();
            });

            return $this->successResponse($addon, 'Status addon diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengubah status addon', 422, ['exception' => $e->getMessage()]);
        }
    }
}
