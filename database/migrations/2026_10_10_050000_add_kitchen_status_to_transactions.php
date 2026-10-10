<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // antri = sudah bayar, sedang dikerjakan barista/dapur
            // selesai = kasir konfirmasi sudah jadi & diantar
            $table->enum('kitchen_status', ['antri', 'selesai'])
                  ->default('antri')
                  ->after('payment_status');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('kitchen_status');
        });
    }
};
