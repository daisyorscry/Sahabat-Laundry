<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_prices', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('service_id');
            $t->foreignUuid('outlet_id');
            $t->string('member_tier', 50)->nullable();
            $t->decimal('price', 12, 2);
            $t->date('effective_start');
            $t->date('effective_end')->nullable();
            $t->boolean('is_express')->default(false);
            $t->timestampsTz();

            $t->unique(['service_id', 'outlet_id', 'member_tier', 'is_express', 'effective_start'], 'uniq_price_span');
            $t->index(['service_id', 'outlet_id', 'member_tier', 'is_express', 'effective_start', 'effective_end'], 'idx_price_lookup');

            $t->foreign('service_id')->references('id')->on('services')->cascadeOnUpdate()->cascadeOnDelete();
            $t->foreign('outlet_id')->references('id')->on('outlets')->cascadeOnUpdate()->cascadeOnDelete();
        });

        // CHECK (effective_end IS NULL OR effective_end >= effective_start)
        DB::statement("ALTER TABLE service_prices ADD CONSTRAINT chk_service_price_span CHECK (effective_end IS NULL OR effective_end >= effective_start)");
    }
    public function down(): void
    {
        Schema::dropIfExists('service_prices');
    }
};
