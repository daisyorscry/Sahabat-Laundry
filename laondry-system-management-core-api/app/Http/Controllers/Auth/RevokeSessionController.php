<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Auth\RefreshToken;
use App\Helpers\JwtHelper;
use App\Support\TokenBlacklist;
use Illuminate\Support\Str;
use Throwable;

class RevokeSessionController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'refresh_token_id' => ['sometimes', 'uuid', 'required_without:device_id'],
            'device_id' => ['sometimes', 'string', 'required_without:refresh_token_id'],
            'revoke_current' => ['sometimes', 'boolean'], // optional: blacklist access token aktif
        ]);
        $userId = $request->get('auth_user_id');

        // Target rows milik user ini
        $query = RefreshToken::where('user_id', $userId)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now());

        if (!empty($data['refresh_token_id'])) {
            $query->where('id', $data['refresh_token_id']);
        }
        if (!empty($data['device_id'])) {
            $query->where('device_id', $data['device_id']);
        }

        $rows = $query->get(['id', 'jti', 'device_id']);
        if ($rows->isEmpty()) {
            return $this->successResponse(['revoked' => 0], 'Tidak ada sesi yang aktif untuk dicabut');
        }

        DB::transaction(function () use ($rows) {
            RefreshToken::whereIn('id', $rows->pluck('id'))
                ->update(['revoked_at' => now()]);
        });

        // Optional: kalau yang dicabut adalah device saat ini dan diminta revoke_current,
        // blacklist access token aktif supaya langsung invalid.
        if (!empty($data['revoke_current'])) {
            $currentDeviceId = $request->header('X-Device-Id');
            $targetHasCurrent = $currentDeviceId
                && $rows->contains(fn($r) => $r->device_id === $currentDeviceId);

            if ($targetHasCurrent) {
                $authHeader = $request->header('Authorization');
                if ($authHeader && Str::startsWith($authHeader, 'Bearer ')) {
                    $accessToken = substr($authHeader, 7);
                    try {
                        $payload = JwtHelper::decode($accessToken);
                        if (!empty($payload->jti) && !empty($payload->exp) && $payload->exp > time()) {
                            TokenBlacklist::put($payload->jti, $payload->exp - time());
                        }
                    } catch (Throwable $e) {
                        // abaikan, idempotent
                    }
                }
            }
        }

        return $this->successResponse(['revoked' => $rows->count()], 'Sesi berhasil dicabut');
    }
}
