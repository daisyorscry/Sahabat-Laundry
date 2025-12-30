<?php

namespace Database\Factories\Auth;

use App\Models\Auth\CustomerStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerStatusFactory extends Factory
{
    protected $model = CustomerStatus::class;

    public function definition(): array
    {
        return [
            'code' => $this->faker->unique()->randomElement(['active', 'inactive', 'banned', 'premium']),
            'description' => $this->faker->sentence,
        ];
    }
}
