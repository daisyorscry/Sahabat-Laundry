<?php

// app/Mail/VerifyEmailOtpMail.php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Auth\User;

class VerifyEmailOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public string $code, public $expiredAt)
    {
    }

    public function build()
    {
        return $this->subject('Kode Verifikasi Email')
            ->view('emails.verify-email-otp')
            ->with([
                'name' => $this->user->full_name,
                'code' => $this->code,
                'expiredAt' => $this->expiredAt,
            ]);
    }
}
