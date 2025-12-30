<?php
// app/Http/Controllers/Auth/ForgotPasswordController.php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use App\Models\Auth\User;
use App\Helpers\OtpHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\GenericOtpMail;
use Throwable;

class ForgotPasswordController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:100'],
        ]);

        try {
            $user = User::where('email', $data['email'])->first();

            if ($user) {
                $otp = OtpHelper::issue($user->id, 'reset_password', 10);
                if (!empty($user->email)) {
                    Mail::to($user->email)->send(new GenericOtpMail($otp->otp_code, 'Reset Password'));
                }
            }

            return $this->successResponse(null, 'If the email is registered, an OTP has been sent.');
        } catch (Throwable $e) {
            return $this->errorResponse('Terjadi kesalahan saat mengirim OTP', 500, $e->getMessage());
        }
    }
}
