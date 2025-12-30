<?php

namespace Database\Factories\Auth;

use App\Models\Auth\UserOtp;
use App\Models\Auth\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserOtpFactory extends Factory
{
    protected $model = UserOtp::class;

    public function definition(): array
    {
        return [
            // id otomatis dari HasUuids di model
            'user_id'        => User::factory(),
            'purpose'        => 'email_verification',         // default
            'otp_code'       => (string) random_int(100000, 999999),
            'expired_at'     => now()->addMinutes(10),
            'attempt_count'  => 0,
            'invalidated_at' => null,
            'used_at'        => null,
        ];
    }

    public function forPurpose(string $purpose): self
    {
        return $this->state(fn () => ['purpose' => $purpose]);
    }

    public function withCode(string $code): self
    {
        return $this->state(fn () => ['otp_code' => $code]);
    }

    public function expired(): self
    {
        return $this->state(fn () => ['expired_at' => now()->subMinute()]);
    }

    public function used(): self
    {
        return $this->state(fn () => ['used_at' => now()]);
    }

    public function invalidated(): self
    {
        return $this->state(fn () => ['invalidated_at' => now()]);
    }
}
