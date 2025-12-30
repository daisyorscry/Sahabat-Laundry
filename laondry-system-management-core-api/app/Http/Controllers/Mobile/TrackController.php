<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Models\OrderService\Order;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Throwable;

class TrackController extends Controller
{
    use ApiResponse;

    // GET /mobile/track/{order_no}
    public function track(Request $request, string $order_no)
    {
        try {
            $o = Order::query()
                ->with(['outlet:id,code,name,city', 'logs' => fn($q) => $q->latest('changed_at')->limit(1)])
                ->where('order_no', $order_no)
                ->firstOrFail();

            $isAuthed = Auth::check();
            if ($isAuthed && (string) $o->customer_id !== (string) Auth::id()) {
                // kalau login tapi bukan pemilik → 404 biar aman
                abort(404);
            }

            $last = $o->logs->first();

            // payload minimal (tanpa PII customer)
            $data = [
                'order_no' => $o->order_no,
                'status' => $o->status,
                'promised_at' => optional($o->promised_at)->toIso8601String(),
                'outlet' => [
                    'id' => $o->outlet?->id,
                    'code' => $o->outlet?->code,
                    'name' => $o->outlet?->name,
                    'city' => $o->outlet?->city,
                ],
                'last_update' => [
                    'at' => $last?->changed_at?->toIso8601String(),
                    'from' => $last?->from_status,
                    'to' => $last?->to_status,
                    'note' => $last?->note,
                ],
            ];

            return $this->successResponse($data);
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengambil tracking', 404, ['exception' => $e->getMessage()]);
        }
    }
}
