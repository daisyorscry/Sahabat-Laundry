<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('customer_id');
            $t->foreignUuid('outlet_id');
            $t->string('status', 30)->default('NEW');
            $t->string('order_no', 30)->unique();
            $t->enum('order_type', ['DROPOFF', 'PICKUP'])->default('DROPOFF');
            $t->timestampTz('requested_pickup_at')->nullable();
            $t->timestampTz('promised_at')->nullable();
            $t->string('pickup_address', 255)->nullable();
            $t->string('delivery_address', 255)->nullable();

            $t->decimal('total_weight', 8, 2)->default(0);
            $t->integer('total_piece')->default(0);

            $t->decimal('subtotal', 12, 2)->default(0);
            $t->decimal('discount', 12, 2)->default(0);
            $t->decimal('tax', 12, 2)->default(0);
            $t->decimal('delivery_fee', 12, 2)->default(0);
            $t->decimal('grand_total', 12, 2)->default(0);

            $t->string('external_invoice_id', 100)->nullable();
            $t->string('external_payment_id', 100)->nullable();

            $t->text('notes')->nullable();


            $t->timestampsTz();
            $t->softDeletesTz();

            $t->index('customer_id');
            $t->index('outlet_id');
            $t->index('deleted_at');
            $t->index('created_at');

            $t->foreign('customer_id')->references('id')->on('users')->cascadeOnUpdate()->restrictOnDelete();
            $t->foreign('outlet_id')->references('id')->on('outlets')->cascadeOnUpdate()->restrictOnDelete();
            $t->foreign('status')->references('code')->on('order_statuses')->cascadeOnUpdate();
            $t->foreignUuid('created_by')->references('id')->on('users')->cascadeOnUpdate()->nullOnDelete();
            $t->foreignUuid('updated_by')->references('id')->on('users')->cascadeOnUpdate()->nullOnDelete();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
