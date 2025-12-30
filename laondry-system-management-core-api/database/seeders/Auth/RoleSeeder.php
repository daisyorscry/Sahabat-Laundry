<?php

namespace Database\Seeders\Auth;

use Illuminate\Database\Seeder;
use App\Models\Auth\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['slug' => 'superadmin', 'name' => 'Super Admin'],
            ['slug' => 'admin', 'name' => 'Admin'],
            ['slug' => 'customer', 'name' => 'Customer'],
            ['slug' => 'karyawan', 'name' => 'Karyawan'],
            ['slug' => 'kasir', 'name' => 'Kasir'],
            ['slug' => 'kurir', 'name' => 'Kurir'],
            ['slug' => 'cs', 'name' => 'Customer Service'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], ['name' => $role['name']]);
        }
    }
}
