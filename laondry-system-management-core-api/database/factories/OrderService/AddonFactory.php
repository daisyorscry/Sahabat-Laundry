<?php

namespace Database\Factories\OrderService;

use App\Models\OrderService\Addon;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Helpers\DummyImage;

class AddonFactory extends Factory
{
    protected $model = Addon::class;

    public function definition(): array
    {
        return [
            'id'          => Str::uuid(),
            'code'        => 'ADD-' . strtoupper($this->faker->unique()->bothify('???##')),
            'name'        => $this->faker->word,
            'description' => $this->faker->optional()->sentence,
            'price'       => $this->faker->randomFloat(2, 2000, 15000),
            'is_active'   => $this->faker->boolean(95),
            'icon_path'   => DummyImage::create('addons', 200, 200, 'technics'),
            'created_by'  => null,
            'updated_by'  => null,
        ];
    }
}
