<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Auth\User;
use App\Models\OrderService\Service;
use App\Models\OrderService\ServicePrice;
use App\Models\OrderService\ServiceCategory;
use App\Models\OrderService\Outlet;
use App\Models\Membership\MemberTier;

class ServicePriceTest extends TestCase
{
    use RefreshDatabase;

    protected $dummyUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Run migrations
        $this->artisan('migrate:fresh');

        // Create a dummy user for created_by/updated_by fields
        $this->dummyUser = User::factory()->create();
    }

    /** @test */
    public function it_resolves_exact_member_tier_price_over_base_price()
    {
        // Arrange: Create test data
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

        $goldTier = MemberTier::create([
            'code' => 'GOLD',
            'name' => 'Gold Member',
            'discount_percentage' => 10,
            'is_active' => true,
            'priority' => 3,
        ]);

        // Create base price (no tier)
        ServicePrice::create([
            'service_id' => $service->id,
            'outlet_id' => $outlet->id,
            'member_tier' => null,
            'price' => 10000,
            'is_express' => false,
            'effective_start' => now()->subDays(10),
            'effective_end' => null,
        ]);

        // Create GOLD tier price (discounted)
        ServicePrice::create([
            'service_id' => $service->id,
            'outlet_id' => $outlet->id,
            'member_tier' => 'GOLD',
            'price' => 9000, // 10% discount
            'is_express' => false,
            'effective_start' => now()->subDays(10),
            'effective_end' => null,
        ]);

        // Act: Resolve price for GOLD member
        $resolvedPrice = ServicePrice::resolvePrice(
            $service->id,
            $outlet->id,
            now(),
            'GOLD',
            false
        );

        // Assert: Should get GOLD tier price (9000), not base price (10000)
        $this->assertNotNull($resolvedPrice);
        $this->assertEquals(9000, $resolvedPrice->price);
        $this->assertEquals('GOLD', $resolvedPrice->member_tier);
    }

    /** @test */
    public function it_fallbacks_to_base_price_when_member_tier_not_found()
    {
        // Arrange
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

        // Only create base price (no tier)
        ServicePrice::create([
            'service_id' => $service->id,
            'outlet_id' => $outlet->id,
            'member_tier' => null,
            'price' => 10000,
            'is_express' => false,
            'effective_start' => now()->subDays(10),
            'effective_end' => null,
        ]);

        // Act: Try to resolve SILVER tier (doesn't exist)
        $resolvedPrice = ServicePrice::resolvePrice(
            $service->id,
            $outlet->id,
            now(),
            'SILVER',
            false
        );

        // Assert: Should fallback to base price
        $this->assertNotNull($resolvedPrice);
        $this->assertEquals(10000, $resolvedPrice->price);
        $this->assertNull($resolvedPrice->member_tier);
    }

    /** @test */
    public function it_resolves_express_price_correctly()
    {
        // Arrange
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
            'pricing_model' => 'weight',
            'base_price' => 10000,
            'is_express_available' => true,
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

        $goldTier = MemberTier::create([
            'code' => 'GOLD',
            'name' => 'Gold Member',
            'discount_percentage' => 10,
            'is_active' => true,
            'priority' => 3,
        ]);

        // Regular price
        ServicePrice::create([
            'service_id' => $service->id,
            'outlet_id' => $outlet->id,
            'member_tier' => 'GOLD',
            'price' => 9000,
            'is_express' => false,
            'effective_start' => now()->subDays(10),
            'effective_end' => null,
        ]);

        // Express price (20% higher, then 10% discount)
        ServicePrice::create([
            'service_id' => $service->id,
            'outlet_id' => $outlet->id,
            'member_tier' => 'GOLD',
            'price' => 10800, // 12000 * 0.9
            'is_express' => true,
            'effective_start' => now()->subDays(10),
            'effective_end' => null,
        ]);

        // Act: Resolve express price
        $resolvedPrice = ServicePrice::resolvePrice(
            $service->id,
            $outlet->id,
            now(),
            'GOLD',
            true // express
        );

        // Assert
        $this->assertNotNull($resolvedPrice);
        $this->assertEquals(10800, $resolvedPrice->price);
        $this->assertTrue($resolvedPrice->is_express);
    }

    /** @test */
    public function it_returns_null_when_no_price_found()
    {
        // Arrange
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

        // Don't create any service price

        // Act
        $resolvedPrice = ServicePrice::resolvePrice(
            $service->id,
            $outlet->id,
            now(),
            'GOLD',
            false
        );

        // Assert: Should return null
        $this->assertNull($resolvedPrice);
    }

    /** @test */
    public function it_respects_effective_date_range()
    {
        // Arrange
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

        // Old price (expired)
        ServicePrice::create([
            'service_id' => $service->id,
            'outlet_id' => $outlet->id,
            'member_tier' => null,
            'price' => 8000,
            'is_express' => false,
            'effective_start' => now()->subDays(30),
            'effective_end' => now()->subDays(10), // Expired
        ]);

        // Current price
        ServicePrice::create([
            'service_id' => $service->id,
            'outlet_id' => $outlet->id,
            'member_tier' => null,
            'price' => 10000,
            'is_express' => false,
            'effective_start' => now()->subDays(5),
            'effective_end' => null,
        ]);

        // Act
        $resolvedPrice = ServicePrice::resolvePrice(
            $service->id,
            $outlet->id,
            now(),
            null,
            false
        );

        // Assert: Should get current price, not expired one
        $this->assertNotNull($resolvedPrice);
        $this->assertEquals(10000, $resolvedPrice->price);
    }
}
