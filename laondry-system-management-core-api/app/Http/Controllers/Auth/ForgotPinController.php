<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use App\Models\Auth\User;
use App\Helpers\OtpHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\GenericOtpMail;
use Throwable;

class ForgotPinController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'phone_number' => ['required', 'max:20'],
        ]);

        try {
            $user = User::where('phone_number', $data['phone_number'])->first();

            if ($user) {
                $otp = OtpHelper::issue($user->id, 'reset_pin', 10);
                if (!empty($user->email)) {
                    Mail::to($user->email)->send(new GenericOtpMail($otp->otp_code, 'Reset PIN'));
                }
            }

            return $this->successResponse(null, 'If the phone is registered, an OTP has been sent.');
        } catch (Throwable $e) {
            return $this->errorResponse('Terjadi kesalahan saat mengirim OTP', 500, $e->getMessage());
        }
    }
}
