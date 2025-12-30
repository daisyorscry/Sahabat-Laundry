<?php

namespace Database\Factories\Auth;

use App\Models\Auth\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        // Random assign member tier (30% chance untuk dapat tier)
        $memberTierIds = \App\Models\Membership\MemberTier::pluck('id')->toArray();
        $hasMemberTier = $this->faker->boolean(30);

        return [
            'id' => Str::uuid(),
            'full_name' => $this->faker->name,
            'email' => $this->faker->unique()->safeEmail,
            'phone_number' => $this->faker->unique()->numerify('08##########'),
            'password_hash' => bcrypt('password'),
            'pin_hash' => bcrypt('1234'),
            'is_active' => true,
            'member_tier_id' => $hasMemberTier && count($memberTierIds) > 0 ? $this->faker->randomElement($memberTierIds) : null,
            'balance' => $this->faker->randomFloat(2, 0, 500000),
            'customer_status_id' => null,
        ];
    }
}
