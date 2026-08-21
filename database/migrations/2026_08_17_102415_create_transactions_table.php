<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shift_id')->constrained('shifts')->cascadeOnDelete();
            $table->string('invoice_number')->unique();
            $table->enum('order_type', ['dine-in', 'takeaway'])->default('dine-in');
            $table->string('table_number')->nullable(); // Nomor meja (opsional)
            $table->enum('payment_method', ['cash', 'qris'])->default('cash');
            $table->integer('total_amount');    // Total sebelum bayar
            $table->integer('amount_paid');     // Uang yang dibayar
            $table->integer('change')->default(0); // Kembalian
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
