<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. products: category jadi string (minuman|makanan), tambah sub_category & ice_only
        Schema::table('products', function (Blueprint $table) {
            $table->string('category', 20)->default('minuman')->change();
            $table->string('sub_category', 20)->nullable()->after('category');
            $table->boolean('ice_only')->default(false)->after('sub_category');
        });

        // Migrasi data lama: coffee / non-coffee -> minuman + sub_category
        DB::table('products')->whereIn('category', ['coffee', 'non-coffee'])->update([
            'sub_category' => DB::raw('category'),
            'category'     => 'minuman',
        ]);

        // 2. Varian harga Hot / Ice per produk
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->enum('temperature', ['hot', 'ice']);
            $table->integer('price');
            $table->timestamps();

            $table->unique(['product_id', 'temperature']);
        });

        // 3. Simpan pilihan suhu pada detail transaksi
        Schema::table('transaction_details', function (Blueprint $table) {
            $table->string('temperature', 10)->nullable()->after('product_id');
        });
    }

    public function down(): void
    {
        Schema::table('transaction_details', function (Blueprint $table) {
            $table->dropColumn('temperature');
        });

        Schema::dropIfExists('product_variants');

        DB::table('products')->where('category', 'minuman')->whereNotNull('sub_category')
            ->update(['category' => DB::raw('sub_category')]);

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['sub_category', 'ice_only']);
        });
    }
};
