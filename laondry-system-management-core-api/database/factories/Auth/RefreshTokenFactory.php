<?php

namespace Database\Factories\Auth;

use App\Models\Auth\RefreshToken;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RefreshTokenFactory extends Factory
{
    protected $model = RefreshToken::class;

    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'user_id' => null, // will be set in seeder
            'jti' => Str::random(64),
            'device_id' => $this->faker->optional()->uuid(),
            'ip' => $this->faker->ipv4(),
            'ua' => $this->faker->userAgent(),
            'expires_at' => $this->faker->dateTimeBetween('+7 days', '+30 days'),
            'revoked_at' => $this->faker->optional(0.1)->dateTimeBetween('-7 days', 'now'),
        ];
    }

    /**
     * Indicate that the refresh token is revoked
     */
    public function revoked(): static
    {
        return $this->state(fn (array $attributes) => [
            'revoked_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
        ]);
    }

    /**
     * Indicate that the refresh token is active (not revoked)
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'revoked_at' => null,
            'expires_at' => $this->faker->dateTimeBetween('+1 day', '+30 days'),
        ]);
    }
}
