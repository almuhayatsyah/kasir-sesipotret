<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MakananSeeder extends Seeder
{
    /**
     * Format: [nama, sub_category, harga]
     *  - category         : selalu 'makanan'
     *  - temperature_mode : 'single' (tidak ada pilihan Hot/Ice)
     *
     * Data sesuai makanan-sesi.md
     */
    private function menus(): array
    {
        return [
            // ── Snack ────────────────────────────────────────────
            ['Kentang Crispy',                      'snack', 15000],
            ['Tempe Mendoan',                        'snack', 15000],
            ['Pisang Coklat Lumer 4 pcs',            'snack', 20000],
            ['Banana Grid 4 pcs',                    'snack', 20000],
            ['Pisang Krispy',                        'snack', 15000],
            ['Dimsum',                               'snack', 25000],
            ['Churros',                              'snack', 18000],
            ['Nugget',                               'snack', 15000],
            ['Sosis',                                'snack', 15000],
            ['Mix Snack',                            'snack', 20000],
            ['Roti Roll Coklat',                     'snack', 20000],
            ['Burger',                               'snack', 25000],

            // ── Makanan ──────────────────────────────────────────
            ['Nasi Ayam Penyet Komplit',              'makanan', 28000],
            ['Nasi Ayam Geprek',                     'makanan', 25000],
            ['Nasi Chicken Popcorn Sambal Matah',     'makanan', 28000],
            ['Nasi Goreng Ayam Gacor',               'makanan', 30000],
            ['Nasi Goreng Seafood',                  'makanan', 25000],
            ['Nasi Goreng Kampung Spesial',          'makanan', 25000],
            ['Nasi Goreng Telur',                    'makanan', 18000],

            // ── Aneka Mie ────────────────────────────────────────
            ['Mie Aceh',                             'aneka-mie', 12000],
            ['Mie Aceh Seafood',                     'aneka-mie', 18000],
            ['Mie Goreng Aceh',                      'aneka-mie', 12000],
            ['Mie Goreng + Telur',                   'aneka-mie', 15000],
            ['Indomie Original',                     'aneka-mie', 15000],
            ['Indomie Seafood',                      'aneka-mie', 20000],
            ['Indomie Spesial (Bakso, Telur, Sosis)', 'aneka-mie', 25000],
            ['Indomie Goreng Nugget',                'aneka-mie', 25000],
            ['Mie Rawit Bakso',                      'aneka-mie', 20000],
            ['Ramen Original',                       'aneka-mie', 18000],
            ['Ramen Katsu',                          'aneka-mie', 25000],
        ];
    }

    public function run(): void
    {
        $count = 0;

        foreach ($this->menus() as [$name, $subCategory, $price]) {
            $data = [
                'name'             => $name,
                'category'         => 'makanan',
                'sub_category'     => $subCategory,
                'temperature_mode' => 'single',
                'price'            => $price,
                'is_active'        => true,
                'updated_at'       => now(),
            ];

            $product = DB::table('products')->where('name', $name)->first();

            if ($product) {
                DB::table('products')->where('id', $product->id)->update($data);
                $productId = $product->id;
            } else {
                $productId = DB::table('products')->insertGetId($data + [
                    'created_at' => now(),
                ]);
            }

            // Pastikan tidak ada varian Hot/Ice untuk makanan
            DB::table('product_variants')->where('product_id', $productId)->delete();

            $count++;
        }

        $this->command->info("✅ {$count} menu makanan Sesi Potret berhasil disinkronkan!");
    }
}
