<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Models\OrderService\{Order, OrderStatusLog, StatusTransition};
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class OrderStatusController extends Controller
{
    use ApiResponse;

    /**
     * Update order status (called by payment service webhook)
     * POST /api/orders/{orderId}/status
     */
    public function updateStatus(Request $request, $orderId)
    {
        try {
            $request->validate([
                'new_status' => 'required|string|exists:order_statuses,code',
                'note' => 'nullable|string',
                'source' => 'nullable|string',
            ]);

            // Find order by ID or order_no
            $order = $this->findOrder($orderId);

            if (!$order) {
                return $this->errorResponse('Order not found', 404);
            }

            $newStatus = $request->input('new_status');
            $note = $request->input('note', '');
            $source = $request->input('source', 'system');

            // Validate status transition is allowed
            if (!StatusTransition::isAllowed($order->status, $newStatus)) {
                return $this->errorResponse(
                    "Status transition from {$order->status} to {$newStatus} is not allowed",
                    422,
                    ['current_status' => $order->status, 'requested_status' => $newStatus]
                );
            }

            $updated = DB::transaction(function () use ($order, $newStatus, $note, $source) {
                $oldStatus = $order->status;
                $order->status = $newStatus;
                $order->save();

                // Create status log
                $log = new OrderStatusLog();
                $log->order_id = $order->id;
                $log->from_status = $oldStatus;
                $log->to_status = $newStatus;
                $log->changed_by = null; // System update
                $log->note = $note . " (Source: {$source})";
                $log->changed_at = Carbon::now();
                $log->save();

                Log::info("Order status updated", [
                    'order_id' => $order->id,
                    'order_no' => $order->order_no,
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                    'source' => $source,
                ]);

                return $order->fresh(['statusRef']);
            });

            return $this->successResponse([
                'order_id' => $updated->id,
                'order_no' => $updated->order_no,
                'old_status' => DB::table('order_status_logs')
                    ->where('order_id', $updated->id)
                    ->where('to_status', $newStatus)
                    ->latest('changed_at')
                    ->value('from_status'),
                'new_status' => $updated->status,
                'status_info' => [
                    'code' => $updated->statusRef?->code,
                    'name' => $updated->statusRef?->name,
                    'color' => $updated->statusRef?->color,
                    'icon' => $updated->statusRef?->icon,
                ],
            ], 'Order status updated successfully');

        } catch (Throwable $e) {
            Log::error("Failed to update order status", [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'Failed to update order status',
                500,
                ['exception' => $e->getMessage()]
            );
        }
    }

    /**
     * Find order by UUID or order_no
     */
    private function findOrder($identifier)
    {
        // Try UUID first
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $identifier)) {
            return Order::find($identifier);
        }

        // Try order_no
        return Order::where('order_no', $identifier)->first();
    }
}
