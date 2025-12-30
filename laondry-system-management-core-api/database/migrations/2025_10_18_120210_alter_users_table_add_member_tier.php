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
        Schema::table('users', function (Blueprint $table) {
            // Hapus kolom is_member lama
            $table->dropColumn('is_member');

            // Tambah foreign key ke member_tiers
            $table->unsignedBigInteger('member_tier_id')->nullable()->after('customer_status_id');
            $table->foreign('member_tier_id')->references('id')->on('member_tiers')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['member_tier_id']);
            $table->dropColumn('member_tier_id');

            // Kembalikan kolom is_member
            $table->boolean('is_member')->default(false);
        });
    }
};
