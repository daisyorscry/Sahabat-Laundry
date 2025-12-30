<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Database\Seeders\Auth\CustomerStatusSeeder;
use Database\Seeders\MemberTierSeeder;
use Database\Seeders\Auth\RoleSeeder;
use Database\Seeders\Auth\UserSeeder;
use Database\Seeders\Auth\UserRoleSeeder;
use Database\Seeders\Auth\UserAddressSeeder;
use Database\Seeders\Auth\UserOtpSeeder;
use Database\Seeders\Auth\StaffPositionSeeder;
use Database\Seeders\Auth\UserLoginSeeder;
use Database\Seeders\Auth\LoginAttemptSeeder;
use Database\Seeders\OrderService\OutletSeeder;
use Database\Seeders\OrderService\ServiceCategorySeeder;
use Database\Seeders\OrderService\ServiceSeeder;
use Database\Seeders\OrderService\AddonSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * IMPORTANT: Seeders are run in order of foreign key dependencies.
     * Do not change the order unless you understand the relationships.
     */
    public function run(): void
    {
        $this->command->info('🌱 Starting database seeding...');
        $this->command->newLine();

        // ===================================================================
        // PHASE 1: BASE REFERENCE DATA (No Dependencies)
        // ===================================================================
        $this->command->info('📦 Phase 1: Base Reference Data');

        $this->call([
            RoleSeeder::class,              // No dependencies
            CustomerStatusSeeder::class,    // No dependencies
            OrderStatusesSeeder::class,     // No dependencies (order_statuses table)
            MemberTierSeeder::class,
        ]);

        $this->command->newLine();

        // ===================================================================
        // PHASE 2: USERS FIRST (Before Outlets to break circular dependency)
        // ===================================================================
        $this->command->info('📦 Phase 2: Users (Core)');

        $this->call([
            UserSeeder::class,              // Depends on: customer_statuses, roles
            UserRoleSeeder::class,          // Depends on: users, roles
        ]);

        $this->command->newLine();

        // ===================================================================
        // PHASE 3: OUTLETS (After users, so created_by can be set)
        // ===================================================================
        $this->command->info('📦 Phase 3: Outlets');

        $this->call([
            OutletSeeder::class,            // Depends on: users (for created_by/updated_by)
        ]);

        $this->command->newLine();

        // ===================================================================
        // PHASE 4: USER DETAILS (After outlets for default_outlet_id)
        // ===================================================================
        $this->command->info('📦 Phase 4: User Details');

        $this->call([
            UserAddressSeeder::class,       // Depends on: users
            StaffPositionSeeder::class,     // Depends on: users
            UserOtpSeeder::class,           // Depends on: users
            UserLoginSeeder::class,         // Depends on: users
            LoginAttemptSeeder::class,      // Depends on: users (nullable)
        ]);

        $this->command->newLine();

        // ===================================================================
        // PHASE 5: SERVICE CATALOG (After users for created_by/updated_by)
        // ===================================================================
        $this->command->info('📦 Phase 5: Service Catalog');

        $this->call([
            ServiceCategorySeeder::class,   // Depends on: users (for created_by)
            ServiceSeeder::class,           // Depends on: service_categories, users
            AddonSeeder::class,             // Depends on: users (for created_by)
        ]);

        $this->command->newLine();

        // ===================================================================
        // PHASE 6: SERVICE RELATIONSHIPS (After services and addons)
        // ===================================================================
        $this->command->info('📦 Phase 6: Service Relationships');

        $this->call([
            ServiceAddonSeeder::class,      // Depends on: services, addons
            ServicePriceSeeder::class,      // Depends on: services, outlets
        ]);

        $this->command->newLine();

        // ===================================================================
        // PHASE 7: ORDERS & ORDER FLOW (After all dependencies)
        // ===================================================================
        $this->command->info('📦 Phase 7: Orders & Transactions');

        $this->call([
            OrderSeeder::class,             // Depends on: users, outlets, services, order_statuses
                                           // Also creates: order_items, order_item_addons, order_status_logs
        ]);

        $this->command->newLine();
        $this->command->info('✅ Database seeding completed successfully!');
    }
}
