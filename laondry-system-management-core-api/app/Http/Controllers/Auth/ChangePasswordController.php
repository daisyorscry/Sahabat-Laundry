<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;
use Throwable;

class ChangePasswordController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required'],
            'new_password' => ['required', Password::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        $user = $request->user(); // dari auth.jwt

        if (!Hash::check($data['current_password'], $user->password_hash)) {
            return $this->errorResponse('Password lama salah', 401);
        }

        try {
            DB::transaction(function () use ($user, $data) {
                $user->password_hash = Hash::make($data['new_password']);
                if (isset($user->token_version)) {
                    $user->token_version = ($user->token_version ?? 0) + 1;
                }
                $user->save();
            });

            return $this->successResponse(null, 'Password berhasil diubah');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengubah password', 500, $e->getMessage());
        }
    }
}
