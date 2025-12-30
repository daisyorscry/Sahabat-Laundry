<?php

namespace Database\Seeders;

use App\Models\OrderService\Service;
use App\Models\OrderService\Addon;
use App\Models\OrderService\ServiceAddon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServiceAddonSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            $services = Service::all();
            $addons = Addon::all();

            if ($services->isEmpty() || $addons->isEmpty()) {
                $this->command->warn('Services or Addons not found. Please seed them first.');
                return;
            }

            $count = 0;

            // Define realistic service-addon relationships
            // For laundry business logic:
            // - Some addons are common (perfume, fabric softener)
            // - Some are specific to certain service types (express for most services)

            $commonAddonCodes = ['ADD-PERF', 'ADD-SOFT', 'ADD-ANTI']; // Common addons for all services

            foreach ($services as $service) {
                // Add common addons to all services
                foreach ($addons as $addon) {
                    $isCommon = false;
                    foreach ($commonAddonCodes as $code) {
                        if (str_contains($addon->code, substr($code, 4))) {
                            $isCommon = true;
                            break;
                        }
                    }

                    // Express addon only for services that support express
                    $isExpress = str_contains(strtoupper($addon->name), 'EXPRESS') ||
                                 str_contains(strtoupper($addon->name), 'KILAT');

                    if ($isExpress && !$service->is_express_available) {
                        continue; // Skip express addon for non-express services
                    }

                    // Randomly add 30-50% of addons to each service
                    $shouldAdd = $isCommon || $isExpress || fake()->boolean(30);

                    if ($shouldAdd) {
                        ServiceAddon::updateOrCreate(
                            [
                                'service_id' => $service->id,
                                'addon_id' => $addon->id,
                            ],
                            [
                                'is_required' => $isCommon ? fake()->boolean(10) : false,
                            ]
                        );
                        $count++;
                    }
                }
            }

            $this->command->info("✓ Seeded {$count} service-addon relationships for " . $services->count() . " services");
        });
    }
}
