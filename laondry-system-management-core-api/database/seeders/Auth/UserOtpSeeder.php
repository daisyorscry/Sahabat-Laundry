<?php

namespace Database\Seeders\Auth;

use Illuminate\Database\Seeder;
use App\Models\Auth\User;
use App\Models\Auth\UserOtp;

class UserOtpSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        foreach ($users as $user) {
            UserOtp::factory()->create(['user_id' => $user->id]);
        }
    }
}
