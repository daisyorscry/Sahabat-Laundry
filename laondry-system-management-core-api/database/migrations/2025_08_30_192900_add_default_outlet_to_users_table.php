<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->uuid('default_outlet_id')->nullable()->after('email');
            $t->foreign('default_outlet_id')
                ->references('id')
                ->on('outlets')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->dropForeign(['default_outlet_id']);
            $t->dropColumn('default_outlet_id');
        });
    }
};
