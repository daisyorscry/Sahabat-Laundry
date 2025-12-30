<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_otps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->index();

            $table->string('purpose', 50)->index();
            $table->string('otp_code', 10);

            $table->timestamp('expired_at')->index();
            $table->unsignedSmallInteger('attempt_count')->default(0);

            $table->timestamp('invalidated_at')->nullable()->index();
            $table->timestamp('used_at')->nullable()->index();

            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'purpose', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_otps');
    }
};
