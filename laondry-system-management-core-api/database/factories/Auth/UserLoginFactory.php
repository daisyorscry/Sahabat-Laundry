<?php

namespace Database\Factories\Auth;

use App\Models\Auth\UserLogin;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UserLoginFactory extends Factory
{
    protected $model = UserLogin::class;

    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'user_id' => null,
            'logged_in_at' => now(),
            'ip_address' => $this->faker->ipv4,
            'user_agent' => $this->faker->userAgent,
            'device_type' => $this->faker->randomElement(['mobile', 'desktop', 'tablet']),
            'platform' => $this->faker->randomElement(['Windows', 'macOS', 'iOS', 'Android', 'Linux']),
            'browser' => $this->faker->randomElement(['Chrome', 'Firefox', 'Safari', 'Edge']),
            'country' => $this->faker->country,
            'region' => $this->faker->state,
            'city' => $this->faker->city,
            'latitude' => $this->faker->latitude,
            'longitude' => $this->faker->longitude,
            'timezone' => $this->faker->timezone,
            'device_id' => Str::uuid(),
            'is_suspicious' => false,
        ];
    }
}
