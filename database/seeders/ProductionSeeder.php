<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        // ─────────────────────────────────────────────────────
        // 1. USER ADMIN — Kasir Sesi Potret
        //    (ganti name/email/password sesuai kebutuhan)
        // ─────────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'kasir@sesipotret.com'],
            [
                'name'     => 'Admin Sesi Potret',
                'password' => Hash::make('SesiPotret2024!'),
            ]
        );

        $this->command->info('✅ User admin berhasil dibuat: kasir@sesipotret.com');

        // ─────────────────────────────────────────────────────
        // 2. SEEDER MENU MINUMAN & MAKANAN RESMI
        // ─────────────────────────────────────────────────────
        $this->call([
            MinumanSeeder::class,
            MakananSeeder::class,
        ]);

        $this->command->info('🎉 Production seeding selesai! Seluruh menu kasir Sesi Potret siap digunakan.');
    }
}
