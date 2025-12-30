<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\{
    StoreOrderRequest,
    UpdateOrderHeaderRequest,
    AddOrderItemRequest,
    UpdateOrderItemRequest,
    AddItemAddonRequest,
    UpdateItemAddonRequest,
    ChangeStatusRequest,
    OverrideTotalsRequest
};
use App\Models\OrderService\{
    Order,
    OrderItem,
    OrderItemAddon,
    Service,
    Addon,
    ServicePrice,
    OrderStatus,
    OrderStatusLog
};
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class OrderController extends Controller
{
    use ApiResponse;

    // GET /admin/orders
    public function index(Request $request)
    {
        try {
            $q = trim((string) $request->query('q', '')); // order_no
            $status = $request->query('status');
            $outletId = $request->query('outlet_id');
            $customerId = $request->query('customer_id');
            $type = $request->query('type'); // DROPOFF|PICKUP
            $dateFrom = $request->query('date_from'); // filter created_at
            $dateTo = $request->query('date_to');

            $sort = $request->query('sort', 'created_at');
            $order = strtolower($request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';
            $per = (int) $request->query('per_page', 15);
            $per = max(1, min($per, 100));

            $sortable = ['created_at', 'updated_at', 'order_no', 'status', 'promised_at', 'grand_total'];
            if (!in_array($sort, $sortable, true))
                $sort = 'created_at';

            $p = Order::query()
                ->when($q !== '', fn(Builder $qq) => $qq->where('order_no', 'ilike', "%{$q}%"))
                ->when($status, fn(Builder $qq) => $qq->where('status', strtoupper($status)))
                ->when($outletId, fn(Builder $qq) => $qq->where('outlet_id', $outletId))
                ->when($customerId, fn(Builder $qq) => $qq->where('customer_id', $customerId))
                ->when(in_array($type, ['DROPOFF', 'PICKUP'], true), fn($qq) => $qq->where('order_type', $type))
                ->when($dateFrom, fn($qq) => $qq->whereDate('created_at', '>=', $dateFrom))
                ->when($dateTo, fn($qq) => $qq->whereDate('created_at', '<=', $dateTo))
                ->orderBy($sort, $order)
                ->paginate($per);

            return $this->successResponse([
                'items' => $p->items(),
                'pagination' => [
                    'current_page' => $p->currentPage(),
                    'per_page' => $p->perPage(),
                    'total' => $p->total(),
                    'last_page' => $p->lastPage(),
                ],
                'query' => compact('q', 'status', 'outletId', 'customerId', 'type', 'dateFrom', 'dateTo', 'sort', 'order'),
            ]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil daftar order', 500, ['exception' => $e->getMessage()]);
        }
    }

    // POST /admin/orders
    public function store(StoreOrderRequest $request)
    {
        try {
            $userId = (string) optional($request->user())->id;

            $order = DB::transaction(function () use ($request, $userId) {
                $p = $request->validated();

                $order = new Order();
                $order->order_no = $this->generateOrderNo();
                $order->customer_id = $p['customer_id'];
                $order->outlet_id = $p['outlet_id'];
                $order->status = 'NEW';
                $order->order_type = $p['order_type'];
                $order->requested_pickup_at = $p['requested_pickup_at'] ?? null;
                $order->promised_at = $p['promised_at'] ?? null;
                $order->pickup_address = $p['pickup_address'] ?? null;
                $order->delivery_address = $p['delivery_address'] ?? null;
                $order->discount = (float) ($p['discount'] ?? 0);
                $order->tax = (float) ($p['tax'] ?? 0);
                $order->delivery_fee = (float) ($p['delivery_fee'] ?? 0);
                $order->notes = $p['notes'] ?? null;
                $order->created_by = $userId ?: null;
                $order->updated_by = $userId ?: null;
                $order->save();

                // items
                $now = Carbon::now();
                foreach ($p['items'] as $row) {
                    $service = Service::findOrFail($row['service_id']);

                    // resolve unit_price
                    $unitPrice = array_key_exists('unit_price', $row) ? (float) $row['unit_price'] : $this->resolveServiceUnitPrice(
                        $service->id,
                        $order->outlet_id,
                        $now->toDateString(),
                        null,
                        (bool) ($row['express'] ?? false),
                        (float) $service->base_price
                    );

                    $weight = $row['weight_kg'] ?? null;
                    $qty = $row['qty'] ?? null;

                    // validasi by pricing_model
                    if ($service->pricing_model === 'weight') {
                        if (!$weight)
                            throw new \RuntimeException("Service {$service->code} butuh weight_kg");
                        $lineTotal = round($unitPrice * (float) $weight, 2);
                    } else {
                        if (!$qty)
                            throw new \RuntimeException("Service {$service->code} butuh qty");
                        $lineTotal = round($unitPrice * (int) $qty, 2);
                    }

                    $item = new OrderItem();
                    $item->order_id = $order->id;
                    $item->service_id = $service->id;
                    $item->service_code = $service->code;
                    $item->service_name = $service->name;
                    $item->weight_kg = $service->pricing_model === 'weight' ? $weight : null;
                    $item->qty = $service->pricing_model === 'piece' ? $qty : null;
                    $item->unit_price = $unitPrice;
                    $item->line_total = $lineTotal;
                    $item->save();

                    // addons (opsional)
                    foreach (($row['addons'] ?? []) as $ax) {
                        $addon = Addon::findOrFail($ax['addon_id']);
                        $aqty = (int) ($ax['qty'] ?? 1);
                        $aprice = array_key_exists('unit_price', $ax) ? (float) $ax['unit_price'] : (float) $addon->price;

                        $ai = new OrderItemAddon();
                        $ai->order_item_id = $item->id;
                        $ai->addon_id = $addon->id;
                        $ai->addon_code = $addon->code;
                        $ai->addon_name = $addon->name;
                        $ai->qty = $aqty;
                        $ai->unit_price = $aprice;
                        $ai->line_total = round($aprice * $aqty, 2);
                        $ai->save();

                        // tambahkan ke line_total item
                        $item->line_total += $ai->line_total;
                        $item->save();
                    }
                }

                // hitung total
                $this->recalcTotals($order->refresh());

                // log status NEW
                $this->writeStatusLog($order, null, 'NEW', $userId, 'Order dibuat');

                return $order->fresh(['items.addons']);
            });

            return $this->successResponse($order, 'Order dibuat');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal membuat order', 422, ['exception' => $e->getMessage()]);
        }
    }

    // GET /admin/orders/{id}
    public function show(Order $order)
    {
        try {
            $order->load(['items.addons', 'outlet', 'customer', 'logs' => fn($q) => $q->orderByDesc('changed_at')]);
            return $this->successResponse($order);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil order', 500, ['exception' => $e->getMessage()]);
        }
    }

    // PUT/PATCH /admin/orders/{id}
    public function update(UpdateOrderHeaderRequest $request, Order $order)
    {
        try {
            $userId = (string) optional($request->user())->id;

            $updated = DB::transaction(function () use ($request, $order, $userId) {
                $p = $request->validated();
                $order->fill($p);
                if ($userId)
                    $order->updated_by = $userId;
                $order->save();

                // kalau number pada fee berubah, grand_total perlu di-sync
                $this->recalcTotals($order->refresh(), $reprice = false);

                return $order->fresh(['items.addons']);
            });

            return $this->successResponse($updated, 'Order diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memperbarui order', 422, ['exception' => $e->getMessage()]);
        }
    }

    // DELETE /admin/orders/{id} → soft delete
    public function destroy(Request $request, Order $order)
    {
        try {
            DB::transaction(fn() => $order->delete());
            return $this->successResponse(['id' => $order->id], 'Order dihapus');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menghapus order', 422, ['exception' => $e->getMessage()]);
        }
    }

    // POST /admin/orders/{id}/items
    public function addItem(AddOrderItemRequest $request, Order $order)
    {
        try {
            $userId = (string) optional($request->user())->id;

            $item = DB::transaction(function () use ($request, $order) {
                $p = $request->validated();
                $service = Service::findOrFail($p['service_id']);

                $unitPrice = array_key_exists('unit_price', $p) ? (float) $p['unit_price'] : $this->resolveServiceUnitPrice(
                    $service->id,
                    $order->outlet_id,
                    Carbon::now()->toDateString(),
                    null,
                    (bool) ($p['express'] ?? false),
                    (float) $service->base_price
                );

                if ($service->pricing_model === 'weight' && empty($p['weight_kg'])) {
                    throw new \RuntimeException("Service {$service->code} butuh weight_kg");
                }
                if ($service->pricing_model === 'piece' && empty($p['qty'])) {
                    throw new \RuntimeException("Service {$service->code} butuh qty");
                }

                $lineTotal = $service->pricing_model === 'weight'
                    ? round($unitPrice * (float) $p['weight_kg'], 2)
                    : round($unitPrice * (int) $p['qty'], 2);

                $item = new OrderItem();
                $item->order_id = $order->id;
                $item->service_id = $service->id;
                $item->service_code = $service->code;
                $item->service_name = $service->name;
                $item->weight_kg = $service->pricing_model === 'weight' ? $p['weight_kg'] : null;
                $item->qty = $service->pricing_model === 'piece' ? $p['qty'] : null;
                $item->unit_price = $unitPrice;
                $item->line_total = $lineTotal;
                $item->save();

                foreach (($p['addons'] ?? []) as $ax) {
                    $addon = Addon::findOrFail($ax['addon_id']);
                    $aqty = (int) ($ax['qty'] ?? 1);
                    $aprice = array_key_exists('unit_price', $ax) ? (float) $ax['unit_price'] : (float) $addon->price;

                    $ai = new OrderItemAddon();
                    $ai->order_item_id = $item->id;
                    $ai->addon_id = $addon->id;
                    $ai->addon_code = $addon->code;
                    $ai->addon_name = $addon->name;
                    $ai->qty = $aqty;
                    $ai->unit_price = $aprice;
                    $ai->line_total = round($aprice * $aqty, 2);
                    $ai->save();

                    $item->line_total += $ai->line_total;
                    $item->save();
                }

                // update totals order
                $this->recalcTotals($order->refresh());

                return $item->fresh(['addons']);
            });

            return $this->successResponse($item, 'Item ditambahkan');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menambah item', 422, ['exception' => $e->getMessage()]);
        }
    }

    // PUT/PATCH /admin/orders/{id}/items/{item_id}
    public function updateItem(UpdateOrderItemRequest $request, Order $order, OrderItem $item)
    {
        try {
            if ($item->order_id !== $order->id) {
                return $this->errorResponse('Item tidak termasuk order ini', 404);
            }

            $updated = DB::transaction(function () use ($request, $order, $item) {
                $p = $request->validated();

                // update fields
                if (array_key_exists('weight_kg', $p))
                    $item->weight_kg = $p['weight_kg'];
                if (array_key_exists('qty', $p))
                    $item->qty = $p['qty'];
                if (array_key_exists('unit_price', $p))
                    $item->unit_price = (float) $p['unit_price'];

                // hitung ulang line_total dari unit_price + qty/weight + addons
                $base = 0;
                if (!is_null($item->weight_kg))
                    $base = round($item->unit_price * (float) $item->weight_kg, 2);
                if (!is_null($item->qty))
                    $base = round($item->unit_price * (int) $item->qty, 2);

                $addonsTotal = (float) OrderItemAddon::where('order_item_id', $item->id)->sum('line_total');
                $item->line_total = $base + $addonsTotal;
                $item->save();

                $this->recalcTotals($order->refresh());

                return $item->fresh(['addons']);
            });

            return $this->successResponse($updated, 'Item diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memperbarui item', 422, ['exception' => $e->getMessage()]);
        }
    }

    // DELETE /admin/orders/{id}/items/{item_id}
    public function deleteItem(Order $order, OrderItem $item)
    {
        try {
            if ($item->order_id !== $order->id) {
                return $this->errorResponse('Item tidak termasuk order ini', 404);
            }

            DB::transaction(function () use ($order, $item) {
                // cascade delete addons (FK sudah ON DELETE CASCADE)
                $item->delete();
                $this->recalcTotals($order->refresh());
            });

            return $this->successResponse(['id' => $item->id], 'Item dihapus');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menghapus item', 422, ['exception' => $e->getMessage()]);
        }
    }

    // POST /admin/orders/{id}/items/{item_id}/addons
    public function addItemAddon(AddItemAddonRequest $request, Order $order, OrderItem $item)
    {
        try {
            if ($item->order_id !== $order->id) {
                return $this->errorResponse('Item tidak termasuk order ini', 404);
            }

            $row = DB::transaction(function () use ($request, $order, $item) {
                $p = $request->validated();
                $addon = Addon::findOrFail($p['addon_id']);
                $qty = (int) ($p['qty'] ?? 1);
                $price = array_key_exists('unit_price', $p) ? (float) $p['unit_price'] : (float) $addon->price;

                $ai = new OrderItemAddon();
                $ai->order_item_id = $item->id;
                $ai->addon_id = $addon->id;
                $ai->addon_code = $addon->code;
                $ai->addon_name = $addon->name;
                $ai->qty = $qty;
                $ai->unit_price = $price;
                $ai->line_total = round($price * $qty, 2);
                $ai->save();

                // update item + order totals
                $item->line_total += $ai->line_total;
                $item->save();
                $this->recalcTotals($order->refresh());

                return $ai;
            });

            return $this->successResponse($row, 'Addon ditambahkan ke item');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menambah addon', 422, ['exception' => $e->getMessage()]);
        }
    }

    // PUT/PATCH /admin/orders/{id}/items/{item_id}/addons/{addon_row_id}
    public function updateItemAddon(UpdateItemAddonRequest $request, Order $order, OrderItem $item, OrderItemAddon $addonRow)
    {
        try {
            if ($item->order_id !== $order->id || $addonRow->order_item_id !== $item->id) {
                return $this->errorResponse('Addon row tidak termasuk item/order ini', 404);
            }

            $row = DB::transaction(function () use ($request, $order, $item, $addonRow) {
                $before = $addonRow->line_total;

                $p = $request->validated();
                if (array_key_exists('qty', $p))
                    $addonRow->qty = (int) $p['qty'];
                if (array_key_exists('unit_price', $p))
                    $addonRow->unit_price = (float) $p['unit_price'];

                $addonRow->line_total = round($addonRow->unit_price * $addonRow->qty, 2);
                $addonRow->save();

                // update item + order totals
                $item->line_total = $item->line_total - $before + $addonRow->line_total;
                $item->save();
                $this->recalcTotals($order->refresh());

                return $addonRow;
            });

            return $this->successResponse($row, 'Addon item diperbarui');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal memperbarui addon', 422, ['exception' => $e->getMessage()]);
        }
    }

    // DELETE /admin/orders/{id}/items/{item_id}/addons/{addon_row_id}
    public function deleteItemAddon(Order $order, OrderItem $item, OrderItemAddon $addonRow)
    {
        try {
            if ($item->order_id !== $order->id || $addonRow->order_item_id !== $item->id) {
                return $this->errorResponse('Addon row tidak termasuk item/order ini', 404);
            }

            DB::transaction(function () use ($order, $item, $addonRow) {
                $before = $addonRow->line_total;
                $addonRow->delete();

                $item->line_total = $item->line_total - $before;
                $item->save();

                $this->recalcTotals($order->refresh());
            });

            return $this->successResponse(['id' => $addonRow->id], 'Addon item dihapus');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal menghapus addon', 422, ['exception' => $e->getMessage()]);
        }
    }

    // POST /admin/orders/{id}/recalc  (reprice optional)
    public function recalc(Request $request, Order $order)
    {
        $reprice = $request->boolean('reprice', true); // default: reprice pakai harga aktif
        try {
            DB::transaction(function () use ($order, $reprice) {
                if ($reprice) {
                    $today = Carbon::now()->toDateString();
                    foreach ($order->items as $it) {
                        // resolve harga terbaru (tier null, express tidak diketahui → pakai false)
                        $price = $this->resolveServiceUnitPrice($it->service_id, $order->outlet_id, $today, null, false, (float) $it->unit_price);
                        $it->unit_price = $price;

                        $base = 0;
                        if (!is_null($it->weight_kg))
                            $base = round($price * (float) $it->weight_kg, 2);
                        if (!is_null($it->qty))
                            $base = round($price * (int) $it->qty, 2);
                        $addonsTotal = (float) OrderItemAddon::where('order_item_id', $it->id)->sum('line_total');
                        $it->line_total = $base + $addonsTotal;
                        $it->save();
                    }
                }
                $this->recalcTotals($order->fresh());
            });

            return $this->successResponse($order->fresh(['items.addons']), 'Order direcalc');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal recalculasi order', 422, ['exception' => $e->getMessage()]);
        }
    }

    // POST /admin/orders/{id}/override-totals
    public function overrideTotals(OverrideTotalsRequest $request, Order $order)
    {
        try {
            $updated = DB::transaction(function () use ($request, $order) {
                $p = $request->validated();
                foreach (['subtotal', 'discount', 'tax', 'delivery_fee'] as $k) {
                    if (array_key_exists($k, $p))
                        $order->{$k} = (float) $p[$k];
                }
                $order->grand_total = (float) $order->subtotal - (float) $order->discount + (float) $order->tax + (float) $order->delivery_fee;
                $order->save();
                return $order->fresh();
            });

            return $this->successResponse($updated, 'Totals dioverride');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal override totals', 422, ['exception' => $e->getMessage()]);
        }
    }

    // POST /admin/orders/{id}/change-status
    public function changeStatus(ChangeStatusRequest $request, Order $order)
    {
        try {
            $userId = (string) optional($request->user())->id;

            $updated = DB::transaction(function () use ($request, $order, $userId) {
                $to = strtoupper($request->validated()['to_status']);
                $from = $order->status;

                // opsional: cek status valid
                OrderStatus::where('code', $to)->firstOrFail();

                $order->status = $to;
                if ($userId)
                    $order->updated_by = $userId;
                $order->save();

                $this->writeStatusLog($order, $from, $to, $userId, $request->validated()['note'] ?? null);

                return $order->fresh();
            });

            return $this->successResponse($updated, 'Status order diubah');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengubah status', 422, ['exception' => $e->getMessage()]);
        }
    }

    // GET /admin/orders/{id}/timeline
    public function timeline(Order $order)
    {
        try {
            $logs = $order->logs()->orderByDesc('changed_at')->get();
            return $this->successResponse(['order_id' => $order->id, 'items' => $logs]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil timeline', 500, ['exception' => $e->getMessage()]);
        }
    }

    // GET /admin/orders/{id}/print (opsional mock)
    public function printData(Order $order)
    {
        try {
            $order->load(['items.addons', 'outlet', 'customer']);
            return $this->successResponse([
                'order' => $order,
                'printed_at' => Carbon::now()->toIso8601String(),
            ]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil data print', 500, ['exception' => $e->getMessage()]);
        }
    }

    // ===== Helpers =====

    private function generateOrderNo(): string
    {
        do {
            $no = 'ORD-' . Carbon::now()->format('ymd') . '-' . strtoupper(Str::random(5));
        } while (Order::where('order_no', $no)->exists());
        return $no;
    }

    /**
     * Resolve harga service aktif; fallback ke $fallback jika tidak ditemukan.
     */
    private function resolveServiceUnitPrice(string $serviceId, string $outletId, string $date, ?string $tier, bool $express, float $fallback): float
    {
        $q = ServicePrice::query()
            ->where('service_id', $serviceId)
            ->where('outlet_id', $outletId)
            ->where('is_express', $express)
            ->whereDate('effective_start', '<=', $date)
            ->where(function (Builder $w) use ($date) {
                $w->whereNull('effective_end')->orWhereDate('effective_end', '>=', $date);
            })
            ->orderByRaw('CASE WHEN member_tier IS NULL THEN 1 ELSE 0 END') // prefer tier match
            ->latest('effective_start');

        if ($tier)
            $q->where('member_tier', $tier);
        else
            $q->whereNull('member_tier');

        $row = $q->first();
        return $row ? (float) $row->price : $fallback;
    }

    /**
     * Hitung subtotal (items + addons), lalu grand_total.
     */
    private function recalcTotals(Order $order, bool $reprice = false): void
    {
        $itemsSum = (float) OrderItem::where('order_id', $order->id)->sum('line_total');
        // addons sudah termasuk ke line_total item saat kita update/save, jadi cukup itemsSum.
        $order->subtotal = round($itemsSum, 2);
        $order->grand_total = (float) $order->subtotal - (float) $order->discount + (float) $order->tax + (float) $order->delivery_fee;
        $order->save();
    }

    private function writeStatusLog(Order $order, ?string $from, string $to, ?string $userId, ?string $note): void
    {
        $log = new OrderStatusLog();
        $log->order_id = $order->id;
        $log->from_status = $from;
        $log->to_status = $to;
        $log->changed_by = $userId;
        $log->note = $note;
        $log->changed_at = Carbon::now();
        $log->save();
    }
}
