<?php
// app/Http/Controllers/Auth/ResetPasswordController.php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use App\Models\Auth\User;
use App\Helpers\OtpHelper;
use App\Helpers\AuthTokenHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ResetPasswordController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'email'        => ['required','email','max:100'],
            'otp'          => ['required','digits:6'],
            'new_password' => ['required', Password::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        $user = User::where('email', $data['email'])->first();
        if (!$user) return $this->errorResponse('Invalid OTP or user', 422);

        $otpRow = OtpHelper::verify($user->id, 'reset_password', $data['otp']);
        if (!$otpRow) return $this->errorResponse('Invalid or expired OTP', 422);

        DB::transaction(function () use ($user, $data, $otpRow) {
            // ganti password
            $user->password_hash = Hash::make($data['new_password']);
            $user->save();

            // bump token_version + revoke semua refresh tokens
            AuthTokenHelper::revokeAllForUser($user, true);

            // tandaikan OTP terpakai
            $otpRow->used_at = now();
            $otpRow->save();
        });

        return $this->successResponse(null, 'Password updated');
    }
}
