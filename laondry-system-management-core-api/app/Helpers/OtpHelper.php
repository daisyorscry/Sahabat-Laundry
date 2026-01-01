<?php
namespace App\Helpers;

use App\Models\Auth\UserOtp;
use Carbon\Carbon;

class OtpHelper
{
    /**
     * Terbitkan OTP baru dan invalidasi OTP aktif untuk purpose yang sama.
     */
    public static function issue(int|string $userId, string $purpose, int $ttlMinutes = 10): UserOtp
    {
        // Invalidasi OTP aktif sebelumnya untuk purpose yang sama
        UserOtp::where('user_id', $userId)
            ->where('purpose', $purpose)
            ->whereNull('used_at')
            ->whereNull('invalidated_at')
            ->update(['invalidated_at' => now()]);

        // Jika OTP dinonaktifkan, gunakan default 999999
        $otpEnabled = config('app.otp_enable', true);
        $otp = $otpEnabled
            ? str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT)
            : '999999';

        return UserOtp::create([
            'user_id' => $userId,
            'purpose' => $purpose,               // contoh: email_verification
            'otp_code' => $otp,                   // simpan plaintext; bisa di-hash kalau perlu
            'expired_at' => Carbon::now()->addMinutes($ttlMinutes),
            'attempt_count' => 0,
            'invalidated_at' => null,
            'used_at' => null,
        ]);
    }

    /**
     * Verifikasi OTP: valid, belum expired, belum used/invalidated.
     * Return row OTP jika valid, null jika tidak.
     */
    public static function verify(int|string $userId, string $purpose, string $code): ?UserOtp
    {
        $row = UserOtp::where('user_id', $userId)
            ->where('purpose', $purpose)
            ->whereNull('used_at')
            ->whereNull('invalidated_at')
            ->where('expired_at', '>', now())
            ->latest('created_at') // hindari orderBy id untuk UUID
            ->first();

        if (!$row) {
            return null;
        }

        // Rate limit percobaan
        if (($row->attempt_count ?? 0) >= 5) {
            return null;
        }

        // Bandingkan kode
        if (trim((string) $row->otp_code) !== trim((string) $code)) {
            // increment hanya saat salah
            $row->increment('attempt_count');
            return null;
        }

        // Valid
        return $row;
    }

    /**
     * Opsional: invalidasi semua OTP aktif untuk purpose ini.
     */
    public static function invalidateOthers(int|string $userId, string $purpose): void
    {
        UserOtp::where('user_id', $userId)
            ->where('purpose', $purpose)
            ->whereNull('used_at')
            ->whereNull('invalidated_at')
            ->update(['invalidated_at' => now()]);
    }
}
