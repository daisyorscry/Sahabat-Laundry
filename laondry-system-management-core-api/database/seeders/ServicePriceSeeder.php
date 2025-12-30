<?php

namespace Database\Seeders;

use App\Models\OrderService\Service;
use App\Models\OrderService\ServicePrice;
use App\Models\OrderService\Outlet;
use App\Models\Membership\MemberTier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServicePriceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            $services = Service::all();
            $outlets = Outlet::all();
            $memberTiers = MemberTier::where('is_active', true)->orderBy('priority')->get();

            if ($services->isEmpty() || $outlets->isEmpty()) {
                $this->command->warn('Services or Outlets not found. Please seed them first.');
                return;
            }

            $count = 0;

            foreach ($services as $service) {
                foreach ($outlets as $outlet) {
                    // Base price for non-members (no tier)
                    ServicePrice::updateOrCreate(
                        [
                            'service_id' => $service->id,
                            'outlet_id' => $outlet->id,
                            'member_tier' => null,
                            'is_express' => false,
                            'effective_start' => now()->startOfMonth(),
                        ],
                        [
                            'price' => $service->base_price,
                            'effective_end' => null,
                        ]
                    );
                    $count++;

                    // Express price for non-members (20% higher)
                    if ($service->is_express_available) {
                        ServicePrice::updateOrCreate(
                            [
                                'service_id' => $service->id,
                                'outlet_id' => $outlet->id,
                                'member_tier' => null,
                                'is_express' => true,
                                'effective_start' => now()->startOfMonth(),
                            ],
                            [
                                'price' => $service->base_price * 1.2,
                                'effective_end' => null,
                            ]
                        );
                        $count++;
                    }

                    // Member tier prices (use discount_percentage from member_tiers table)
                    foreach ($memberTiers as $tier) {
                        $discountRate = $tier->discount_percentage / 100; // Convert percentage to decimal

                        // Regular price with member discount
                        ServicePrice::updateOrCreate(
                            [
                                'service_id' => $service->id,
                                'outlet_id' => $outlet->id,
                                'member_tier' => $tier->code,
                                'is_express' => false,
                                'effective_start' => now()->startOfMonth(),
                            ],
                            [
                                'price' => $service->base_price * (1 - $discountRate),
                                'effective_end' => null,
                            ]
                        );
                        $count++;

                        // Express price for members (20% higher, then apply discount)
                        if ($service->is_express_available) {
                            ServicePrice::updateOrCreate(
                                [
                                    'service_id' => $service->id,
                                    'outlet_id' => $outlet->id,
                                    'member_tier' => $tier->code,
                                    'is_express' => true,
                                    'effective_start' => now()->startOfMonth(),
                                ],
                                [
                                    'price' => $service->base_price * 1.2 * (1 - $discountRate),
                                    'effective_end' => null,
                                ]
                            );
                            $count++;
                        }
                    }
                }
            }

            $this->command->info("✓ Seeded {$count} service prices for " . $services->count() . " services across " . $outlets->count() . " outlets");
            $this->command->info("  - Member tiers used: " . $memberTiers->pluck('code')->join(', '));
        });
    }
}
