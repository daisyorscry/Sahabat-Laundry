<?php

namespace Database\Factories\OrderService;

use App\Models\OrderService\ServiceAddon;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ServiceAddonFactory extends Factory
{
    protected $model = ServiceAddon::class;

    public function definition(): array
    {
        return [
            'id'          => Str::uuid(),
            'service_id'  => null, // diisi saat seeding
            'addon_id'    => null, // diisi saat seeding
            'is_required' => $this->faker->boolean(20),
        ];
    }
}
