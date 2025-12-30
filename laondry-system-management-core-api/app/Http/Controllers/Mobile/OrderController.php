<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Mobile\Order\{
    StoreOrderRequest,
    CancelOrderRequest,
    RequestDeliveryRequest
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
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class OrderController extends Controller
{
    use ApiResponse;

    // GET /mobile/orders
    public function index(Request $request)
    {
        try {
            $uid = (string) Auth::id();
            $status = $request->query('status');
            $dateFrom = $request->query('date_from');
            $dateTo = $request->query('date_to');
            $per = max(1, min((int) $request->query('per_page', 10), 50));
            $sort = $request->query('sort', 'created_at');
            $orderDir = strtolower($request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';
            $sortable = ['created_at', 'updated_at', 'order_no', 'status', 'grand_total'];

            $p = Order::query()
                ->where('customer_id', $uid)
                ->when($status, fn($q) => $q->where('status', strtoupper($status)))
                ->when($dateFrom, fn($q) => $q->whereDate('created_at', '>=', $dateFrom))
                ->when($dateTo, fn($q) => $q->whereDate('created_at', '<=', $dateTo))
                ->orderBy(in_array($sort, $sortable, true) ? $sort : 'created_at', $orderDir)
                ->paginate($per, ['id', 'order_no', 'status', 'grand_total', 'created_at', 'promised_at', 'outlet_id']);

            return $this->successResponse([
                'items' => $p->items(),
                'pagination' => [
                    'current_page' => $p->currentPage(),
                    'per_page' => $p->perPage(),
                    'total' => $p->total(),
                    'last_page' => $p->lastPage()
                ],
                'query' => compact('status', 'dateFrom', 'dateTo', 'sort', 'orderDir')
            ]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil riwayat order', 500, ['exception' => $e->getMessage()]);
        }
    }

    // POST /mobile/orders
    public function store(StoreOrderRequest $request)
    {
        try {
            $uid = (string) Auth::id();

            $order = DB::transaction(function () use ($request, $uid) {
                $p = $request->validated();
                $tier = $p['member_tier'] ?? null;

                $o = new Order();
                $o->order_no = $this->generateOrderNo();
                $o->customer_id = $uid;
                $o->outlet_id = $p['outlet_id'];
                $o->status = 'PENDING_PAYMENT';
                $o->order_type = $p['order_type'];
                $o->requested_pickup_at = $p['requested_pickup_at'] ?? null;
                $o->pickup_address = $p['pickup_address'] ?? null;
                $o->delivery_address = $p['delivery_address'] ?? null;
                $o->discount = 0;
                $o->tax = 0;
                $o->delivery_fee = 0;
                $o->notes = $p['notes'] ?? null;
                $o->created_by = $uid;
                $o->updated_by = $uid;
                $o->save();

                $today = Carbon::now()->toDateString();

                foreach ($p['items'] as $row) {
                    $svc = Service::findOrFail($row['service_id']);

                    $isExpressReq = (bool) ($row['is_express'] ?? false);
                    $useExpress = $isExpressReq && (bool) $svc->is_express_available;

                    $unitPrice = $this->resolvePrice($svc->id, $o->outlet_id, $today, $tier, $useExpress, (float) $svc->base_price);

                    $weight = $row['weight_kg'] ?? null;
                    $qty = $row['qty'] ?? null;

                    $baseTotal = $svc->pricing_model === 'weight'
                        ? round($unitPrice * (float) $weight, 2)
                        : round($unitPrice * (int) $qty, 2);

                    $item = new OrderItem();
                    $item->order_id = $o->id;
                    $item->service_id = $svc->id;
                    $item->service_code = $svc->code;
                    $item->service_name = $svc->name;
                    $item->weight_kg = $svc->pricing_model === 'weight' ? $weight : null;
                    $item->qty = $svc->pricing_model === 'piece' ? $qty : null;
                    $item->unit_price = $unitPrice;
                    $item->line_total = $baseTotal;
                    $item->save();

                    foreach (($row['addons'] ?? []) as $ax) {
                        $a = Addon::findOrFail($ax['addon_id']);
                        $aqty = (int) ($ax['qty'] ?? 1);
                        $ap = (float) $a->price;

                        $ai = new OrderItemAddon();
                        $ai->order_item_id = $item->id;
                        $ai->addon_id = $a->id;
                        $ai->addon_code = $a->code;
                        $ai->addon_name = $a->name;
                        $ai->qty = $aqty;
                        $ai->unit_price = $ap;
                        $ai->line_total = round($ap * $aqty, 2);
                        $ai->save();

                        $item->line_total += $ai->line_total;
                        $item->save();
                    }
                }

                $this->recalcTotals($o->refresh());
                $this->log($o, null, 'PENDING_PAYMENT', $uid, 'Order dibuat via mobile, menunggu pembayaran');

                return $o->fresh(['items.addons']);
            });

            return $this->successResponse($order, 'Order dibuat');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal membuat order', 422, ['exception' => $e->getMessage()]);
        }
    }

    // GET /mobile/orders/{id}
    public function show(Order $order)
    {
        try {
            $this->abortIfNotOwner($order);
            $order->load(['items.addons', 'outlet']);
            return $this->successResponse($order);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil detail order', 500, ['exception' => $e->getMessage()]);
        }
    }

    // POST /mobile/orders/{id}/cancel  (boleh jika status NEW/RECEIVED)
    public function cancel(CancelOrderRequest $request, Order $order)
    {
        try {
            $this->abortIfNotOwner($order);

            $allowed = in_array($order->status, ['NEW', 'RECEIVED'], true);
            if (!$allowed) {
                return $this->errorResponse('Order tidak bisa dibatalkan pada status saat ini', 409, ['status' => $order->status]);
            }

            $updated = DB::transaction(function () use ($request, $order) {
                $from = $order->status;
                $order->status = 'CANCELED';
                $order->save();
                $this->log($order, $from, 'CANCELED', (string) Auth::id(), $request->validated()['reason'] ?? 'Cancel by customer');
                return $order->fresh();
            });

            return $this->successResponse($updated, 'Order dibatalkan');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal membatalkan order', 422, ['exception' => $e->getMessage()]);
        }
    }

    // GET /mobile/orders/{id}/timeline
    public function timeline(Order $order)
    {
        try {
            $this->abortIfNotOwner($order);
            $logs = $order->logs()->orderByDesc('changed_at')->get();
            return $this->successResponse(['order_id' => $order->id, 'items' => $logs]);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil timeline', 500, ['exception' => $e->getMessage()]);
        }
    }

    // POST /mobile/orders/{id}/confirm-ready  (log acknowledgement; tidak ubah status)
    public function confirmReady(Order $order)
    {
        try {
            $this->abortIfNotOwner($order);

            DB::transaction(function () use ($order) {
                // log dari-status ke-status sama (acknowledge)
                $this->log($order, $order->status, $order->status, (string) Auth::id(), 'Customer confirmed ready');
            });

            return $this->successResponse($order->fresh(), 'Konfirmasi siap diterima');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal konfirmasi', 422, ['exception' => $e->getMessage()]);
        }
    }

    // POST /mobile/orders/{id}/request-delivery  (update alamat + log)
    public function requestDelivery(RequestDeliveryRequest $request, Order $order)
    {
        try {
            $this->abortIfNotOwner($order);

            $updated = DB::transaction(function () use ($request, $order) {
                $addr = $request->validated()['delivery_address'];
                $note = $request->validated()['note'] ?? null;

                $order->delivery_address = $addr;
                $order->save();

                $this->log($order, $order->status, $order->status, (string) Auth::id(), 'Delivery requested' . ($note ? ": $note" : ''));

                return $order->fresh();
            });

            return $this->successResponse($updated, 'Permintaan antar disimpan');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal request delivery', 422, ['exception' => $e->getMessage()]);
        }
    }

    // ===== Helpers =====

    private function abortIfNotOwner(Order $order): void
    {
        if ((string) $order->customer_id !== (string) Auth::id()) {
            abort(response()->json(['status' => 'error', 'message' => 'Tidak ditemukan'], 404));
        }
    }

    private function generateOrderNo(): string
    {
        do {
            $no = 'ORD-' . Carbon::now()->format('ymd') . '-' . strtoupper(Str::random(5));
        }
        while (Order::where('order_no', $no)->exists());
        return $no;
    }

    private function resolvePrice(string $serviceId, string $outletId, string $date, ?string $tier, bool $express, float $fallback): float
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

        return $row ? (float) $row->price : $fallback;
    }

    private function recalcTotals(Order $order): void
    {
        $sum = (float) OrderItem::where('order_id', $order->id)->sum('line_total');
        $order->subtotal = round($sum, 2);
        $order->grand_total = (float) $order->subtotal - (float) $order->discount + (float) $order->tax + (float) $order->delivery_fee;
        $order->save();
    }

    private function log(Order $o, ?string $from, string $to, ?string $by, ?string $note): void
    {
        $l = new OrderStatusLog();
        $l->order_id = $o->id;
        $l->from_status = $from;
        $l->to_status = $to;
        $l->changed_by = $by;
        $l->note = $note;
        $l->changed_at = Carbon::now();
        $l->save();
    }
}
