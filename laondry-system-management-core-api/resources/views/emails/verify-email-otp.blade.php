{{-- resources/views/emails/verify-email-otp.blade.php --}}
<p>Halo {{ $name }},</p>
<p>Kode verifikasi email kamu: <strong>{{ $code }}</strong></p>
<p>Berlaku sampai: {{ \Illuminate\Support\Carbon::parse($expiredAt)->toDateTimeString() }}</p>
<p>Jangan bagikan kode ini ke siapa pun.</p>
