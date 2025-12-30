<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('order_statuses', function (Blueprint $table) {
            $table->string('color', 7)->nullable()->after('name')->comment('Hex color code for UI');
            $table->string('icon', 50)->nullable()->after('color')->comment('Icon name/class');
            $table->text('description')->nullable()->after('icon');
            $table->boolean('is_visible_to_customer')->default(true)->after('is_final');

            $table->index('is_visible_to_customer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_statuses', function (Blueprint $table) {
            $table->dropColumn(['color', 'icon', 'description', 'is_visible_to_customer']);
        });
    }
};
