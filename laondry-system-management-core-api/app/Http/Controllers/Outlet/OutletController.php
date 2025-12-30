<?php

namespace App\Http\Controllers\Outlet;

use App\Http\Controllers\Controller;
use App\Http\Requests\Outlet\StoreOutletRequest;
use App\Http\Requests\Outlet\UpdateOutletRequest;
use App\Models\OrderService\Outlet;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class OutletController extends Controller
{
    use ApiResponse;

    // GET /admin/outlets
    public function index(Request $request)
    {
        try {
            $q = trim((string) $request->query('q', ''));
            $isActive = $request->has('is_active') ? $request->boolean('is_active') : null;
            $sort = $request->query('sort', 'created_at');
            $order = strtolower($request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';
            $perPage = (int) $request->query('per_page', 15);
            $perPage = max(1, min($perPage, 100));

            $sortable = ['created_at', 'updated_at', 'code', 'name', 'is_active'];
            if (!in_array($sort, $sortable, true)) {
                $sort = 'created_at';
            }

            $paginator = Outlet::query()
                ->when($q !== '', function (Builder $query) use ($q) {
                    $query->where(function (Builder $w) use ($q) {
                        // ilike → Postgres case-insensitive
                        $w->where('name', 'ilike', "%{$q}%")
                            ->orWhere('code', 'ilike', "%{$q}%")
                            ->orWhere('phone', 'ilike', "%{$q}%")
                            ->orWhere('email', 'ilike', "%{$q}%");
                    });
                })
                ->when(!is_null($isActive), fn($qq) => $qq->where('is_active', $isActive))
                ->orderBy($sort, $order)
                ->paginate($perPage);

            $data = [
                'items' => $paginator->items(),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                ],
                'query' => [
                    'q' => $q,
                    'is_active' => $isActive,
                    'sort' => $sort,
                    'order' => $order,
                ],
            ];

            return $this->successResponse($data);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil daftar outlet', 500, ['exception' => $e->getMessage()]);
        }
    }

    // POST /admin/outlets
    public function store(StoreOutletRequest $request)
    {
        try {
            $userId = (string) optional($request->user())->id;

            $outlet = DB::transaction(function () use ($request, $userId) {
                $payload = $request->validated();

                $model = new Outlet($payload);
                $model->created_by = $userId ?: $model->created_by;
                $model->updated_by = $userId ?: $model->updated_by;
                $model->save();

                return $model->fresh();
            });

            return $this->successResponse($outlet, 'Outlet dibuat');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal membuat outlet', 422, ['exception' => $e->getMessage()]);
        }
    }

    // GET /admin/outlets/{id}
    public function show(Outlet $outlet)
    {
        try {
            return $this->successResponse($outlet);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil outlet', 500, ['exception' => $e->getMessage()]);
        }
    }

    // PUT/PATCH /admin/outlets/{id}
    public function update(UpdateOutletRequest $request, Outlet $outlet)
    {
        try {
            $userId = (string) optional($request->user())->id;

            $outlet = DB::transaction(function () use ($request, $outlet, $userId) {
                $payload = $request->validated();
                $outlet->fill($payload);
                if ($userId) {
                    $outlet->updated_by = $userId;
                }
                $outlet->save();

                return $outlet->fresh();
            });

            return $this->successResponse($outlet, 'Outlet diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memperbarui outlet', 422, ['exception' => $e->getMessage()]);
        }
    }

    // DELETE /admin/outlets/{id}
    public function destroy(Request $request, Outlet $outlet)
    {
        try {
            DB::transaction(function () use ($outlet, $request) {
                // opsional: set updated_by sebelum soft delete
                if ($request->user()) {
                    $outlet->updated_by = (string) $request->user()->id;
                    $outlet->save();
                }
                $outlet->delete(); // soft delete
            });

            return $this->successResponse(['id' => $outlet->id], 'Outlet dihapus');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menghapus outlet', 422, ['exception' => $e->getMessage()]);
        }
    }

    // PATCH /admin/outlets/{id}/activate
    public function activate(Request $request, Outlet $outlet)
    {
        $request->validate(['is_active' => ['required', 'boolean']]);

        try {
            $userId = (string) optional($request->user())->id;

            $outlet = DB::transaction(function () use ($request, $outlet, $userId) {
                $outlet->is_active = $request->boolean('is_active');
                if ($userId) {
                    $outlet->updated_by = $userId;
                }
                $outlet->save();

                return $outlet->fresh();
            });

            return $this->successResponse($outlet, 'Status outlet diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengubah status outlet', 422, ['exception' => $e->getMessage()]);
        }
    }
}
