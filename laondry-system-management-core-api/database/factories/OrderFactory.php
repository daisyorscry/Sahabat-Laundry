<?php

namespace Database\Factories;

use App\Models\OrderService\Order;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = $this->faker->randomFloat(2, 20000, 500000);
        $discount = $this->faker->randomFloat(2, 0, $subtotal * 0.2); // max 20% discount
        $tax = ($subtotal - $discount) * 0.11; // PPN 11%
        $deliveryFee = $this->faker->randomElement([0, 5000, 10000, 15000]);
        $grandTotal = ($subtotal - $discount) + $tax + $deliveryFee;

        $orderType = $this->faker->randomElement(['DROPOFF', 'PICKUP']);

        return [
            'id' => Str::uuid(),
            'customer_id' => null, // will be set in seeder
            'outlet_id' => null, // will be set in seeder
            'status' => 'NEW',
            'order_no' => 'ORD-' . date('Ymd') . '-' . strtoupper($this->faker->unique()->bothify('###???')),
            'order_type' => $orderType,
            'requested_pickup_at' => $orderType === 'PICKUP'
                ? $this->faker->dateTimeBetween('now', '+3 days')
                : null,
            'promised_at' => $this->faker->dateTimeBetween('+1 day', '+7 days'),
            'pickup_address' => $orderType === 'PICKUP'
                ? $this->faker->address
                : null,
            'delivery_address' => $this->faker->address,
            'total_weight' => $this->faker->randomFloat(2, 1, 50),
            'total_piece' => $this->faker->numberBetween(1, 20),
            'subtotal' => $subtotal,
            'discount' => $discount,
            'tax' => $tax,
            'delivery_fee' => $deliveryFee,
            'grand_total' => $grandTotal,
            'external_invoice_id' => $this->faker->optional(0.3)->uuid(),
            'external_payment_id' => $this->faker->optional(0.3)->uuid(),
            'notes' => $this->faker->optional(0.4)->sentence(),
            'created_by' => null, // will be set in seeder
            'updated_by' => null,
        ];
    }

    /**
     * Indicate that the order is for pickup type
     */
    public function pickup(): static
    {
        return $this->state(fn (array $attributes) => [
            'order_type' => 'PICKUP',
            'requested_pickup_at' => $this->faker->dateTimeBetween('now', '+3 days'),
            'pickup_address' => $this->faker->address,
        ]);
    }

    /**
     * Indicate that the order is for dropoff type
     */
    public function dropoff(): static
    {
        return $this->state(fn (array $attributes) => [
            'order_type' => 'DROPOFF',
            'requested_pickup_at' => null,
            'pickup_address' => null,
        ]);
    }

    /**
     * Indicate that the order has a specific status
     */
    public function withStatus(string $status): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => $status,
        ]);
    }
}
