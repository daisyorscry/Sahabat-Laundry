<?php

namespace Database\Factories\Auth;

use App\Models\Auth\LoginAttempt;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class LoginAttemptFactory extends Factory
{
    protected $model = LoginAttempt::class;

    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'user_id' => null,
            'phone_number' => $this->faker->numerify('08##########'),
            'success' => false,
            'ip_address' => $this->faker->ipv4,
            'user_agent' => $this->faker->userAgent,
            'device_type' => $this->faker->randomElement(['mobile', 'desktop', 'tablet']),
            'platform' => $this->faker->randomElement(['Windows', 'macOS', 'Android', 'iOS']),
            'browser' => $this->faker->randomElement(['Chrome', 'Firefox', 'Safari']),
            'attempted_at' => now(),
        ];
    }
}
