<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('outlets', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('code', 50)->unique();
            $t->string('name', 150);
            $t->string('phone', 50)->nullable();
            $t->string('email', 150)->nullable();
            $t->string('address_line', 255)->nullable();
            $t->string('city', 100)->nullable();
            $t->string('province', 100)->nullable();
            $t->string('postal_code', 20)->nullable();
            $t->boolean('is_active')->default(true);

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
        Schema::dropIfExists('outlets');
    }
};
