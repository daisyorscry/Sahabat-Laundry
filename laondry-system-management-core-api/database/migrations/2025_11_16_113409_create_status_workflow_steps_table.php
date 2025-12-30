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
        Schema::create('status_workflow_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workflow_template_id');
            $table->string('status_code', 30);
            $table->integer('step_order');
            $table->boolean('is_required')->default(true);
            $table->boolean('is_skippable')->default(false);
            $table->timestampsTz();

            $table->unique(['workflow_template_id', 'step_order'], 'uniq_workflow_step_order');
            $table->index(['workflow_template_id', 'status_code']);

            $table->foreign('workflow_template_id')->references('id')->on('status_workflow_templates')->cascadeOnDelete();
            $table->foreign('status_code')->references('code')->on('order_statuses')->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('status_workflow_steps');
    }
};
