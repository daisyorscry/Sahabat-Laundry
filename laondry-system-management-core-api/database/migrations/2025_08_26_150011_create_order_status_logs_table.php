<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_status_logs', function (Blueprint $t) {
            $t->uuid('id')->primary();

            // kolom relasi
            $t->foreignUuid('order_id');
            $t->string('from_status', 30)->nullable();
            $t->string('to_status', 30);
            $t->foreignUuid('changed_by')->nullable();

            // data lainnya
            $t->text('note')->nullable();
            $t->timestampTz('changed_at')->useCurrent();
            $t->timestampsTz();

            // index
            $t->index('order_id');
            $t->index('to_status');
            $t->index('changed_at');

            // foreign keys
            $t->foreign('order_id')
                ->references('id')->on('orders')
                ->cascadeOnUpdate()->cascadeOnDelete();

            $t->foreign('from_status')
                ->references('code')->on('order_statuses')
                ->cascadeOnUpdate();

            $t->foreign('to_status')
                ->references('code')->on('order_statuses')
                ->cascadeOnUpdate();

            $t->foreign('changed_by')
                ->references('id')->on('users')
                ->cascadeOnUpdate()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_status_logs');
    }
};
