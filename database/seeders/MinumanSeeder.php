<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MinumanSeeder extends Seeder
{
    public function run(): void
    {
        $menus = [
            // ── Coffee ───────────────────────────────────────
            ['name' => 'Espresso',                  'category' => 'coffee'],
            ['name' => 'Sanger Espresso',           'category' => 'coffee'],
            ['name' => 'Americano / Long Black',    'category' => 'coffee'],
            ['name' => 'Cafe Latte',                'category' => 'coffee'],
            ['name' => 'Cappucino',                 'category' => 'coffee'],
            ['name' => 'Coffee Caramel Latte',      'category' => 'coffee'],
            ['name' => 'Coffee Vanila Latte',       'category' => 'coffee'],
            ['name' => 'Coffee Hazelnut Latte',     'category' => 'coffee'],
            ['name' => 'Coffee Chocolate',          'category' => 'coffee'],
            ['name' => 'Kopi Susu Gula Aren',       'category' => 'coffee'],

            // ── Non Coffee ────────────────────────────────────
            ['name' => 'Red Velvet Latte',          'category' => 'non-coffee'],
            ['name' => 'Taro Latte',                'category' => 'non-coffee'],
            ['name' => 'Matcha Latte',              'category' => 'non-coffee'],
            ['name' => 'Chocolate Latte',           'category' => 'non-coffee'],
            ['name' => 'Chocolate Hazelnut Latte',  'category' => 'non-coffee'],
            ['name' => 'Chocolate Caramel Latte',   'category' => 'non-coffee'],
            ['name' => 'Chocolate Vanilla Latte',   'category' => 'non-coffee'],

            // ── Lainnya: Teh ──────────────────────────────────
            ['name' => 'Lemon Tea',                 'category' => 'non-coffee'],
            ['name' => 'Leci Tea',                  'category' => 'non-coffee'],

            // ── Lainnya: Soda Series ──────────────────────────
            ['name' => 'Orange Squash',             'category' => 'non-coffee'],
            ['name' => 'Melon Squash',              'category' => 'non-coffee'],
            ['name' => 'Leci Squash',               'category' => 'non-coffee'],

            // ── Lainnya: Yakult Series ────────────────────────
            ['name' => 'Orange Punch',              'category' => 'non-coffee'],
            ['name' => 'Melon Punch',               'category' => 'non-coffee'],
            ['name' => 'Leci Punch',                'category' => 'non-coffee'],

            // ── Buah (Juice / Fresh Fruit) ────────────────────
            ['name' => 'Jus Alpukat',               'category' => 'non-coffee'],
            ['name' => 'Jus Jeruk',                 'category' => 'non-coffee'],
            ['name' => 'Jus Semangka',              'category' => 'non-coffee'],
            ['name' => 'Jus Melon',                 'category' => 'non-coffee'],
            ['name' => 'Jus Naga',                  'category' => 'non-coffee'],
        ];

        $inserted = 0;
        foreach ($menus as $menu) {
            // insertOrIgnore agar tidak duplikat jika dijalankan ulang
            $affected = DB::table('products')->insertOrIgnore([
                'name'       => $menu['name'],
                'category'   => $menu['category'],
                'price'      => 0, // harga belum ditentukan, update via menu Inventory
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $inserted += $affected;
        }

        $this->command->info("✅ {$inserted} menu minuman Sesi Potret berhasil dimasukkan!");
        $this->command->warn('⚠️  Harga semua minuman masih 0. Harap update via halaman Inventory > Produk.');
    }
}
