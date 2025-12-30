<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Auth\RefreshToken;
use App\Models\Auth\UserLogin;
use Carbon\Carbon;

class ListSessionsController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request)
    {
        $userId = $request->get('auth_user_id');
        $currentDeviceId = $request->header('X-Device-Id');

        // subquery: last login per device
        $lastLoginSub = UserLogin::select(
            'user_id',
            'device_id',
            DB::raw('MAX(logged_in_at) AS last_login_at')
        )
            ->where('user_id', $userId)
            ->groupBy('user_id', 'device_id');

        // ambil semua refresh token user
        $rows = RefreshToken::query()
            ->where('user_id', $userId)
            ->leftJoinSub($lastLoginSub, 'ul', function ($join) {
                $join->on('refresh_tokens.user_id', '=', 'ul.user_id')
                    ->on('refresh_tokens.device_id', '=', 'ul.device_id');
            })
            ->orderByDesc('refresh_tokens.created_at')
            ->get([
                'refresh_tokens.id',
                'refresh_tokens.jti',
                'refresh_tokens.device_id',
                'refresh_tokens.ip',
                'refresh_tokens.ua',
                'refresh_tokens.expires_at',
                'refresh_tokens.revoked_at',
                'refresh_tokens.created_at',
                'ul.last_login_at',
            ]);

        $now = Carbon::now();

        $data = $rows->map(function ($r) use ($now, $currentDeviceId) {
            $status = 'active';
            if (!is_null($r->revoked_at)) {
                $status = 'revoked';
            } elseif ($now->greaterThan($r->expires_at)) {
                $status = 'expired';
            }

            return [
                'id' => $r->id,
                'device_id' => $r->device_id,
                'ip' => $r->ip,
                'user_agent' => $r->ua,
                'created_at' => $r->created_at,
                'last_login_at' => $r->last_login_at,
                'expires_at' => $r->expires_at,
                'revoked_at' => $r->revoked_at,
                'status' => $status,                 // active | expired | revoked
                'is_current_device' => $currentDeviceId && $r->device_id === $currentDeviceId,
            ];
        })->values();

        return $this->successResponse($data, 'Daftar sesi');
    }
}
