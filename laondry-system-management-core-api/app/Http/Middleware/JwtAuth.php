<?php
// app/Http/Middleware/JwtAuth.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;
use App\Helpers\JwtHelper;
use App\Helpers\AuthTokenHelper;
use App\Support\TokenBlacklist;
use App\Models\Auth\User;
use Illuminate\Support\Facades\Auth;

class JwtAuth
{
    use ApiResponse;

    public function handle(Request $request, Closure $next)
    {
        $authHeader = $request->header('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return $this->errorResponse('Unauthorized', 401);
        }

        $token = trim(substr($authHeader, 7));
        if (!$token || $token === 'null') {
            return $this->errorResponse('Unauthorized', 401);
        }

        try {
            $payload = JwtHelper::decode($token);
        } catch (\Throwable $e) {
            return $this->errorResponse('Token tidak valid: ' . $e->getMessage(), 401);
        }

        // blacklist check
        if (!empty($payload->jti) && TokenBlacklist::has($payload->jti)) {
            return $this->errorResponse('Token revoked', 401);
        }

        if (empty($payload->sub) || !property_exists($payload, 'token_version')) {
            return $this->errorResponse('Token tidak valid', 401);
        }

        // ambil user
        /** @var User|null $user */
        $user = User::find($payload->sub);
        if (!$user) {
            return $this->errorResponse('User tidak ditemukan', 401);
        }
        if (!$user->is_active) {
            return $this->errorResponse($user->banned_reason ?? 'Akun diblokir', 403);
        }

        // token_version check
        try {
            AuthTokenHelper::assertTokenVersionValid($payload);
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), 401);
        }

        // set ke guard & request
        Auth::setUser($user);
        $request->setUserResolver(fn() => $user);

        // preload roles ke attribute (opsional cache)
        $roles = cache()->remember("u:{$user->id}:roles", 60, fn() => $user->roles()->pluck('slug')->all());
        $request->attributes->set('auth_user_roles', $roles);
        $request->attributes->set('auth_user_id', $user->id);

        return $next($request);
    }
}
