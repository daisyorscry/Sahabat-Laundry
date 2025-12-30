<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_addons', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('service_id');
            $t->foreignUuid('addon_id');
            $t->boolean('is_required')->default(false);
            $t->timestampsTz();

            $t->unique(['service_id', 'addon_id']);
            $t->index('service_id');
            $t->index('addon_id');

            $t->foreign('service_id')->references('id')->on('services')->cascadeOnUpdate()->cascadeOnDelete();
            $t->foreign('addon_id')->references('id')->on('addons')->cascadeOnUpdate()->cascadeOnDelete();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('service_addons');
    }
};
