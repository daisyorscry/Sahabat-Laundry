<?php

namespace Tests\Feature\Mobile;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Auth\User;
use App\Models\OrderService\Service;
use App\Models\OrderService\ServicePrice;
use App\Models\OrderService\ServiceCategory;
use App\Models\OrderService\Outlet;
use App\Models\Membership\MemberTier;
use Laravel\Sanctum\Sanctum;

class ServiceControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $dummyUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh');

        // Create a dummy user for created_by/updated_by fields
        $this->dummyUser = User::factory()->create();
    }

    /** @test */
    public function it_returns_services_with_member_tier_price()
    {
        // Arrange
        $goldTier = MemberTier::create([
            'code' => 'GOLD',
            'name' => 'Gold Member',
            'discount_percentage' => 10,
            'is_active' => true,
            'priority' => 3,
        ]);

        $user = User::factory()->create([
            'member_tier_id' => $goldTier->id,
        ]);

        $category = ServiceCategory::create([
            'code' => 'WASH',
            'name' => 'Washing',
            'created_by' => $this->dummyUser->id,
            'updated_by' => $this->dummyUser->id,
        ]);

        $service = Service::create([
            'code' => 'WASH-REG',
            'category_id' => $category->id,
            'name' => 'Regular Wash',
            'description' => 'Regular washing service',
            'pricing_model' => 'weight',
            'base_price' => 10000,
            'is_express_available' => false,
            'is_active' => true,
            'created_by' => $this->dummyUser->id,
            'updated_by' => $this->dummyUser->id,
        ]);

        $outlet = Outlet::create([
            'code' => 'OUT-001',
            'name' => 'Outlet Central',
            'city' => 'Jakarta',
            'is_active' => true,
            'created_by' => $this->dummyUser->id,
            'updated_by' => $this->dummyUser->id,
        ]);

        // Base price
        ServicePrice::create([
            'service_id' => $service->id,
            'outlet_id' => $outlet->id,
            'member_tier' => null,
            'price' => 10000,
            'is_express' => false,
            'effective_start' => now()->subDays(10),
            'effective_end' => null,
        ]);

        // GOLD tier price (10% discount)
        ServicePrice::create([
            'service_id' => $service->id,
            'outlet_id' => $outlet->id,
            'member_tier' => 'GOLD',
            'price' => 9000,
            'is_express' => false,
            'effective_start' => now()->subDays(10),
            'effective_end' => null,
        ]);

        // Act
        Sanctum::actingAs($user);
        $response = $this->getJson('/api/v1/mobile/services?outlet_id=' . $outlet->id);

        // Assert
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'items' => [
                    '*' => [
                        'id',
                        'name',
                        'base_price',
                        'service_price' => [
                            'id',
                            'outlet_id',
                            'member_tier',
                            'unit_price',
                            'is_express',
                        ],
                    ],
                ],
            ],
        ]);

        $items = $response->json('data.items');
        $this->assertNotEmpty($items);

        $firstItem = $items[0];
        $this->assertEquals(10000, $firstItem['base_price']);
        $this->assertNotNull($firstItem['service_price']);
        $this->assertEquals(9000, $firstItem['service_price']['unit_price']);
        $this->assertEquals('GOLD', $firstItem['service_price']['member_tier']);
    }

    /** @test */
    public function it_returns_base_outlet_price_when_user_has_no_tier()
    {
        // Arrange
        $user = User::factory()->create([
            'member_tier_id' => null, // No tier
        ]);

        $category = ServiceCategory::create([
            'code' => 'WASH',
            'name' => 'Washing',
            'created_by' => $this->dummyUser->id,
            'updated_by' => $this->dummyUser->id,
        ]);

        $service = Service::create([
            'code' => 'WASH-REG',
            'category_id' => $category->id,
            'name' => 'Regular Wash',
            'description' => 'Regular washing service',
            'pricing_model' => 'weight',
            'base_price' => 10000,
            'is_express_available' => false,
            'is_active' => true,
            'created_by' => $this->dummyUser->id,
            'updated_by' => $this->dummyUser->id,
        ]);

        $outlet = Outlet::create([
            'code' => 'OUT-001',
            'name' => 'Outlet Central',
            'city' => 'Jakarta',
            'is_active' => true,
            'created_by' => $this->dummyUser->id,
            'updated_by' => $this->dummyUser->id,
        ]);

        // Base price
        ServicePrice::create([
            'service_id' => $service->id,
            'outlet_id' => $outlet->id,
            'member_tier' => null,
            'price' => 10000,
            'is_express' => false,
            'effective_start' => now()->subDays(10),
            'effective_end' => null,
        ]);

        // Act
        Sanctum::actingAs($user);
        $response = $this->getJson('/api/v1/mobile/services?outlet_id=' . $outlet->id);

        // Assert
        $response->assertStatus(200);
        $items = $response->json('data.items');
        $this->assertNotEmpty($items);

        $firstItem = $items[0];
        $this->assertEquals(10000, $firstItem['base_price']);
        $this->assertNotNull($firstItem['service_price']);
        $this->assertEquals(10000, $firstItem['service_price']['unit_price']);
        $this->assertNull($firstItem['service_price']['member_tier']);
    }

    /** @test */
    public function it_returns_services_without_service_price_when_no_outlet_provided()
    {
        // Arrange
        $user = User::factory()->create();

        $category = ServiceCategory::create([
            'code' => 'WASH',
            'name' => 'Washing',
            'created_by' => $this->dummyUser->id,
            'updated_by' => $this->dummyUser->id,
        ]);

        $service = Service::create([
            'code' => 'WASH-REG',
            'category_id' => $category->id,
            'name' => 'Regular Wash',
            'description' => 'Regular washing service',
            'pricing_model' => 'weight',
            'base_price' => 10000,
            'is_express_available' => false,
            'is_active' => true,
            'created_by' => $this->dummyUser->id,
            'updated_by' => $this->dummyUser->id,
        ]);

        // Act
        Sanctum::actingAs($user);
        $response = $this->getJson('/api/v1/mobile/services'); // No outlet_id

        // Assert
        $response->assertStatus(200);
        $items = $response->json('data.items');
        $this->assertNotEmpty($items);

        $firstItem = $items[0];
        $this->assertEquals(10000, $firstItem['base_price']);
        $this->assertArrayNotHasKey('service_price', $firstItem); // No service_price without outlet
    }
}
