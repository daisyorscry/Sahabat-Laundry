<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('services', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('category_id');
            $t->string('code', 50)->unique();
            $t->string('name', 150);
            $t->text('description')->nullable();
            $t->enum('pricing_model', ['weight', 'piece']);
            $t->decimal('base_price', 12, 2)->default(0);
            $t->decimal('min_qty', 8, 2)->default(0);
            $t->integer('est_duration_hours')->default(24);
            $t->boolean('is_express_available')->default(false);
            $t->boolean('is_active')->default(true);
            $t->string('icon_path', 255)->nullable();

            $t->timestampsTz();
            $t->softDeletesTz();

            $t->index('category_id');
            $t->index('pricing_model');
            $t->index('is_active');
            $t->index('deleted_at');

            $t->foreign('category_id')->references('id')->on('service_categories')->cascadeOnUpdate()->nullOnDelete();
            $t->foreignUuid('created_by')->references('id')->on('users')->cascadeOnUpdate()->nullOnDelete();
            $t->foreignUuid('updated_by')->references('id')->on('users')->cascadeOnUpdate()->nullOnDelete();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
