<?php

namespace Database\Factories\OrderService;

use App\Models\OrderService\ServiceCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ServiceCategoryFactory extends Factory
{
    protected $model = ServiceCategory::class;

    public function definition(): array
    {
        return [
            'id'          => Str::uuid(),
            'code'        => 'CAT-' . strtoupper($this->faker->unique()->lexify('????')),
            'name'        => $this->faker->words(2, true),
            'description' => $this->faker->sentence,
            'is_active'   => $this->faker->boolean(90),
            'created_by'  => null,
            'updated_by'  => null,
        ];
    }
}
