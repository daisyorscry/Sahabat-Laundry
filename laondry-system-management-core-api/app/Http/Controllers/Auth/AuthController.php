<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Auth\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use ApiResponse;

    public function me(Request $request)
    {
        $userId = $request->auth_user_id;

        $user = User::with([
            'roles:id,slug,name',
        ])->find($userId);

        if (!$user) {
            return $this->errorResponse('User tidak ditemukan.', 404);
        }

        return $this->successResponse([
            'id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'phone_number' => $user->phone_number,
            'is_active' => $user->is_active,
            'is_member' => $user->is_member,
            'balance' => $user->balance,
            'positions' => $user->staffPositions->pluck('position'),
            'roles' => $user->roles->pluck('slug'),
            'address' => $user->addresses->isNotEmpty() ? $user->addresses->first()->address : null,
            'customer_status' => optional($user->customerStatus)->description,
        ]);
    }
}
