<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrderStatusesSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['code' => 'NEW', 'name' => 'New', 'is_final' => false],
            ['code' => 'RECEIVED', 'name' => 'Received at Outlet', 'is_final' => false],
            ['code' => 'WASHING', 'name' => 'Washing', 'is_final' => false],
            ['code' => 'DRYING', 'name' => 'Drying', 'is_final' => false],
            ['code' => 'IRONING', 'name' => 'Ironing', 'is_final' => false],
            ['code' => 'READY', 'name' => 'Ready to Pickup/Deliver', 'is_final' => false],
            ['code' => 'DELIVERING', 'name' => 'Delivering', 'is_final' => false],
            ['code' => 'DONE', 'name' => 'Done', 'is_final' => true],
            ['code' => 'CANCELED', 'name' => 'Canceled', 'is_final' => true],
        ];

        foreach ($rows as $r) {
            DB::table('order_statuses')->updateOrInsert(['code' => $r['code']], $r);
        }
    }
}
