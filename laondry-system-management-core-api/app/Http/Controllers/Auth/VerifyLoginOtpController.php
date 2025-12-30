<?php

namespace App\Http\Controllers\Auth;

use App\Helpers\AuthTokenHelper;
use App\Http\Controllers\Controller;
use App\Models\Auth\User;
use App\Models\Auth\UserLogin;
use App\Models\Auth\RefreshToken;
use Carbon\Carbon;
use App\Traits\ApiResponse;
use App\Helpers\JwtHelper;
use App\Helpers\OtpHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\LoginNotificationMail;
use Throwable;

class VerifyLoginOtpController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'identity' => ['required'],
            'otp' => ['required', 'digits:6'],
        ]);

        // 1) pastikan device id ada
        $deviceId = $request->header('X-Device-Id');
        if (empty($deviceId)) {
            return $this->errorResponse('X-Device-Id wajib dikirim', 422);
        }

        $user = User::where('email', $data['identity'])
            ->orWhere('phone_number', $data['identity'])
            ->first();

        if (!$user) {
            return $this->errorResponse('User tidak ditemukan', 404);
        }

        $otpRow = OtpHelper::verify($user->id, 'login', $data['otp']);
        if (!$otpRow) {
            return $this->errorResponse('OTP tidak valid atau sudah kedaluwarsa', 400);
        }

        return DB::transaction(function () use ($user, $request, $otpRow, $deviceId) {
            // tandai verified & OTP terpakai
            if (empty($user->email_verified_at)) {
                $user->email_verified_at = now();
                $user->save();
            }

            $otpRow->used_at = now();
            $otpRow->save();

            // 2) catat login: satu baris per device, update field setiap login
            $userLogin = UserLogin::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'device_id' => $deviceId,
                ],
                [
                    'logged_in_at' => now(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'device_type' => $request->header('X-Device-Type'),
                    'platform' => $request->header('X-Platform'),
                    'browser' => $request->header('X-Browser'),
                    'country' => $request->header('X-Country'),
                    'city' => $request->header('X-City'),
                    'latitude' => $request->header('X-Latitude'),
                    'longitude' => $request->header('X-Longitude'),
                ]
            );

            // notif login (best-effort)
            try {
                if (!empty($user->email)) {
                    Mail::to($user->email)->send(new LoginNotificationMail([
                        'full_name' => $user->full_name,
                        'logged_in_at' => $userLogin->logged_in_at,
                        'ip_address' => $userLogin->ip_address,
                        'user_agent' => $userLogin->user_agent,
                        'device_type' => $userLogin->device_type,
                        'platform' => $userLogin->platform,
                        'browser' => $userLogin->browser,
                        'country' => $userLogin->country,
                        'city' => $userLogin->city,
                        'latitude' => $userLogin->latitude,
                        'longitude' => $userLogin->longitude,
                    ]));
                }
            } catch (Throwable $e) {
                // log jika perlu
            }

            $token = AuthTokenHelper::issue($user, $request);

            return $this->successResponse([
                'token' => $token,
                'user' => $user->only(['id', 'full_name', 'email', 'phone_number', 'is_member']),
            ], 'Login berhasil');
        });
    }
}
