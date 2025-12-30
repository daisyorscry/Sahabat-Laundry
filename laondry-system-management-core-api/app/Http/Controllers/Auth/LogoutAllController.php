<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Models\Auth\User;
use App\Helpers\AuthTokenHelper;

class LogoutAllController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request)
    {
        $userId = $request->get('auth_user_id');
        $user = User::find($userId);
        if (!$user) {
            return $this->errorResponse('User tidak ditemukan', 404);
        }

        // Revoke semua refresh token + bump token_version (global kill)
        AuthTokenHelper::revokeAllForUser($user, true);

        // Blacklist access token aktif agar langsung invalid
        AuthTokenHelper::blacklistAccessFromRequest($request);

        return $this->successResponse(null, 'Semua sesi berhasil dicabut');
    }
}
