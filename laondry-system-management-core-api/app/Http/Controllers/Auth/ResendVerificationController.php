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

class ResendVerificationController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:100'],
        ]);

        $user = User::where('email', $data['email'])->first();
        if (!$user) {
            return $this->errorResponse('User tidak ditemukan', 404);
        }

        if ($user->email_verified_at) {
            return $this->errorResponse('Email sudah terverifikasi', 400);
        }

        try {
            $otp = OtpHelper::issue($user->id, 'email_verification', 10);

            Mail::to($user->email)->send(new OtpCodeMail([
                'name' => $user->full_name,
                'code' => $otp->otp_code,
            ]));

            return $this->successResponse(
                ['send_to' => preg_replace('/(^.).*(@.*$)/', '$1***$2', $user->email)],
                'OTP verifikasi telah dikirim'
            );
        } catch (Throwable $e) {
            return $this->errorResponse('Gagal mengirim OTP', 500, $e->getMessage());
        }
    }
}
