<?php

namespace App\Http\Controllers\ServiceCategory;

use App\Http\Controllers\Controller;
use App\Http\Requests\ServiceCategory\StoreServiceCategoryRequest;
use App\Http\Requests\ServiceCategory\UpdateServiceCategoryRequest;
use App\Models\OrderService\ServiceCategory;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class ServiceCategoryController extends Controller
{
    use ApiResponse;

    // GET /admin/service-categories
    public function index(Request $request)
    {
        try {
            $q = trim((string) $request->query('q', ''));
            $isActive = $request->has('is_active') ? $request->boolean('is_active') : null;
            $sort = $request->query('sort', 'created_at');
            $order = strtolower($request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';
            $perPage = (int) $request->query('per_page', 15);
            $perPage = max(1, min($perPage, 100));

            $sortable = ['created_at', 'updated_at', 'code', 'name', 'is_active', 'services_count'];
            if (!in_array($sort, $sortable, true)) {
                $sort = 'created_at';
            }
            $paginator = ServiceCategory::query()
                ->when($q !== '', function (Builder $query) use ($q) {
                    $query->where(function (Builder $w) use ($q) {
                        $w->where('name', 'ilike', "%{$q}%")
                            ->orWhere('code', 'ilike', "%{$q}%")
                            ->orWhere('description', 'ilike', "%{$q}%");
                    });
                })
                ->when(!is_null($isActive), fn($qq) => $qq->where('is_active', $isActive))
                ->withCount('services')
                ->when($sort === 'services_count', fn($qq) => $qq->orderBy('services_count', $order), function ($qq) use ($sort, $order) {
                    $qq->orderBy($sort, $order);
                })
                ->paginate($perPage);


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
            return $this->errorResponse('Gagal mengambil daftar kategori', 500, ['exception' => $e->getMessage()]);
        }
    }

    // POST /admin/service-categories
    public function store(StoreServiceCategoryRequest $request)
    {
        try {
            $category = DB::transaction(function () use ($request) {
                $payload = $request->validated();
                $m = new ServiceCategory($payload);
                $m->save();
                return $m->fresh();
            });

            return $this->successResponse($category, 'Kategori dibuat');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal membuat kategori', 422, ['exception' => $e->getMessage()]);
        }
    }

    // GET /admin/service-categories/{id}
    public function show(ServiceCategory $category)
    {
        try {
            return $this->successResponse($category);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil kategori', 500, ['exception' => $e->getMessage()]);
        }
    }

    // PUT/PATCH /admin/service-categories/{id}
    public function update(UpdateServiceCategoryRequest $request, ServiceCategory $category)
    {
        try {
            $userId = (string) optional($request->user())->id;

            $category = DB::transaction(function () use ($request, $category, $userId) {
                $payload = $request->validated();
                $category->fill($payload);
                if ($userId) {
                    $category->updated_by = $userId;
                }
                $category->save();

                return $category->fresh();
            });

            return $this->successResponse($category, 'Kategori diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memperbarui kategori', 422, ['exception' => $e->getMessage()]);
        }
    }

    // DELETE /admin/service-categories/{id}
    public function destroy(Request $request, ServiceCategory $category)
    {
        try {
            $hasServices = $category->services()->exists();
            if ($hasServices) {
                return $this->errorResponse('Kategori masih memiliki service. Nonaktifkan saja atau pindahkan service terlebih dahulu.', 409);
            }

            DB::transaction(function () use ($request, $category) {
                if ($request->user()) {
                    $category->updated_by = (string) $request->user()->id;
                    $category->save();
                }
                $category->delete();
            });

            return $this->successResponse(['id' => $category->id], 'Kategori dihapus');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menghapus kategori', 422, ['exception' => $e->getMessage()]);
        }
    }


    // PATCH /admin/service-categories/{id}/activate
    public function activate(Request $request, ServiceCategory $category)
    {
        $request->validate(['is_active' => ['required', 'boolean']]);

        try {
            $userId = (string) optional($request->user())->id;

            $category = DB::transaction(function () use ($request, $category, $userId) {
                $category->is_active = $request->boolean('is_active');
                if ($userId) {
                    $category->updated_by = $userId;
                }
                $category->save();

                return $category->fresh();
            });

            return $this->successResponse($category, 'Status kategori diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengubah status kategori', 422, ['exception' => $e->getMessage()]);
        }
    }
}
