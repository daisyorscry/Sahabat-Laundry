<?php

namespace Database\Factories\OrderService;

use App\Models\OrderService\Outlet;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OutletFactory extends Factory
{
    protected $model = Outlet::class;

    public function definition(): array
    {
        return [
            'id'           => Str::uuid(),
            'code'         => 'OUT-' . strtoupper($this->faker->unique()->bothify('???##')),
            'name'         => $this->faker->company . ' Laundry',
            'phone'        => $this->faker->phoneNumber,
            'email'        => $this->faker->safeEmail,
            'address_line' => $this->faker->streetAddress,
            'city'         => $this->faker->city,
            'province'     => $this->faker->state,
            'postal_code'  => $this->faker->postcode,
            'is_active'    => true,
            'created_by'   => null,
            'updated_by'   => null,
        ];
    }
}
