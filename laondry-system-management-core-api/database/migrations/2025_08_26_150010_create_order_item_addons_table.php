<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_item_addons', function (Blueprint $t) {
            // properties
            $t->uuid('id')->primary();
            $t->foreignUuid('order_item_id');
            $t->foreignUuid('addon_id');
            $t->string('addon_code', 50);
            $t->string('addon_name', 120);
            $t->integer('qty')->default(1);
            $t->decimal('unit_price', 12, 2);
            $t->decimal('line_total', 12, 2);
            $t->timestampsTz();

            // index
            $t->unique(['order_item_id', 'addon_id', 'addon_code']);
            $t->index('order_item_id');
            $t->index('addon_id');
            $t->index('addon_code');

            // relasi
            $t->foreign('order_item_id')->references('id')->on('order_items')->cascadeOnUpdate()->cascadeOnDelete();
            $t->foreign('addon_id')->references('id')->on('addons')->cascadeOnUpdate()->restrictOnDelete();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('order_item_addons');
    }
};
