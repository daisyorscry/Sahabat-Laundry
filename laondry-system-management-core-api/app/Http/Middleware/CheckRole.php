<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Helpers\JwtHelper;
use App\Traits\ApiResponse;
use App\Support\TokenBlacklist;
use App\Models\Auth\User;

class CheckRole
{
    use ApiResponse;

    public function handle(Request $request, Closure $next, ...$requiredRoles)
    {
        $authHeader = $request->header('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return $this->errorResponse('Token tidak ditemukan.', 401);
        }

        $token = trim(substr($authHeader, 7));
        if (!$token || $token === 'null') {
            return $this->errorResponse('Token kosong atau tidak valid.', 401);
        }

        try {
            $payload = JwtHelper::decode($token);
        } catch (\Throwable $e) {
            return $this->errorResponse('Token tidak valid: ' . $e->getMessage(), 401);
        }

        if (!empty($payload->jti) && TokenBlacklist::has($payload->jti)) {
            return $this->errorResponse('Token sudah dicabut.', 401);
        }

        if (empty($payload->sub) || !property_exists($payload, 'token_version')) {
            return $this->errorResponse('Token tidak valid (payload tidak lengkap).', 401);
        }

        $user = User::find($payload->sub);
        if (!$user) {
            return $this->errorResponse('User tidak ditemukan.', 401);
        }
        if (!$user->is_active) {
            return $this->errorResponse($user->banned_reason ?? 'Akun telah diblokir.', 403);
        }
        if ((int) $payload->token_version < (int) $user->token_version) {
            return $this->errorResponse('Token sudah tidak berlaku.', 401);
        }

        // REAL-TIME ROLES dari DB
        $userRoles = cache()->remember("u:{$user->id}:roles", 60, fn() => $user->roles()->pluck('slug')->all());

        // Inject context
        $request->merge([
            'auth_user_id' => $user->id,
            'auth_user_roles' => $userRoles,
        ]);
        $request->setUserResolver(fn() => $user);

        // Jika middleware dipanggil tanpa parameter role, lewati cek peran
        if (!empty($requiredRoles)) {
            $hasRole = !empty(array_intersect($userRoles, $requiredRoles));
            if (!$hasRole) {
                return $this->errorResponse('Akses ditolak untuk role ini.', 403);
            }
        }

        return $next($request);
    }
}
