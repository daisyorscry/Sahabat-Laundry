<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class HomeController extends Controller
{
    use ApiResponse;

    /**
     * GET /mobile/home/dashboard
     * Return comprehensive home page data for mobile app
     */
    public function dashboard(Request $request)
    {
        try {
            $user = Auth::user();
            \Log::info('HomeController::dashboard started', ['user_id' => $user->id]);

            // Load member tier if not loaded
            if (!$user->relationLoaded('memberTier')) {
                $user->load('memberTier');
            }

            \Log::info('Getting customer statistics');
            // Get customer statistics
            $stats = $this->getCustomerStatistics($user);

            \Log::info('Getting active orders');
            // Get active orders (NEW, PROCESSING, READY)
            $activeOrders = $this->getActiveOrders($user);

            \Log::info('Getting recent orders');
            // Get recent completed orders (last 5)
            $recentOrders = $this->getRecentOrders($user);

            \Log::info('Getting popular services');
            // Get popular services (most ordered by this customer)
            $popularServices = $this->getPopularServices($user);

            \Log::info('Returning success response');
            return $this->successResponse([
                'user' => [
                    'id' => $user->id,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'balance' => (float) $user->balance,
                    'member_tier' => $user->memberTier ? [
                        'id' => $user->memberTier->id,
                        'code' => $user->memberTier->code,
                        'name' => $user->memberTier->name,
                    ] : null,
                    'default_outlet_id' => $user->default_outlet_id,
                ],
                'statistics' => $stats,
                'active_orders' => $activeOrders,
                'recent_orders' => $recentOrders,
                'popular_services' => $popularServices,
            ]);
        } catch (\Throwable $e) {
            \Log::error('HomeController::dashboard error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse('Gagal mengambil data dashboard', 500, [
                'exception' => $e->getMessage()
            ]);
        }
    }

    private function getCustomerStatistics($user)
    {
        $orders = \App\Models\OrderService\Order::where('customer_id', $user->id);

        $thisMonth = Carbon::now()->startOfMonth();
        $ordersThisMonth = (clone $orders)->where('created_at', '>=', $thisMonth);

        return [
            'total_orders' => $orders->count(),
            'orders_this_month' => $ordersThisMonth->count(),
            'total_spending' => (float) $orders->where('status', '!=', 'CANCELED')->sum('grand_total'),
            'spending_this_month' => (float) $ordersThisMonth->where('status', '!=', 'CANCELED')->sum('grand_total'),
            'average_order_value' => (float) $orders->where('status', '!=', 'CANCELED')->avg('grand_total'),
            'active_orders_count' => $orders->whereIn('status', ['NEW', 'PROCESSING', 'READY'])->count(),
            'completed_orders_count' => $orders->where('status', 'DONE')->count(),
        ];
    }

    private function getActiveOrders($user)
    {
        return \App\Models\OrderService\Order::where('customer_id', $user->id)
            ->whereIn('status', ['NEW', 'PROCESSING', 'READY'])
            ->with([
                'outlet:id,name',
                'statusRef:code,name,color,icon,description',
                'items.service:id,code,name',
            ])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_no' => $order->order_no,
                    'status' => $order->status,
                    'status_info' => [
                        'code' => $order->statusRef?->code,
                        'name' => $order->statusRef?->name,
                        'description' => $order->statusRef?->description,
                        'color' => $order->statusRef?->color,
                        'icon' => $order->statusRef?->icon,
                    ],
                    'outlet_name' => $order->outlet?->name,
                    'promised_at' => $order->promised_at?->toISOString(),
                    'total' => (float) $order->grand_total,
                    'items_summary' => $order->items->map(fn($item) => [
                        'service_name' => $item->service?->name,
                        'qty' => $item->qty ?? $item->weight_kg,
                        'unit' => $item->qty ? 'pcs' : 'kg',
                    ]),
                    'created_at' => $order->created_at->toISOString(),
                ];
            });
    }

    private function getRecentOrders($user)
    {
        return \App\Models\OrderService\Order::where('customer_id', $user->id)
            ->where('status', 'DONE')
            ->with([
                'outlet:id,name',
                'items.service:id,code,name',
            ])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_no' => $order->order_no,
                    'outlet_name' => $order->outlet?->name,
                    'total' => (float) $order->grand_total,
                    'items_count' => $order->items->count(),
                    'items_summary' => $order->items->take(2)->map(fn($item) =>
                        $item->service?->name
                    )->join(', '),
                    'created_at' => $order->created_at->toISOString(),
                    'can_reorder' => true,
                ];
            });
    }

    private function getPopularServices($user)
    {
        // Get most ordered services by this customer
        $serviceCounts = DB::table('order_items as oi')
            ->join('orders as o', 'oi.order_id', '=', 'o.id')
            ->join('services as s', 'oi.service_id', '=', 's.id')
            ->where('o.customer_id', $user->id)
            ->where('s.is_active', true)
            ->select(
                's.id',
                's.code',
                's.name',
                's.description',
                's.base_price',
                's.icon_path',
                DB::raw('COUNT(oi.id) as order_count')
            )
            ->groupBy('s.id', 's.code', 's.name', 's.description', 's.base_price', 's.icon_path')
            ->orderBy('order_count', 'desc')
            ->limit(6)
            ->get();

        return $serviceCounts->map(function ($service) use ($user) {
            // Get service price with member tier
            $memberTierCode = $user->memberTier?->code;
            $now = now();

            // Query for service price with fallback
            $priceQuery = \App\Models\OrderService\ServicePrice::where('service_id', $service->id)
                ->where('effective_start', '<=', $now)
                ->where(function ($q) use ($now) {
                    $q->whereNull('effective_end')
                      ->orWhere('effective_end', '>=', $now);
                });

            // Try to get price with member tier
            $servicePrice = null;
            if ($memberTierCode) {
                $servicePrice = (clone $priceQuery)
                    ->where('member_tier', $memberTierCode)
                    ->where(function ($q) use ($user) {
                        $q->whereNull('outlet_id')
                          ->orWhere('outlet_id', $user->default_outlet_id);
                    })
                    ->orderByRaw('outlet_id IS NOT NULL DESC')
                    ->first();
            }

            // Fallback to NULL member tier
            if (!$servicePrice) {
                $servicePrice = (clone $priceQuery)
                    ->whereNull('member_tier')
                    ->where(function ($q) use ($user) {
                        $q->whereNull('outlet_id')
                          ->orWhere('outlet_id', $user->default_outlet_id);
                    })
                    ->orderByRaw('outlet_id IS NOT NULL DESC')
                    ->first();
            }

            return [
                'id' => $service->id,
                'code' => $service->code,
                'name' => $service->name,
                'description' => $service->description,
                'base_price' => (float) $service->base_price,
                'unit_price' => $servicePrice ? (float) $servicePrice->price : (float) $service->base_price,
                'has_discount' => $servicePrice && $servicePrice->price < $service->base_price,
                'discount_percentage' => $servicePrice && $service->base_price > 0
                    ? round((($service->base_price - $servicePrice->price) / $service->base_price) * 100)
                    : 0,
                'icon_path' => $service->icon_path,
                'order_count' => $service->order_count,
            ];
        });
    }
}
