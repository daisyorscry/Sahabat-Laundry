<?php

namespace Database\Factories\OrderService;

use App\Models\OrderService\ServicePrice;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ServicePriceFactory extends Factory
{
    protected $model = ServicePrice::class;

    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('-1 month', 'now');
        return [
            'id'              => Str::uuid(),
            'service_id'      => null,
            'outlet_id'       => null,
            'member_tier'     => $this->faker->optional()->randomElement(['REGULAR', 'VIP']),
            'price'           => $this->faker->randomFloat(2, 5000, 70000),
            'effective_start' => $start,
            'effective_end'   => $this->faker->boolean(20) ? $this->faker->dateTimeBetween($start, '+1 year') : null,
            'is_express'      => $this->faker->boolean(20),
        ];
    }
}
