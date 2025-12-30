<?php

namespace Database\Factories;

use App\Models\OrderService\OrderStatusLog;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderStatusLogFactory extends Factory
{
    protected $model = OrderStatusLog::class;

    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'order_id' => null, // will be set in seeder
            'from_status' => $this->faker->optional(0.7)->randomElement(['NEW', 'RECEIVED', 'WASHING', 'DRYING']),
            'to_status' => $this->faker->randomElement(['RECEIVED', 'WASHING', 'DRYING', 'IRONING', 'READY']),
            'changed_by' => null, // will be set in seeder
            'note' => $this->faker->optional(0.3)->sentence(),
            'changed_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
