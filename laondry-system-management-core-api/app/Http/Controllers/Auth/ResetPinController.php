<?php
// app/Http/Controllers/Auth/ResetPinController.php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use App\Models\Auth\User;
use App\Helpers\OtpHelper;
use App\Helpers\AuthTokenHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ResetPinController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'phone_number' => ['required','max:20'],
            'otp'          => ['required','digits:6'],
            'new_pin'      => ['required','digits_between:4,6'],
        ]);

        $user = User::where('phone_number', $data['phone_number'])->first();
        if (!$user) return $this->errorResponse('Invalid OTP or user', 422);

        $otpRow = OtpHelper::verify($user->id, 'reset_pin', $data['otp']);
        if (!$otpRow) return $this->errorResponse('Invalid or expired OTP', 422);

        DB::transaction(function () use ($user, $data, $otpRow) {
            // ganti PIN
            $user->pin_hash = Hash::make($data['new_pin']);
            $user->save();

            // bump token_version + revoke semua refresh tokens
            AuthTokenHelper::revokeAllForUser($user, true);

            // tandaikan OTP terpakai
            $otpRow->used_at = now();
            $otpRow->save();
        });

        return $this->successResponse(null, 'PIN updated');
    }
}
