<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('service_categories', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('code', 50)->unique();
            $t->string('name', 100);
            $t->text('description')->nullable();
            $t->boolean('is_active')->default(true);

            $t->timestampsTz();
            $t->softDeletesTz();

            $t->index('is_active');
            $t->index('deleted_at');

            $t->foreignUuid('created_by')->references('id')->on('users')->cascadeOnUpdate()->nullOnDelete();
            $t->foreignUuid('updated_by')->references('id')->on('users')->cascadeOnUpdate()->nullOnDelete();
        });
    }
    public function down(): void { Schema::dropIfExists('service_categories'); }
};
