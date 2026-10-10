<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MinumanSeeder extends Seeder
{
    /**
     * Format: [nama, sub_category, harga_hot, harga_ice, harga_tunggal]
     *  - harga_hot / harga_ice : null jika tidak tersedia
     *  - harga_tunggal         : isi untuk menu tanpa pilihan Hot/Ice
     *
     * temperature_mode ditentukan otomatis:
     *  both   = Ada Hot & Ice
     *  hot    = Hanya Hot
     *  ice    = Hanya Ice
     *  single = Harga tunggal (tidak ada pilihan suhu)
     *
     * Data sesuai minuman-sesi.md
     */
    private function menus(): array
    {
        return [
            // ── Coffee ───────────────────────────────────────────
            ['Espresso',                  'coffee',     15000, null],
            ['Sanger Espresso',           'coffee',     20000, 22000],
            ['Americano / Long Black',    'coffee',     20000, 23000],
            ['Cafe Latte',                'coffee',     20000, 20000],
            ['Cappuccino Milk',           'coffee',     18000, 20000],
            ['Coffee Caramel Latte',      'coffee',     22000, 25000],
            ['Coffee Vanilla Latte',      'coffee',     23000, 25000],
            ['Coffee Hazelnut Latte',     'coffee',     23000, 25000],
            ['Caffe Chocolate',           'coffee',     20000, 23000],
            ['Kopi Milk Gula Aren',       'coffee',     20000, 22000],

            // ── Non Coffee ───────────────────────────────────────
            ['Red Velvet Latte',          'non-coffee', 18000, 20000],
            ['Taro Latte',                'non-coffee', null,  20000],
            ['Matcha Latte',              'non-coffee', null,  20000],
            ['Chocolate Latte',           'non-coffee', 20000, 22000],
            ['Chocolate Hazelnut Latte',  'non-coffee', 22000, 25000],
            ['Chocolate Caramel Latte',   'non-coffee', 22000, 24000],
            ['Chocolate Vanilla Latte',   'non-coffee', 22000, 25000],

            // ── Refreshing Drink ─────────────────────────────────
            ['Lemon Tea',                 'refreshing', 13000, 15000],
            ['Leci Tea',                  'refreshing', null,  15000],
            ['Orange Squash',             'refreshing', null,  15000],
            ['Melon Squash',              'refreshing', null,  15000],
            ['Leci Squash',               'refreshing', null,  15000],
            ['Leci Punch',                'refreshing', null,  18000],

            // ── Healthy Drink ────────────────────────────────────
            ['Jahe Serai Madu',           'healthy',    15000, 17000],
            ['Serai Cim Cooler',          'healthy',    15000, 18000],
            ['Kunyit Latte',              'healthy',    17000, 20000],
        ];
    }

    public function run(): void
    {
        $count = 0;

        foreach ($this->menus() as $menu) {
            [$name, $subCategory, $hot, $ice] = $menu;
            $single = $menu[4] ?? null;

            $mode = match (true) {
                $single !== null               => 'single',
                $hot !== null && $ice !== null => 'both',
                $hot !== null                  => 'hot',
                default                        => 'ice',
            };

            $prices = array_filter([$hot, $ice, $single], fn ($p) => $p !== null);

            $data = [
                'category'         => 'minuman',
                'sub_category'     => $subCategory,
                'temperature_mode' => $mode,
                'price'            => min($prices),
                'is_active'        => true,
                'updated_at'       => now(),
            ];

            // Aman dijalankan ulang: produk dicari berdasarkan nama
            $product = DB::table('products')->where('name', $name)->first();

            if ($product) {
                DB::table('products')->where('id', $product->id)->update($data);
                $productId = $product->id;
            } else {
                $productId = DB::table('products')->insertGetId($data + [
                    'name'       => $name,
                    'created_at' => now(),
                ]);
            }

            // Sinkron varian Hot / Ice (menu 'single' tidak punya varian)
            DB::table('product_variants')->where('product_id', $productId)->delete();

            $variants = [];
            if (in_array($mode, ['both', 'hot'])) {
                $variants[] = ['temperature' => 'hot', 'price' => $hot];
            }
            if (in_array($mode, ['both', 'ice'])) {
                $variants[] = ['temperature' => 'ice', 'price' => $ice];
            }

            foreach ($variants as $variant) {
                DB::table('product_variants')->insert($variant + [
                    'product_id' => $productId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $count++;
        }

        $this->command->info("✅ {$count} menu minuman Sesi Potret berhasil disinkronkan!");
    }
}
