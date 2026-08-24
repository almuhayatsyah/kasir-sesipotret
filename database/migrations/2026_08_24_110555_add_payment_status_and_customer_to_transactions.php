<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->enum('payment_status', ['paid', 'pending'])->default('paid')->after('change');
            $table->string('customer_name')->nullable()->after('payment_status');
        });

        // Make payment columns nullable for pending orders
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->change();
            $table->integer('amount_paid')->default(0)->change();
            $table->integer('change')->default(0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'customer_name']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->enum('payment_method', ['cash', 'qris'])->default('cash')->change();
            $table->integer('amount_paid')->change();
            $table->integer('change')->default(0)->change();
        });
    }
};
