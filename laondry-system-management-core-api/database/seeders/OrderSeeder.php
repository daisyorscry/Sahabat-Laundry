<?php

namespace Database\Seeders;

use App\Models\Auth\User;
use App\Models\OrderService\Order;
use App\Models\OrderService\OrderItem;
use App\Models\OrderService\OrderItemAddon;
use App\Models\OrderService\OrderStatusLog;
use App\Models\OrderService\Outlet;
use App\Models\OrderService\Service;
use App\Models\OrderService\ServiceAddon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            $customers = User::whereHas('roles', function ($q) {
                $q->where('slug', 'customer');
            })->get();

            $outlets = Outlet::all();
            $services = Service::where('is_active', true)->get();
            $statuses = ['NEW', 'RECEIVED', 'WASHING', 'DRYING', 'IRONING', 'READY', 'DELIVERING', 'DONE', 'CANCELED'];
            $staff = User::whereHas('roles', function ($q) {
                $q->whereIn('slug', ['admin', 'karyawan', 'kasir']);
            })->first();

            if ($customers->isEmpty() || $outlets->isEmpty() || $services->isEmpty()) {
                $this->command->warn('Required data not found. Please seed Users, Outlets, and Services first.');
                return;
            }

            $orderCount = 0;
            $itemCount = 0;
            $addonCount = 0;
            $logCount = 0;

            // Create 30 orders with varying statuses
            for ($i = 0; $i < 30; $i++) {
                $customer = $customers->random();
                $outlet = $outlets->random();
                $orderType = fake()->randomElement(['DROPOFF', 'PICKUP']);
                $currentStatus = fake()->randomElement($statuses);

                // Calculate dates based on status
                $createdAt = fake()->dateTimeBetween('-60 days', 'now');
                $promisedAt = (clone $createdAt)->modify('+' . fake()->numberBetween(1, 7) . ' days');

                $orderId = Str::uuid();
                $orderNo = 'ORD-' . date('Ymd', $createdAt->getTimestamp()) . '-' . strtoupper(fake()->bothify('###???'));

                // Create order items first to calculate totals
                $numberOfItems = fake()->numberBetween(1, 5);
                $subtotal = 0;
                $totalWeight = 0;
                $totalPiece = 0;

                $orderItems = [];

                for ($j = 0; $j < $numberOfItems; $j++) {
                    $service = $services->random();
                    $pricingModel = $service->pricing_model;

                    $unitPrice = $service->base_price;
                    $weightKg = $pricingModel === 'weight' ? fake()->randomFloat(2, 0.5, 10) : null;
                    $qty = $pricingModel === 'piece' ? fake()->numberBetween(1, 10) : null;

                    $lineTotal = $pricingModel === 'weight'
                        ? $unitPrice * $weightKg
                        : $unitPrice * $qty;

                    $subtotal += $lineTotal;
                    if ($weightKg) $totalWeight += $weightKg;
                    if ($qty) $totalPiece += $qty;

                    $orderItems[] = [
                        'service' => $service,
                        'weight_kg' => $weightKg,
                        'qty' => $qty,
                        'unit_price' => $unitPrice,
                        'line_total' => $lineTotal,
                    ];
                }

                // Calculate order totals
                $discount = fake()->boolean(30) ? $subtotal * fake()->randomFloat(2, 0.05, 0.20) : 0;
                $tax = ($subtotal - $discount) * 0.11; // PPN 11%
                $deliveryFee = $orderType === 'PICKUP' ? fake()->randomElement([5000, 10000, 15000]) : 0;
                $grandTotal = ($subtotal - $discount) + $tax + $deliveryFee;

                // Create the order
                Order::create([
                    'id' => $orderId,
                    'customer_id' => $customer->id,
                    'outlet_id' => $outlet->id,
                    'status' => $currentStatus,
                    'order_no' => $orderNo,
                    'order_type' => $orderType,
                    'requested_pickup_at' => $orderType === 'PICKUP'
                        ? fake()->dateTimeBetween($createdAt, '+3 days')
                        : null,
                    'promised_at' => $promisedAt,
                    'pickup_address' => $orderType === 'PICKUP' ? fake()->address : null,
                    'delivery_address' => fake()->address,
                    'total_weight' => $totalWeight,
                    'total_piece' => $totalPiece,
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'tax' => $tax,
                    'delivery_fee' => $deliveryFee,
                    'grand_total' => $grandTotal,
                    'external_invoice_id' => fake()->optional(0.3)->uuid(),
                    'external_payment_id' => fake()->optional(0.3)->uuid(),
                    'notes' => fake()->optional(0.4)->sentence(),
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                    'created_by' => $staff->id ?? $customer->id,
                    'updated_by' => $staff->id ?? $customer->id,
                ]);
                $orderCount++;

                // Create order items
                foreach ($orderItems as $itemData) {
                    $orderItem = OrderItem::create([
                        'id' => Str::uuid(),
                        'order_id' => $orderId,
                        'service_id' => $itemData['service']->id,
                        'service_code' => $itemData['service']->code,
                        'service_name' => $itemData['service']->name,
                        'weight_kg' => $itemData['weight_kg'],
                        'qty' => $itemData['qty'],
                        'unit_price' => $itemData['unit_price'],
                        'line_total' => $itemData['line_total'],
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]);
                    $itemCount++;

                    // Add random addons to some items (40% chance)
                    if (fake()->boolean(40)) {
                        $serviceAddons = ServiceAddon::where('service_id', $itemData['service']->id)
                            ->with('addon')
                            ->get();

                        if ($serviceAddons->isNotEmpty()) {
                            $numberOfAddons = fake()->numberBetween(1, min(3, $serviceAddons->count()));

                            foreach ($serviceAddons->random(min($numberOfAddons, $serviceAddons->count())) as $serviceAddon) {
                                $addonQty = fake()->numberBetween(1, 3);
                                $addonUnitPrice = $serviceAddon->addon->price;
                                $addonLineTotal = $addonQty * $addonUnitPrice;

                                OrderItemAddon::create([
                                    'id' => Str::uuid(),
                                    'order_item_id' => $orderItem->id,
                                    'addon_id' => $serviceAddon->addon->id,
                                    'addon_code' => $serviceAddon->addon->code,
                                    'addon_name' => $serviceAddon->addon->name,
                                    'qty' => $addonQty,
                                    'unit_price' => $addonUnitPrice,
                                    'line_total' => $addonLineTotal,
                                    'created_at' => $createdAt,
                                    'updated_at' => $createdAt,
                                ]);
                                $addonCount++;
                            }
                        }
                    }
                }

                // Create order status log based on current status
                $statusProgression = ['NEW', 'RECEIVED', 'WASHING', 'DRYING', 'IRONING', 'READY', 'DELIVERING', 'DONE'];
                $currentStatusIndex = array_search($currentStatus, $statusProgression);

                if ($currentStatusIndex === false) {
                    // If canceled, just log initial to canceled
                    OrderStatusLog::create([
                        'id' => Str::uuid(),
                        'order_id' => $orderId,
                        'from_status' => null,
                        'to_status' => 'NEW',
                        'changed_by' => $staff->id ?? $customer->id,
                        'note' => 'Order created',
                        'changed_at' => $createdAt,
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]);
                    $logCount++;

                    OrderStatusLog::create([
                        'id' => Str::uuid(),
                        'order_id' => $orderId,
                        'from_status' => 'NEW',
                        'to_status' => 'CANCELED',
                        'changed_by' => $staff->id ?? $customer->id,
                        'note' => fake()->optional(0.7)->sentence(),
                        'changed_at' => fake()->dateTimeBetween($createdAt, 'now'),
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]);
                    $logCount++;
                } else {
                    // Log all status transitions up to current status
                    $previousStatus = null;
                    $logTime = clone $createdAt;

                    for ($k = 0; $k <= $currentStatusIndex; $k++) {
                        $toStatus = $statusProgression[$k];

                        OrderStatusLog::create([
                            'id' => Str::uuid(),
                            'order_id' => $orderId,
                            'from_status' => $previousStatus,
                            'to_status' => $toStatus,
                            'changed_by' => $staff->id ?? $customer->id,
                            'note' => $k === 0 ? 'Order created' : fake()->optional(0.3)->sentence(),
                            'changed_at' => $logTime,
                            'created_at' => $logTime,
                            'updated_at' => $logTime,
                        ]);
                        $logCount++;

                        $previousStatus = $toStatus;
                        // Add random time between status changes (1-24 hours)
                        $logTime = (clone $logTime)->modify('+' . fake()->numberBetween(1, 24) . ' hours');
                    }
                }
            }

            $this->command->info("✓ Seeded {$orderCount} orders");
            $this->command->info("✓ Seeded {$itemCount} order items");
            $this->command->info("✓ Seeded {$addonCount} order item addons");
            $this->command->info("✓ Seeded {$logCount} order status logs");
        });
    }
}
