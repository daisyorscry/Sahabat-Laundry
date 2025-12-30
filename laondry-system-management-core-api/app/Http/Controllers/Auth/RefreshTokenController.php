<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Helpers\AuthTokenHelper;

class RefreshTokenController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request)
    {
        $refreshToken = $request->bearerToken() ?? $request->input('refresh_token');

        if (!$refreshToken) {
            return $this->errorResponse('Refresh token tidak ditemukan.', 401);
        }

        try {
            $tokens = AuthTokenHelper::rotate($refreshToken);
            return $this->successResponse($tokens, 'Token diperbarui');
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage() ?: 'Refresh token tidak berlaku', 401);
        }
    }
}
