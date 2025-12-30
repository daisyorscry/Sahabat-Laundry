<?php
// app/Http/Middleware/RequireRole.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;

class RequireRole
{
    use ApiResponse;

    public function handle(Request $request, Closure $next, ...$required)
    {
        // pastikan JwtAuth sudah set user
        $user = $request->user();
        if (!$user) {
            return $this->errorResponse('Unauthorized', 401);
        }

        // roles dari attribute (diisi JwtAuth) atau fallback query
        $userRoles = $request->attributes->get('auth_user_roles');
        if ($userRoles === null) {
            $userRoles = $user->roles()->pluck('slug')->all();
        }

        // kalau tidak ada parameter, lolos
        if (empty($required)) {
            return $next($request);
        }

        // dukung pemanggilan: role:admin atau role:admin,manager
        // (Laravel kirimnya sebagai variadic berdasarkan koma)
        $required = array_filter(array_map('strtolower', $required));
        $userRoles = array_map('strtolower', $userRoles);

        $hasRole = (bool) array_intersect($userRoles, $required);
        if (!$hasRole) {
            return $this->errorResponse('Akses ditolak untuk role ini.', 403);
        }

        return $next($request);
    }
}
