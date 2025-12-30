<?php

namespace Database\Seeders\Auth;

use Illuminate\Database\Seeder;
use App\Models\Auth\LoginAttempt;

class LoginAttemptSeeder extends Seeder
{
    public function run(): void
    {
        LoginAttempt::factory()->count(10)->create();
    }
}
