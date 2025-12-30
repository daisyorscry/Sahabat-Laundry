<?php

namespace Database\Factories\Auth;

use App\Models\Auth\StaffPosition;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class StaffPositionFactory extends Factory
{
    protected $model = StaffPosition::class;

    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'user_id' => null,
            'position' => $this->faker->randomElement(['washing', 'ironing', 'folding', 'packing']),
        ];
    }
}
