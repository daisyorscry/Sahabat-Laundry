<?php

namespace Database\Seeders\OrderService;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\OrderService\Outlet;

class OutletSeeder extends Seeder
{
    public function run(): void
    {
        $userId = DB::table('users')->value('id');

        Outlet::factory()
            ->count(5)
            ->state([
                'created_by' => $userId, // nullable, will be null if no users yet
                'updated_by' => $userId,
            ])
            ->create();

        $this->command->info('✓ Seeded ' . Outlet::count() . ' outlets');
    }
}
