<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('order_id');
            $t->foreignUuid('service_id');
            $t->string('service_code', 50);
            $t->string('service_name', 150);

            $t->decimal('weight_kg', 8, 2)->nullable();
            $t->integer('qty')->nullable();

            $t->decimal('unit_price', 12, 2);
            $t->decimal('line_total', 12, 2);

            $t->timestampsTz();

            $t->index('order_id');
            $t->index('service_id');
            $t->index('service_code');

            $t->foreign('order_id')->references('id')->on('orders')->cascadeOnUpdate()->cascadeOnDelete();
            $t->foreign('service_id')->references('id')->on('services')->cascadeOnUpdate()->restrictOnDelete();
        });

        DB::statement("ALTER TABLE order_items ADD CONSTRAINT chk_item_qty CHECK ((weight_kg IS NOT NULL AND weight_kg > 0) OR (qty IS NOT NULL AND qty > 0))");
    }
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};


