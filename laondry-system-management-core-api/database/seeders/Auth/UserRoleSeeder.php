<?php

namespace Database\Seeders\Auth;

use Illuminate\Database\Seeder;
use App\Models\Auth\User;
use App\Models\Auth\Role;
use App\Models\Auth\UserRole;
use Illuminate\Support\Str;

class UserRoleSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        $roles = Role::pluck('id');

        foreach ($users as $user) {
            UserRole::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'role_id' => $roles->random(),
            ]);
        }
    }
}
