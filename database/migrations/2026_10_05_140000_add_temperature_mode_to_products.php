<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // both = Hot & Ice | hot = hanya Hot | ice = hanya Ice | single = 1 harga tanpa suhu
        Schema::table('products', function (Blueprint $table) {
            $table->string('temperature_mode', 10)->default('both')->after('sub_category');
        });

        DB::table('products')->where('ice_only', true)->update(['temperature_mode' => 'ice']);

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('ice_only');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('ice_only')->default(false)->after('sub_category');
        });

        DB::table('products')->where('temperature_mode', 'ice')->update(['ice_only' => true]);

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('temperature_mode');
        });
    }
};
