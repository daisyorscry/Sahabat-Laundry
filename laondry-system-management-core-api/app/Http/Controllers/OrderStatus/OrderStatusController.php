<?php

namespace App\Http\Controllers\OrderStatus;

use App\Http\Controllers\Controller;
use App\Http\Requests\OrderStatus\StoreOrderStatusRequest;
use App\Http\Requests\OrderStatus\UpdateOrderStatusRequest;
use App\Models\OrderService\OrderStatus;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class OrderStatusController extends Controller
{
    use ApiResponse;

    // GET /admin/order-statuses
    public function index(Request $request)
    {
        try {
            $q = trim((string) $request->query('q', ''));
            $sort = $request->query('sort', 'code');
            $order = strtolower($request->query('order', 'asc')) === 'desc' ? 'desc' : 'asc';
            $per = (int) $request->query('per_page', 50);
            $per = max(1, min($per, 200));

            $sortable = ['code', 'name', 'is_final', 'created_at', 'updated_at'];
            if (!in_array($sort, $sortable, true))
                $sort = 'code';

            $paginator = OrderStatus::query()
                ->when($q !== '', function (Builder $w) use ($q) {
                    $w->where('code', 'ilike', "%{$q}%")
                        ->orWhere('name', 'ilike', "%{$q}%");
                })
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
                'query' => compact('q', 'sort', 'order'),
            ];

            return $this->successResponse($data);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil order statuses', 500, ['exception' => $e->getMessage()]);
        }
    }

    // POST /admin/order-statuses
    public function store(StoreOrderStatusRequest $request)
    {
        try {
            $status = DB::transaction(function () use ($request) {
                $p = $request->validated();
                // normalisasi code ke UPPERCASE
                $p['code'] = strtoupper($p['code']);
                $m = new OrderStatus($p);
                $m->save();
                return $m->fresh();
            });

            return $this->successResponse($status, 'Status dibuat');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal membuat status', 422, ['exception' => $e->getMessage()]);
        }
    }

    // GET /admin/order-statuses/{code}
    public function show(string $code)
    {
        try {
            $status = OrderStatus::where('code', strtoupper($code))->firstOrFail();
            return $this->successResponse($status);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil status', 404, ['exception' => $e->getMessage()]);
        }
    }

    // PUT/PATCH /admin/order-statuses/{code}
    public function update(UpdateOrderStatusRequest $request, string $code)
    {
        try {
            $updated = DB::transaction(function () use ($request, $code) {
                $m = OrderStatus::lockForUpdate()->where('code', strtoupper($code))->firstOrFail();
                $m->fill($request->validated());
                $m->save();
                return $m->fresh();
            });

            return $this->successResponse($updated, 'Status diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memperbarui status', 422, ['exception' => $e->getMessage()]);
        }
    }

    // DELETE /admin/order-statuses/{code}
    public function destroy(string $code)
    {
        try {
            $code = strtoupper($code);

            // Cek referensi sebelum delete (hindari FK error)
            $inOrders = DB::table('orders')->where('status', $code)->exists();
            $inLogs = DB::table('order_status_logs')
                ->where('from_status', $code)
                ->orWhere('to_status', $code)
                ->exists();

            if ($inOrders || $inLogs) {
                return $this->errorResponse('Status dipakai oleh data lain dan tidak bisa dihapus', 409, [
                    'in_orders' => $inOrders,
                    'in_logs' => $inLogs,
                ]);
            }

            DB::transaction(function () use ($code) {
                OrderStatus::where('code', $code)->firstOrFail()->delete();
            });

            return $this->successResponse(['code' => $code], 'Status dihapus');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menghapus status', 422, ['exception' => $e->getMessage()]);
        }
    }
}
