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
        Schema::table('service_prices', function (Blueprint $table) {
            // Add foreign key constraint: member_tier -> member_tiers.code
            // Note: member_tiers.code already has unique constraint from its migration
            $table->foreign('member_tier')
                ->references('code')
                ->on('member_tiers')
                ->onDelete('set null')  // Set to null if tier deleted
                ->onUpdate('cascade');  // Update if code changed
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_prices', function (Blueprint $table) {
            $table->dropForeign(['member_tier']);
        });
    }
};
