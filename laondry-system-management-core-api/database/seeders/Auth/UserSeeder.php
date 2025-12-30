<?php

namespace Database\Seeders\Auth;

use Illuminate\Database\Seeder;
use App\Models\Auth\User;
use App\Models\Auth\Role;
use App\Models\Auth\CustomerStatus;
use App\Models\Membership\MemberTier;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $status = CustomerStatus::inRandomOrder()->first();

        User::factory()->count(10)->create([
            'customer_status_id' => CustomerStatus::inRandomOrder()->first()->id,
        ]);

        // Admin user with no member tier (admin biasanya ga perlu member tier)
        $user = User::factory()->create([
            'full_name' => 'Daisy Tester',
            'email' => 'daisyorscry@gmail.com',
            'phone_number' => '081234567890',
            'password_hash' => Hash::make('Daisyorscry123^'),
            'pin_hash' => Hash::make('123456'),
            'is_active' => true,
            'member_tier_id' => null,  // Admin ga perlu member tier
            'balance' => 100000,
            'customer_status_id' => $status->id,
        ]);

        $role = Role::where('slug', 'admin')->first();
        $user->roles()->attach($role->id);
    }


}
