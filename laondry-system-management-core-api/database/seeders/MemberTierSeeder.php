<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MemberTierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tiers = [
            [
                'code' => 'BRONZE',
                'name' => 'Bronze Member',
                'description' => 'Tier awal untuk member baru',
                'min_spending' => 0,
                'discount_percentage' => 0,
                'benefits' => ['Akses ke promo spesial', 'Poin reward'],
                'is_active' => true,
                'priority' => 1,
            ],
            [
                'code' => 'SILVER',
                'name' => 'Silver Member',
                'description' => 'Tier menengah dengan benefit lebih banyak',
                'min_spending' => 500000,
                'discount_percentage' => 5,
                'benefits' => ['Diskon 5%', 'Free pickup 1x/bulan', 'Priority service'],
                'is_active' => true,
                'priority' => 2,
            ],
            [
                'code' => 'GOLD',
                'name' => 'Gold Member',
                'description' => 'Tier premium dengan benefit maksimal',
                'min_spending' => 2000000,
                'discount_percentage' => 10,
                'benefits' => ['Diskon 10%', 'Free pickup unlimited', 'Express priority', 'Birthday promo'],
                'is_active' => true,
                'priority' => 3,
            ],
            [
                'code' => 'PLATINUM',
                'name' => 'Platinum Member',
                'description' => 'Tier VIP dengan benefit eksklusif',
                'min_spending' => 5000000,
                'discount_percentage' => 15,
                'benefits' => ['Diskon 15%', 'Free pickup unlimited', 'Express priority', 'Birthday promo', 'Dedicated CS'],
                'is_active' => true,
                'priority' => 4,
            ],
        ];

        foreach ($tiers as $tier) {
            \App\Models\Membership\MemberTier::updateOrCreate(
                ['code' => $tier['code']],
                $tier
            );
        }
    }
}
