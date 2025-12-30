<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Helpers\AuthTokenHelper;

class LogoutController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request)
    {
        $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        // Revoke refresh token terkait + blacklist access token aktif
        AuthTokenHelper::revokeByToken($request->refresh_token);
        AuthTokenHelper::blacklistAccessFromRequest($request);

        return $this->successResponse(null, 'Logout berhasil');
    }
}
