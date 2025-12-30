<?php

namespace Database\Seeders\Auth;

use Illuminate\Database\Seeder;
use App\Models\Auth\CustomerStatus;

class CustomerStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            ['code' => 'active', 'description' => 'Pelanggan aktif'],
            ['code' => 'inactive', 'description' => 'Tidak aktif'],
            ['code' => 'banned', 'description' => 'Akun diblokir'],
            ['code' => 'premium', 'description' => 'Member premium'],
        ];

        foreach ($statuses as $status) {
            CustomerStatus::create($status);
        }
    }
}
