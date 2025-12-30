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
        Schema::create('status_transitions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('from_status', 30);
            $table->string('to_status', 30);
            $table->text('condition')->nullable()->comment('Optional condition logic');
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();

            $table->unique(['from_status', 'to_status'], 'uniq_status_transition');
            $table->index('is_active');

            $table->foreign('from_status')->references('code')->on('order_statuses')->cascadeOnUpdate();
            $table->foreign('to_status')->references('code')->on('order_statuses')->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('status_transitions');
    }
};
