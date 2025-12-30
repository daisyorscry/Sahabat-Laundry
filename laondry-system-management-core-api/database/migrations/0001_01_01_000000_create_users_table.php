<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('full_name', 100);
            $table->string('email', 100)->unique()->nullable();
            $table->string('phone_number', 20)->unique()->nullable();

            $table->text('password_hash');
            $table->string('pin_hash')->nullable();

            $table->boolean('is_active')->default(true);
            $table->string('banned_reason')->nullable();
            $table->boolean('is_member')->default(false);
            $table->integer('token_version')->default(0);
            $table->decimal('balance', 12, 2)->default(0);
            $table->timestamp('email_verified_at')->nullable();
            $table->string('avatar_disk', 50)->nullable();
            $table->string('avatar_path')->nullable();

            $table->unsignedBigInteger('customer_status_id')->nullable();
            $table->foreign('customer_status_id')->references('id')->on('customer_statuses');
            $table->softDeletes();
            $table->timestamps();
        });
        Schema::create('user_logins', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');

            $table->timestamp('logged_in_at')->useCurrent();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->string('device_type')->nullable();
            $table->string('platform')->nullable();
            $table->string('browser')->nullable();

            $table->string('country')->nullable();
            $table->string('region')->nullable();
            $table->string('city')->nullable();
            $table->double('latitude')->nullable();
            $table->double('longitude')->nullable();
            $table->string('timezone')->nullable();

            $table->string('device_id')->nullable();

            $table->boolean('is_suspicious')->default(false);

            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });


        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
           $table->uuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('user_logins');
        Schema::dropIfExists('sessions');
    }

};
