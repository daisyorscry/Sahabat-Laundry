<?php

namespace Database\Factories\OrderService;

use App\Models\OrderService\Service;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Helpers\DummyImage;

class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        return [
            'id'                  => Str::uuid(),
            'category_id'         => null, // diisi saat seeding
            'code'                => 'SRV-' . strtoupper($this->faker->unique()->bothify('???##')),
            'name'                => $this->faker->words(3, true),
            'description'         => $this->faker->optional()->sentence,
            'pricing_model'       => $this->faker->randomElement(['weight', 'piece']),
            'base_price'          => $this->faker->randomFloat(2, 5000, 50000),
            'min_qty'             => $this->faker->randomFloat(1, 1, 5),
            'est_duration_hours'  => $this->faker->numberBetween(12, 72),
            'is_express_available' => $this->faker->boolean(30),
            'is_active'           => true,
            'icon_path'           => DummyImage::create('service', 200, 200, 'technics'),
            'created_by'          => null,
            'updated_by'          => null,
        ];
    }
}
