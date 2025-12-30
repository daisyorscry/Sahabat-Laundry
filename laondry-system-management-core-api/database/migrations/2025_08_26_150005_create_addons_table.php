<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('addons', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('code', 50)->unique();
            $t->string('name', 120);
            $t->text('description')->nullable();
            $t->decimal('price', 12, 2)->default(0);
            $t->boolean('is_active')->default(true);
            $t->string('icon_path', 255)->nullable();

            $t->timestampsTz();
            $t->softDeletesTz();

            $t->index('is_active');
            $t->index('deleted_at');

            $t->foreignUuid('created_by')->references('id')->on('users')->cascadeOnUpdate()->nullOnDelete();
            $t->foreignUuid('updated_by')->references('id')->on('users')->cascadeOnUpdate()->nullOnDelete();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('addons');
    }
};