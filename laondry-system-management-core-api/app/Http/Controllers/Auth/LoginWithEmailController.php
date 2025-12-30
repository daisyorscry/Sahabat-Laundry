<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginWithEmailRequest;
use App\Models\Auth\User;
use App\Traits\ApiResponse;
use App\Helpers\OtpHelper;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpCodeMail;
use Throwable;

class LoginWithEmailController extends Controller
{
    use ApiResponse;

    public function __invoke(LoginWithEmailRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return $this->errorResponse('Email atau password salah', 401);
        }

        if (!$user->is_active) {
            return $this->errorResponse($user->banned_reason ?? 'Akun kamu telah diblokir.', 403);
        }

        // issue OTP via helper (purpose: login, ttl 5 menit)
        $otp = OtpHelper::issue($user->id, 'login', 20);

        try {
            if (!empty($user->email)) {
                Mail::to($user->email)->send(new OtpCodeMail([
                    'name' => $user->full_name,
                    'code' => $otp->otp_code,
                ]));
            }
        } catch (Throwable $e) {
            // optional: log error, tapi response tetap 200 untuk UX
        }

        // optional: mask email di response
        $maskedEmail = $user->email
            ? preg_replace('/(^.).*(@.*$)/', '$1***$2', $user->email)
            : null;

        return $this->successResponse(
            ['send_to' => $maskedEmail],
            'OTP telah dikirim'
        );
    }
}
