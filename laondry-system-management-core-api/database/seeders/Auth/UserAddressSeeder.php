<?php

namespace Database\Seeders\Auth;

use Illuminate\Database\Seeder;
use App\Models\Auth\User;
use App\Models\Auth\UserAddress;

class UserAddressSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        foreach ($users as $user) {
            UserAddress::factory()->create(['user_id' => $user->id]);
        }
    }
}
