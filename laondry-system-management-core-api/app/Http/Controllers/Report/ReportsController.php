<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportsController extends Controller
{
    use ApiResponse;

    /**
     * GET /admin/reports/dashboard
     * Query: outlet_id?, date_from?, date_to?
     * Return: dashboard overview dengan key metrics.
     */
    public function dashboard(Request $request)
    {
        try {
            $p = $this->validatedRange($request, defaultThisMonth: true);

            // Total Revenue (exclude CANCELED)
            $totalRevenue = DB::table('orders')
                ->whereNull('deleted_at')
                ->when($p['outlet_id'], fn($qq) => $qq->where('outlet_id', $p['outlet_id']))
                ->where('status', '!=', 'CANCELED')
                ->whereDate('created_at', '>=', $p['from'])
                ->whereDate('created_at', '<=', $p['to'])
                ->sum('grand_total');

            // Total Orders by status
            $orderStats = DB::table('orders')
                ->selectRaw("
                    COUNT(CASE WHEN status != 'CANCELED' THEN 1 END) AS total_orders,
                    COUNT(CASE WHEN status = 'NEW' THEN 1 END) AS new_orders,
                    COUNT(CASE WHEN status = 'PROCESSING' THEN 1 END) AS processing_orders,
                    COUNT(CASE WHEN status = 'READY' THEN 1 END) AS ready_orders,
                    COUNT(CASE WHEN status = 'DONE' THEN 1 END) AS done_orders,
                    COUNT(CASE WHEN status = 'CANCELED' THEN 1 END) AS canceled_orders
                ")
                ->whereNull('deleted_at')
                ->when($p['outlet_id'], fn($qq) => $qq->where('outlet_id', $p['outlet_id']))
                ->whereDate('created_at', '>=', $p['from'])
                ->whereDate('created_at', '<=', $p['to'])
                ->first();

            // Active Customers (yang pernah order di periode ini)
            $activeCustomers = DB::table('orders')
                ->whereNull('deleted_at')
                ->when($p['outlet_id'], fn($qq) => $qq->where('outlet_id', $p['outlet_id']))
                ->where('status', '!=', 'CANCELED')
                ->whereDate('created_at', '>=', $p['from'])
                ->whereDate('created_at', '<=', $p['to'])
                ->distinct('customer_id')
                ->count('customer_id');

            // Pending Orders (NEW + PROCESSING + READY)
            $pendingOrders = ($orderStats->new_orders ?? 0) +
                           ($orderStats->processing_orders ?? 0) +
                           ($orderStats->ready_orders ?? 0);

            // Average Order Value
            $avgOrderValue = $orderStats->total_orders > 0
                ? $totalRevenue / $orderStats->total_orders
                : 0;

            // TOP 5 Services by Revenue
            $topServices = DB::table('order_items AS oi')
                ->join('orders AS o', 'o.id', '=', 'oi.order_id')
                ->join('services AS s', 's.id', '=', 'oi.service_id')
                ->whereNull('o.deleted_at')
                ->when($p['outlet_id'], fn($qq) => $qq->where('o.outlet_id', $p['outlet_id']))
                ->where('o.status', '!=', 'CANCELED')
                ->whereDate('o.created_at', '>=', $p['from'])
                ->whereDate('o.created_at', '<=', $p['to'])
                ->groupBy('oi.service_id', 's.name')
                ->selectRaw('s.name, SUM(oi.line_total) AS revenue')
                ->orderBy('revenue', 'desc')
                ->limit(5)
                ->get();

            // Revenue Trend (last 7 days for quick view)
            $trendDays = 7;
            $trendStart = Carbon::parse($p['from'])->max(Carbon::now()->subDays($trendDays - 1))->toDateString();
            $revenueTrend = DB::table('orders')
                ->selectRaw("DATE(created_at) AS date, SUM(grand_total) AS revenue")
                ->whereNull('deleted_at')
                ->when($p['outlet_id'], fn($qq) => $qq->where('outlet_id', $p['outlet_id']))
                ->where('status', '!=', 'CANCELED')
                ->whereDate('created_at', '>=', $trendStart)
                ->whereDate('created_at', '<=', $p['to'])
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            return $this->successResponse([
                'summary' => [
                    'total_revenue' => $this->f($totalRevenue),
                    'total_orders' => (int) ($orderStats->total_orders ?? 0),
                    'active_customers' => (int) $activeCustomers,
                    'pending_orders' => (int) $pendingOrders,
                    'avg_order_value' => $this->f($avgOrderValue),
                ],
                'order_status' => [
                    'new' => (int) ($orderStats->new_orders ?? 0),
                    'processing' => (int) ($orderStats->processing_orders ?? 0),
                    'ready' => (int) ($orderStats->ready_orders ?? 0),
                    'done' => (int) ($orderStats->done_orders ?? 0),
                    'canceled' => (int) ($orderStats->canceled_orders ?? 0),
                ],
                'top_services' => $topServices->map(fn($r) => [
                    'name' => $r->name,
                    'revenue' => $this->f($r->revenue),
                ]),
                'revenue_trend' => $revenueTrend->map(fn($r) => [
                    'date' => (string) $r->date,
                    'revenue' => $this->f($r->revenue),
                ]),
                'query' => [
                    'outlet_id' => $p['outlet_id'],
                    'date_from' => $p['from'],
                    'date_to' => $p['to'],
                ],
            ]);
        } catch (\Throwable $e) {
            return $this->errorResponse('Gagal mengambil dashboard overview', 500, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * GET /admin/reports/revenue
     * Query: outlet_id?, date_from?, date_to?, group_by?=day|week|month
     * Return: summary total + buckets per group + echo filter.
     */
    public function revenue(Request $request)
    {
        try {
            $p = $this->validatedRange($request, defaultThisMonth: true);
            $groupBy = in_array($request->query('group_by'), ['day', 'week', 'month'], true)
                ? $request->query('group_by') : 'day';

            // Postgres date_trunc unit
            $unit = ['day' => 'day', 'week' => 'week', 'month' => 'month'][$groupBy];

            $q = DB::table('orders')
                ->selectRaw("date_trunc(?, orders.created_at)::date AS bucket", [$unit])
                ->selectRaw("SUM(grand_total) AS revenue")
                ->whereNull('orders.deleted_at')
                ->when($p['outlet_id'], fn($qq) => $qq->where('orders.outlet_id', $p['outlet_id']))
                // exclude canceled kalau ada kode 'CANCELED'
                ->when(true, fn($qq) => $qq->where('orders.status', '!=', 'CANCELED'))
                ->whereDate('orders.created_at', '>=', $p['from'])
                ->whereDate('orders.created_at', '<=', $p['to'])
                ->groupBy('bucket')
                ->orderBy('bucket', 'asc');

            $buckets = $q->get();
            $total = (float) DB::table('orders')
                ->whereNull('deleted_at')
                ->when($p['outlet_id'], fn($qq) => $qq->where('outlet_id', $p['outlet_id']))
                ->when(true, fn($qq) => $qq->where('status', '!=', 'CANCELED'))
                ->whereDate('created_at', '>=', $p['from'])
                ->whereDate('created_at', '<=', $p['to'])
                ->sum('grand_total');

            return $this->successResponse([
                'summary' => ['total_revenue' => $this->f($total)],
                'buckets' => $buckets->map(fn($r) => [
                    'date' => (string) $r->bucket,
                    'revenue' => $this->f($r->revenue),
                ]),
                'query' => [
                    'outlet_id' => $p['outlet_id'],
                    'date_from' => $p['from'],
                    'date_to' => $p['to'],
                    'group_by' => $groupBy,
                ],
            ]);
        } catch (\Throwable $e) {
            return $this->errorResponse('Gagal mengambil laporan revenue', 500, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * GET /admin/reports/service-usage
     * Query: outlet_id?, date_from?, date_to?, order_by?=revenue|qty, limit? (default 10)
     * Return: TOP services by revenue/qty.
     */
    public function serviceUsage(Request $request)
    {
        try {
            $p = $this->validatedRange($request, defaultThisMonth: true);
            $orderBy = in_array($request->query('order_by'), ['revenue', 'qty'], true) ? $request->query('order_by') : 'revenue';
            $limit = max(1, min((int) $request->query('limit', 10), 100));

            // usage_qty: qty untuk pricing_model=piece, weight_kg untuk weight
            $rows = DB::table('order_items AS oi')
                ->join('orders AS o', 'o.id', '=', 'oi.order_id')
                ->join('services AS s', 's.id', '=', 'oi.service_id')
                ->whereNull('o.deleted_at')
                ->when($p['outlet_id'], fn($qq) => $qq->where('o.outlet_id', $p['outlet_id']))
                ->when(true, fn($qq) => $qq->where('o.status', '!=', 'CANCELED'))
                ->whereDate('o.created_at', '>=', $p['from'])
                ->whereDate('o.created_at', '<=', $p['to'])
                ->groupBy('oi.service_id', 's.code', 's.name', 's.pricing_model')
                ->selectRaw('oi.service_id, s.code, s.name, s.pricing_model,
                             SUM(oi.line_total) AS revenue,
                             SUM(CASE WHEN s.pricing_model = \'piece\' THEN COALESCE(oi.qty,0)
                                      ELSE COALESCE(oi.weight_kg,0) END) AS usage_qty')
                ->orderBy($orderBy === 'revenue' ? 'revenue' : 'usage_qty', 'desc')
                ->limit($limit)
                ->get();

            return $this->successResponse([
                'items' => $rows->map(fn($r) => [
                    'service_id' => $r->service_id,
                    'service_code' => $r->code,
                    'service_name' => $r->name,
                    'pricing_model' => $r->pricing_model,
                    'revenue' => $this->f($r->revenue),
                    'usage_qty' => (float) $r->usage_qty,
                ]),
                'query' => [
                    'outlet_id' => $p['outlet_id'],
                    'date_from' => $p['from'],
                    'date_to' => $p['to'],
                    'order_by' => $orderBy,
                    'limit' => $limit,
                ],
            ]);
        } catch (\Throwable $e) {
            return $this->errorResponse('Gagal mengambil TOP layanan', 500, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * GET /admin/reports/turnaround
     * Query: outlet_id?, date_from?, date_to?
     * Menghitung rata-rata durasi NEW -> DONE (jam).
     * Catatan: mengandalkan order_status_logs: to_status='NEW' saat dibuat, to_status='DONE' saat selesai.
     */
    public function turnaround(Request $request)
    {
        try {
            $p = $this->validatedRange($request, defaultThisMonth: true);

            // ambil timestamp NEW & DONE per order
            $sub = DB::table('order_status_logs')
                ->select(
                    'order_id',
                    DB::raw("MIN(CASE WHEN to_status='NEW'  THEN changed_at END) AS new_at"),
                    DB::raw("MIN(CASE WHEN to_status='DONE' THEN changed_at END) AS done_at")
                )
                ->groupBy('order_id');

            $rows = DB::table('orders AS o')
                ->joinSub($sub, 't', 't.order_id', '=', 'o.id')
                ->whereNull('o.deleted_at')
                ->when($p['outlet_id'], fn($qq) => $qq->where('o.outlet_id', $p['outlet_id']))
                ->whereDate('o.created_at', '>=', $p['from'])
                ->whereDate('o.created_at', '<=', $p['to'])
                ->whereNotNull('t.new_at')
                ->whereNotNull('t.done_at')
                ->selectRaw("COUNT(*) AS orders_done,
                             AVG(EXTRACT(EPOCH FROM (t.done_at - t.new_at)))/3600.0 AS avg_hours,
                             MIN(EXTRACT(EPOCH FROM (t.done_at - t.new_at)))/3600.0 AS min_hours,
                             MAX(EXTRACT(EPOCH FROM (t.done_at - t.new_at)))/3600.0 AS max_hours")
                ->first();

            return $this->successResponse([
                'summary' => [
                    'orders_done' => (int) ($rows->orders_done ?? 0),
                    'avg_hours' => $this->f($rows->avg_hours ?? 0),
                    'min_hours' => $this->f($rows->min_hours ?? 0),
                    'max_hours' => $this->f($rows->max_hours ?? 0),
                ],
                'query' => [
                    'outlet_id' => $p['outlet_id'],
                    'date_from' => $p['from'],
                    'date_to' => $p['to'],
                ],
            ]);
        } catch (\Throwable $e) {
            return $this->errorResponse('Gagal mengambil turnaround', 500, ['exception' => $e->getMessage()]);
        }
    }

    /**
     * GET /admin/reports/customers
     * Query: outlet_id?, date_from?, date_to?, limit?=50, sort?=orders|revenue|last
     * Aktivitas pelanggan: total order, total revenue, last_order_at.
     */
    public function customers(Request $request)
    {
        try {
            $p = $this->validatedRange($request, defaultThisMonth: false);
            $limit = max(1, min((int) $request->query('limit', 50), 200));
            $sort = in_array($request->query('sort'), ['orders', 'revenue', 'last'], true) ? $request->query('sort') : 'revenue';

            $rows = DB::table('orders AS o')
                ->join('users AS u', 'u.id', '=', 'o.customer_id')
                ->whereNull('o.deleted_at')
                ->when($p['outlet_id'], fn($qq) => $qq->where('o.outlet_id', $p['outlet_id']))
                ->when(true, fn($qq) => $qq->where('o.status', '!=', 'CANCELED'))
                ->when($p['from'], fn($qq) => $qq->whereDate('o.created_at', '>=', $p['from']))
                ->when($p['to'], fn($qq) => $qq->whereDate('o.created_at', '<=', $p['to']))
                ->groupBy('o.customer_id', 'u.full_name', 'u.email')
                ->selectRaw('o.customer_id,
                             COALESCE(u.full_name, \'-\') AS name,
                             COALESCE(u.email, \'-\') AS email,
                             COUNT(*) AS orders_count,
                             SUM(o.grand_total) AS revenue,
                             MAX(o.created_at) AS last_order_at');

            // sorting
            if ($sort === 'orders')
                $rows->orderBy('orders_count', 'desc');
            elseif ($sort === 'last')
                $rows->orderBy('last_order_at', 'desc');
            else
                $rows->orderBy('revenue', 'desc');

            $rows = $rows->limit($limit)->get();

            return $this->successResponse([
                'items' => $rows->map(fn($r) => [
                    'customer_id' => $r->customer_id,
                    'name' => $r->name,
                    'email' => $r->email,
                    'orders_count' => (int) $r->orders_count,
                    'revenue' => $this->f($r->revenue),
                    'last_order_at' => (string) $r->last_order_at,
                ]),
                'query' => [
                    'outlet_id' => $p['outlet_id'],
                    'date_from' => $p['from'],
                    'date_to' => $p['to'],
                    'limit' => $limit,
                    'sort' => $sort,
                ],
            ]);
        } catch (\Throwable $e) {
            return $this->errorResponse('Gagal mengambil aktivitas pelanggan', 500, ['exception' => $e->getMessage()]);
        }
    }

    // ==== helpers ====

    private function validatedRange(Request $request, bool $defaultThisMonth = true): array
    {
        $request->validate([
            'outlet_id' => ['nullable', 'uuid'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $from = $request->query('date_from');
        $to = $request->query('date_to');

        if ($defaultThisMonth && (!$from || !$to)) {
            $from = Carbon::now()->startOfMonth()->toDateString();
            $to = Carbon::now()->endOfMonth()->toDateString();
        }

        return [
            'outlet_id' => $request->query('outlet_id'),
            'from' => $from,
            'to' => $to,
        ];
    }

    private function f($num): float
    {
        return round((float) $num, 2);
    }
}
