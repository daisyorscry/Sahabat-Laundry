<?php

namespace Database\Factories;

use App\Models\OrderService\OrderStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderStatusFactory extends Factory
{
    protected $model = OrderStatus::class;

    public function definition(): array
    {
        $statuses = ['NEW', 'CONFIRMED', 'PROCESSING', 'WASHING', 'DRYING', 'IRONING', 'PACKED', 'READY', 'DONE', 'CANCELED'];

        return [
            'code' => $this->faker->unique()->randomElement($statuses),
            'name' => $this->faker->words(2, true),
            'is_final' => $this->faker->boolean(20),
        ];
    }

    /**
     * Indicate that the status is final
     */
    public function final(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_final' => true,
        ]);
    }
}
