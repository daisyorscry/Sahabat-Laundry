<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use App\Helpers\OtpHelper;
use App\Models\Auth\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpCodeMail;
use Throwable;

class ResendOtpController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'identity' => ['required', 'string', 'max:100'], // email atau phone
            'purpose' => ['required', 'in:login,device_verification,reset_password,reset_pin,email_verification'],
        ]);

        // Resolve user by email or phone
        $identity = $data['identity'];
        $user = str_contains($identity, '@')
            ? User::where('email', $identity)->first()
            : User::where('phone_number', $identity)->first();

        // Anti-enumeration: balas sukses walau user tidak ada
        if (!$user) {
            return $this->successResponse(null, 'OTP dikirim jika akun terdaftar');
        }

        // Khusus email_verification: kalau sudah verified, hentikan
        if ($data['purpose'] === 'email_verification' && $user->email_verified_at) {
            return $this->errorResponse('Email sudah terverifikasi', 400);
        }

        // TTL per purpose
        $ttlMap = [
            'login' => 5,
            'device_verification' => 5,
            'reset_password' => 10,
            'reset_pin' => 10,
            'email_verification' => 10,
        ];
        $ttl = $ttlMap[$data['purpose']] ?? 5;

        try {
            $otp = OtpHelper::issue($user->id, $data['purpose'], $ttl);

            // kirim via email (sesuai implementasi lu saat ini)
            if (!empty($user->email)) {
                Mail::to($user->email)->send(new OtpCodeMail([
                    'name' => $user->full_name,
                    'code' => $otp->otp_code,
                ]));
            }

            $maskedEmail = $user->email
                ? preg_replace('/(^.).*(@.*$)/', '$1***$2', $user->email)
                : null;

            return $this->successResponse(
                [
                    'purpose' => $data['purpose'],
                    'send_to' => $maskedEmail,
                    'ttl_mins' => $ttl,
                ],
                'OTP dikirim'
            );
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengirim OTP', 500, $e->getMessage());
        }
    }
}
