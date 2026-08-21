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
       Schema::create('shifts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users'); // Siapa kasirnya
    $table->timestamp('start_time');
    $table->timestamp('end_time')->nullable();
    $table->integer('starting_cash')->default(0); // Modal awal receh
    $table->integer('expected_ending_cash')->default(0); // Hitungan sistem
    $table->integer('actual_ending_cash')->nullable(); // Setoran fisik
    $table->enum('status', ['open', 'closed'])->default('open');
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
 