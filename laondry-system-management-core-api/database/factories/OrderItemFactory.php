<?php

namespace Database\Factories;

use App\Models\OrderService\OrderItem;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        $pricingModel = $this->faker->randomElement(['weight', 'piece']);
        $unitPrice = $this->faker->randomFloat(2, 5000, 50000);

        // If weight-based, generate weight_kg; if piece-based, generate qty
        $weightKg = $pricingModel === 'weight' ? $this->faker->randomFloat(2, 0.5, 10) : null;
        $qty = $pricingModel === 'piece' ? $this->faker->numberBetween(1, 10) : null;

        $lineTotal = $pricingModel === 'weight'
            ? $unitPrice * $weightKg
            : $unitPrice * $qty;

        return [
            'id' => Str::uuid(),
            'order_id' => null, // will be set in seeder
            'service_id' => null, // will be set in seeder
            'service_code' => 'SRV-' . strtoupper($this->faker->bothify('???##')),
            'service_name' => $this->faker->words(3, true),
            'weight_kg' => $weightKg,
            'qty' => $qty,
            'unit_price' => $unitPrice,
            'line_total' => $lineTotal,
        ];
    }

    /**
     * Indicate that the item is weight-based
     */
    public function weightBased(): static
    {
        return $this->state(function (array $attributes) {
            $weightKg = $this->faker->randomFloat(2, 0.5, 10);
            return [
                'weight_kg' => $weightKg,
                'qty' => null,
                'line_total' => $attributes['unit_price'] * $weightKg,
            ];
        });
    }

    /**
     * Indicate that the item is piece-based
     */
    public function pieceBased(): static
    {
        return $this->state(function (array $attributes) {
            $qty = $this->faker->numberBetween(1, 10);
            return [
                'weight_kg' => null,
                'qty' => $qty,
                'line_total' => $attributes['unit_price'] * $qty,
            ];
        });
    }
}
