<?php

namespace Database\Factories;

use App\Models\OrderService\OrderItemAddon;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderItemAddonFactory extends Factory
{
    protected $model = OrderItemAddon::class;

    public function definition(): array
    {
        $qty = $this->faker->numberBetween(1, 5);
        $unitPrice = $this->faker->randomFloat(2, 2000, 15000);
        $lineTotal = $qty * $unitPrice;

        return [
            'id' => Str::uuid(),
            'order_item_id' => null, // will be set in seeder
            'addon_id' => null, // will be set in seeder
            'addon_code' => 'ADD-' . strtoupper($this->faker->bothify('???##')),
            'addon_name' => $this->faker->words(2, true),
            'qty' => $qty,
            'unit_price' => $unitPrice,
            'line_total' => $lineTotal,
        ];
    }
}
