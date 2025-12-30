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
        Schema::table('services', function (Blueprint $table) {
            $table->foreignUuid('workflow_template_id')->nullable()->after('icon_path');

            $table->index('workflow_template_id');
            $table->foreign('workflow_template_id')->references('id')->on('status_workflow_templates')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropForeign(['workflow_template_id']);
            $table->dropColumn('workflow_template_id');
        });
    }
};
