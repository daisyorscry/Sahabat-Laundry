<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Models\OrderService\Outlet;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Throwable;

class OutletController extends Controller
{
    use ApiResponse;

    // GET /mobile/outlets?q=
    public function index(Request $request)
    {
        try {
            $q = trim((string) $request->query('q', ''));
            $per = max(1, min((int) $request->query('per_page', 50), 100));

            $p = Outlet::query()
                ->where('is_active', true)
                ->when($q !== '', function (Builder $w) use ($q) {
                    $w->where('name', 'ilike', "%{$q}%")
                        ->orWhere('code', 'ilike', "%{$q}%")
                        ->orWhere('city', 'ilike', "%{$q}%");
                })
                ->orderBy('name')
                ->paginate($per);

            return $this->successResponse([
                'items' => $p->items(),
                'pagination' => [
                    'current_page' => $p->currentPage(),
                    'per_page' => $p->perPage(),
                    'total' => $p->total(),
                    'last_page' => $p->lastPage(),
                ],
                'query' => ['q' => $q],
            ]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil outlet', 500, ['exception' => $e->getMessage()]);
        }
    }
}
