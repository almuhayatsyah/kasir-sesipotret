<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MenuSesipotretSeeder extends Seeder
{
    public function run(): void
    {
        $menus = [
            // ── Mie ──────────────────────────────────────
            ['name' => 'Mie Rebus Aceh Telur',         'price' => 20000],
            ['name' => 'Mie Aceh Goreng Telur',         'price' => 20000],
            ['name' => 'Mie Aceh Seafood',              'price' => 28000],
            ['name' => 'Indomie Rebus Telur',           'price' => 22000],
            ['name' => 'Indomie Goreng Telur',          'price' => 22000],
            ['name' => 'Indomie Seafood',               'price' => 30000],
            ['name' => 'Indomie Daging',                'price' => 28000],

            // ── Nasi Goreng ───────────────────────────────
            ['name' => 'Nasi Goreng Kampung Spesial',   'price' => 30000],
            ['name' => 'Nasi Goreng Aceh Komplit',      'price' => 32000],
            ['name' => 'Nasi Goreng Ayam Penyet',       'price' => 28000],
            ['name' => 'Nasi Goreng Telur',             'price' => 22000],
            ['name' => 'Nasi Goreng Seafood',           'price' => 28000],

            // ── Aneka Nasi ────────────────────────────────
            ['name' => 'Nasi Ayam Penyet',              'price' => 25000],
            ['name' => 'Nasi Ayam Geprek',              'price' => 27000],
            ['name' => 'Nasi Ayam Sambal Ijo',          'price' => 25000],

            // ── Menu Premium (harga belum ada → 0) ───────
            ['name' => 'Seafood Saos Padang',           'price' => 0],
            ['name' => 'Nasi Ikan Bakar',               'price' => 0],

            // ── Snack ─────────────────────────────────────
            ['name' => 'Roti Coklat Goreng',            'price' => 17000],
            ['name' => 'Tempe Goreng Crispy',           'price' => 20000],
            ['name' => 'Kentang Goreng',                'price' => 18000],
            ['name' => 'Dimsum',                        'price' => 0],     // harga belum ada
            ['name' => 'Churros',                       'price' => 18000],
            ['name' => 'Roti Burger Daging / Telur',    'price' => 25000],
            ['name' => 'Roti Burger Telur',             'price' => 22000],
            ['name' => 'Piscok',                        'price' => 15000],
            ['name' => 'Nugget',                        'price' => 15000],
            ['name' => 'Sosis',                         'price' => 15000],
            ['name' => 'Mix Platter',                   'price' => 15000],
            ['name' => 'Pudding Mangga / Coklat',       'price' => 20000],
        ];

        foreach ($menus as $menu) {
            DB::table('products')->insert([
                'name'       => $menu['name'],
                'category'   => 'makanan',
                'price'      => $menu['price'],
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('✅ ' . count($menus) . ' menu Sesi Potret berhasil dimasukkan!');
    }
}
