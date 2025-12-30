<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_statuses', function (Blueprint $t) {
            $t->string('code', 30)->primary();
            $t->string('name', 80);
            $t->boolean('is_final')->default(false);
            $t->timestampsTz();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('order_statuses');
    }
};
