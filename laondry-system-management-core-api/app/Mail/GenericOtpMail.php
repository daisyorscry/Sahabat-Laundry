<?php
// app/Mail/GenericOtpMail.php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class GenericOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $otp, public string $subjectLine = 'OTP')
    {
    }

    public function build()
    {
        return $this->subject($this->subjectLine)
            ->view('emails.generic-otp')
            ->with(['otp' => $this->otp, 'subjectLine' => $this->subjectLine]);
    }
}
