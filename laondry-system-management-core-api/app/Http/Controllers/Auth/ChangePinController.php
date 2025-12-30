<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Throwable;

class ChangePinController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'current_pin' => ['required', 'digits_between:4,6'],
            'new_pin' => ['required', 'digits_between:4,6'],
        ]);

        $user = $request->user();

        if (!Hash::check($data['current_pin'], $user->pin_hash)) {
            return $this->errorResponse('PIN lama salah', 401);
        }

        try {
            DB::transaction(function () use ($user, $data) {
                $user->pin_hash = Hash::make($data['new_pin']);
                if (isset($user->token_version)) {
                    $user->token_version = ($user->token_version ?? 0) + 1;
                }
                $user->save();
            });

            return $this->successResponse(null, 'PIN berhasil diubah');
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengubah PIN', 500, $e->getMessage());
        }
    }
}
