<?php

namespace App\Http\Controllers\Auth;

use App\Helpers\AuthTokenHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Auth\User;
use App\Models\Auth\UserLogin;
use App\Models\Auth\LoginAttempt;
use App\Models\Auth\RefreshToken;
use App\Traits\ApiResponse;
use App\Helpers\JwtHelper;
use App\Helpers\OtpHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Throwable;
use Carbon\Carbon;
use App\Mail\OtpCodeMail;

class LoginController extends Controller
{
    use ApiResponse;

    public function __invoke(LoginRequest $request)
    {
        $phone = $request->phone_number;

        $user = User::where('phone_number', $phone)->first();
        if (!$user) {
            return $this->errorResponse('Nomor telepon tidak ditemukan', 404);
        }

        if (!$user->is_active) {
            return $this->errorResponse($user->banned_reason ?? 'Akun kamu telah diblokir.', 403);
        }

        if (empty($user->email_verified_at)) {
            return $this->errorResponse(
                'Email kamu belum terverifikasi. Silakan login menggunakan email untuk verifikasi terlebih dahulu.',
                403
            );
        }
        // hitung percobaan gagal 24 jam terakhir
        $failedAttempts = LoginAttempt::where('phone_number', $phone)
            ->where('success', false)
            ->where('created_at', '>=', now()->subHours(24))
            ->count();

        if ($failedAttempts >= 5 && $user->is_active) {
            $user->update([
                'is_active' => false,
                'banned_reason' => 'Akun kamu telah diblokir karena terlalu banyak percobaan login yang gagal.',
            ]);
            return $this->errorResponse(
                'Akun kamu telah diblokir karena terlalu banyak percobaan login yang gagal.',
                403
            );
        }

        // validasi PIN
        if (!Hash::check($request->pin, $user->pin_hash)) {
            LoginAttempt::create([
                'user_id' => optional($user)->id,
                'phone_number' => $phone,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'device_type' => $request->header('X-Device-Type'),
                'platform' => $request->header('X-Platform'),
                'browser' => $request->header('X-Browser'),
                'success' => false,
                'attempted_at' => now(),
            ]);

            return $this->errorResponse('Nomor telepon atau PIN salah', 401);
        }

        // ...
        return DB::transaction(function () use ($request, $user) {
            $currentDeviceId = $request->header('X-Device-Id');

            // === 1) Deteksi perangkat: pernah tercatat untuk user ini atau belum? ===
            $isKnownDevice = UserLogin::where('user_id', $user->id)
                ->where('device_id', $currentDeviceId)
                ->exists();

            if (!$isKnownDevice) {
                // perangkat baru → kirim OTP, jangan lanjut login
                try {
                    $otp = OtpHelper::issue($user->id, 'login', 5);

                    if (!empty($user->email)) {
                        Mail::to($user->email)->send(new OtpCodeMail([
                            'name' => $user->full_name,
                            'code' => $otp->otp_code,
                        ]));
                    }
                } catch (Throwable $e) {
                    // optional: log $e
                }

                $maskedEmail = $user->email
                    ? preg_replace('/(^.).*(@.*$)/', '$1***$2', $user->email)
                    : null;

                return $this->successResponse([
                    'requires_otp' => true,
                    'message' => 'Perangkat baru terdeteksi. Masukkan OTP yang dikirim.',
                    'send_to' => $maskedEmail,
                ], 'OTP dikirim');
            }

            // === 2) Perangkat dikenal → jangan insert baris baru ===
            //     Gunakan updateOrCreate dengan key (user_id, device_id)
            UserLogin::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'device_id' => $currentDeviceId,
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

            // bersihkan attempt gagal
            LoginAttempt::where('phone_number', $user->phone_number)
                ->where('success', false)
                ->delete();

            $token = AuthTokenHelper::issue($user, $request);

            return $this->successResponse([
                'token' => $token,
                'user' => $user->only([
                    'id',
                    'full_name',
                    'email',
                    'phone_number',
                    'is_member'
                ]),
            ], 'Login berhasil');
        });

    }
}
