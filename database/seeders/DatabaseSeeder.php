<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\Product;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─────────────────────────────────────────
        // 1. USER
        // ─────────────────────────────────────────
        $operator = User::create([
            'name'     => 'Budi Santoso',
            'email'    => 'kasir@sesipotret.com',
            'password' => Hash::make('password'),
        ]);

        $this->command->info('✅ User operator berhasil dibuat');

        // ─────────────────────────────────────────
        // 2. INGREDIENTS (Bahan Baku)
        // ─────────────────────────────────────────
        $espresso = Ingredient::create([
            'name' => 'Espresso Shot', 'unit' => 'shot',
            'stock' => 200, 'min_alert_stock' => 20,
        ]);
        $susuSegar = Ingredient::create([
            'name' => 'Susu Segar', 'unit' => 'ml',
            'stock' => 10000, 'min_alert_stock' => 1000,
        ]);
        $bubukCoklat = Ingredient::create([
            'name' => 'Bubuk Coklat', 'unit' => 'gram',
            'stock' => 2000, 'min_alert_stock' => 200,
        ]);
        $gulaPasir = Ingredient::create([
            'name' => 'Gula Pasir', 'unit' => 'gram',
            'stock' => 5000, 'min_alert_stock' => 500,
        ]);
        $es = Ingredient::create([
            'name' => 'Es Batu', 'unit' => 'pcs',
            'stock' => 500, 'min_alert_stock' => 50,
        ]);
        $rotiTawar = Ingredient::create([
            'name' => 'Roti Tawar', 'unit' => 'lembar',
            'stock' => 100, 'min_alert_stock' => 10,
        ]);
        $keju = Ingredient::create([
            'name' => 'Keju Slice', 'unit' => 'lembar',
            'stock' => 50, 'min_alert_stock' => 10,
        ]);
        $mie = Ingredient::create([
            'name' => 'Mie Instan', 'unit' => 'bungkus',
            'stock' => 60, 'min_alert_stock' => 10,
        ]);
        $telur = Ingredient::create([
            'name' => 'Telur', 'unit' => 'butir',
            'stock' => 80, 'min_alert_stock' => 15,
        ]);
        $matcha = Ingredient::create([
            'name' => 'Bubuk Matcha', 'unit' => 'gram',
            'stock' => 500, 'min_alert_stock' => 50,
        ]);
        $tehCelup = Ingredient::create([
            'name' => 'Teh Celup', 'unit' => 'pcs',
            'stock' => 100, 'min_alert_stock' => 15,
        ]);
        $jeruk = Ingredient::create([
            'name' => 'Sari Jeruk', 'unit' => 'ml',
            'stock' => 5000, 'min_alert_stock' => 500,
        ]);

        $this->command->info('✅ Ingredients berhasil dibuat: 12 bahan baku');

        // ─────────────────────────────────────────
        // 3. PRODUCTS (Menu) — dengan kategori
        // ─────────────────────────────────────────

        // ── COFFEE ──
        $americano = Product::create([
            'name' => 'Americano', 'category' => 'coffee',
            'price' => 18000, 'is_active' => true,
        ]);
        $cappuccino = Product::create([
            'name' => 'Cappuccino', 'category' => 'coffee',
            'price' => 22000, 'is_active' => true,
        ]);
        $caramelLatte = Product::create([
            'name' => 'Caramel Latte', 'category' => 'coffee',
            'price' => 25000, 'is_active' => true,
        ]);
        $espressoShot = Product::create([
            'name' => 'Espresso', 'category' => 'coffee',
            'price' => 12000, 'is_active' => true,
        ]);
        $mochaccino = Product::create([
            'name' => 'Mochaccino', 'category' => 'coffee',
            'price' => 24000, 'is_active' => true,
        ]);

        // ── NON-COFFEE ──
        $icedChocolate = Product::create([
            'name' => 'Iced Chocolate', 'category' => 'non-coffee',
            'price' => 20000, 'is_active' => true,
        ]);
        $matchaLatte = Product::create([
            'name' => 'Matcha Latte', 'category' => 'non-coffee',
            'price' => 24000, 'is_active' => true,
        ]);
        $tehMadu = Product::create([
            'name' => 'Teh Madu', 'category' => 'non-coffee',
            'price' => 15000, 'is_active' => true,
        ]);
        $esJeruk = Product::create([
            'name' => 'Es Jeruk Segar', 'category' => 'non-coffee',
            'price' => 14000, 'is_active' => true,
        ]);

        // ── MAKANAN ──
        $rotiBalkar = Product::create([
            'name' => 'Roti Bakar Keju', 'category' => 'makanan',
            'price' => 18000, 'is_active' => true,
        ]);
        $indomieGoreng = Product::create([
            'name' => 'Indomie Goreng Telur', 'category' => 'makanan',
            'price' => 16000, 'is_active' => true,
        ]);
        $indomieKuah = Product::create([
            'name' => 'Indomie Kuah Telur', 'category' => 'makanan',
            'price' => 16000, 'is_active' => true,
        ]);
        $frenchToast = Product::create([
            'name' => 'French Toast', 'category' => 'makanan',
            'price' => 20000, 'is_active' => true,
        ]);

        $this->command->info('✅ Products berhasil dibuat: 13 menu (5 coffee, 4 non-coffee, 4 makanan)');

        // ─────────────────────────────────────────
        // 4. RECIPES (BOM / Bill of Materials)
        // ─────────────────────────────────────────

        // Americano: 2 shot espresso, 5 es batu
        Recipe::create(['product_id' => $americano->id, 'ingredient_id' => $espresso->id,   'quantity_needed' => 2]);
        Recipe::create(['product_id' => $americano->id, 'ingredient_id' => $es->id,          'quantity_needed' => 5]);

        // Cappuccino: 2 shot espresso, 150ml susu, 5g gula
        Recipe::create(['product_id' => $cappuccino->id, 'ingredient_id' => $espresso->id,  'quantity_needed' => 2]);
        Recipe::create(['product_id' => $cappuccino->id, 'ingredient_id' => $susuSegar->id, 'quantity_needed' => 150]);
        Recipe::create(['product_id' => $cappuccino->id, 'ingredient_id' => $gulaPasir->id, 'quantity_needed' => 5]);

        // Caramel Latte: 2 shot espresso, 180ml susu, 15g gula, 6 es batu
        Recipe::create(['product_id' => $caramelLatte->id, 'ingredient_id' => $espresso->id,  'quantity_needed' => 2]);
        Recipe::create(['product_id' => $caramelLatte->id, 'ingredient_id' => $susuSegar->id, 'quantity_needed' => 180]);
        Recipe::create(['product_id' => $caramelLatte->id, 'ingredient_id' => $gulaPasir->id, 'quantity_needed' => 15]);
        Recipe::create(['product_id' => $caramelLatte->id, 'ingredient_id' => $es->id,        'quantity_needed' => 6]);

        // Espresso: 2 shot espresso
        Recipe::create(['product_id' => $espressoShot->id, 'ingredient_id' => $espresso->id, 'quantity_needed' => 2]);

        // Mochaccino: 2 shot espresso, 150ml susu, 20g bubuk coklat, 10g gula
        Recipe::create(['product_id' => $mochaccino->id, 'ingredient_id' => $espresso->id,    'quantity_needed' => 2]);
        Recipe::create(['product_id' => $mochaccino->id, 'ingredient_id' => $susuSegar->id,   'quantity_needed' => 150]);
        Recipe::create(['product_id' => $mochaccino->id, 'ingredient_id' => $bubukCoklat->id, 'quantity_needed' => 20]);
        Recipe::create(['product_id' => $mochaccino->id, 'ingredient_id' => $gulaPasir->id,   'quantity_needed' => 10]);

        // Iced Chocolate: 30g bubuk coklat, 200ml susu, 10g gula, 8 es batu
        Recipe::create(['product_id' => $icedChocolate->id, 'ingredient_id' => $bubukCoklat->id, 'quantity_needed' => 30]);
        Recipe::create(['product_id' => $icedChocolate->id, 'ingredient_id' => $susuSegar->id,   'quantity_needed' => 200]);
        Recipe::create(['product_id' => $icedChocolate->id, 'ingredient_id' => $gulaPasir->id,   'quantity_needed' => 10]);
        Recipe::create(['product_id' => $icedChocolate->id, 'ingredient_id' => $es->id,          'quantity_needed' => 8]);

        // Matcha Latte: 15g matcha, 200ml susu, 5g gula, 5 es batu
        Recipe::create(['product_id' => $matchaLatte->id, 'ingredient_id' => $matcha->id,     'quantity_needed' => 15]);
        Recipe::create(['product_id' => $matchaLatte->id, 'ingredient_id' => $susuSegar->id,  'quantity_needed' => 200]);
        Recipe::create(['product_id' => $matchaLatte->id, 'ingredient_id' => $gulaPasir->id,  'quantity_needed' => 5]);
        Recipe::create(['product_id' => $matchaLatte->id, 'ingredient_id' => $es->id,         'quantity_needed' => 5]);

        // Teh Madu: 1 teh celup, 10g gula
        Recipe::create(['product_id' => $tehMadu->id, 'ingredient_id' => $tehCelup->id,  'quantity_needed' => 1]);
        Recipe::create(['product_id' => $tehMadu->id, 'ingredient_id' => $gulaPasir->id, 'quantity_needed' => 10]);

        // Es Jeruk Segar: 150ml sari jeruk, 10g gula, 8 es batu
        Recipe::create(['product_id' => $esJeruk->id, 'ingredient_id' => $jeruk->id,     'quantity_needed' => 150]);
        Recipe::create(['product_id' => $esJeruk->id, 'ingredient_id' => $gulaPasir->id, 'quantity_needed' => 10]);
        Recipe::create(['product_id' => $esJeruk->id, 'ingredient_id' => $es->id,        'quantity_needed' => 8]);

        // Roti Bakar Keju: 2 lembar roti, 2 lembar keju
        Recipe::create(['product_id' => $rotiBalkar->id, 'ingredient_id' => $rotiTawar->id, 'quantity_needed' => 2]);
        Recipe::create(['product_id' => $rotiBalkar->id, 'ingredient_id' => $keju->id,      'quantity_needed' => 2]);

        // Indomie Goreng Telur: 1 mie, 1 telur
        Recipe::create(['product_id' => $indomieGoreng->id, 'ingredient_id' => $mie->id,   'quantity_needed' => 1]);
        Recipe::create(['product_id' => $indomieGoreng->id, 'ingredient_id' => $telur->id, 'quantity_needed' => 1]);

        // Indomie Kuah Telur: 1 mie, 1 telur
        Recipe::create(['product_id' => $indomieKuah->id, 'ingredient_id' => $mie->id,   'quantity_needed' => 1]);
        Recipe::create(['product_id' => $indomieKuah->id, 'ingredient_id' => $telur->id, 'quantity_needed' => 1]);

        // French Toast: 2 lembar roti, 1 telur, 10g gula
        Recipe::create(['product_id' => $frenchToast->id, 'ingredient_id' => $rotiTawar->id, 'quantity_needed' => 2]);
        Recipe::create(['product_id' => $frenchToast->id, 'ingredient_id' => $telur->id,     'quantity_needed' => 1]);
        Recipe::create(['product_id' => $frenchToast->id, 'ingredient_id' => $gulaPasir->id, 'quantity_needed' => 10]);

        $this->command->info('✅ Recipes berhasil dibuat: resep untuk semua 13 produk');

        // ─────────────────────────────────────────
        // Summary
        // ─────────────────────────────────────────
        $this->command->newLine();
        $this->command->table(
            ['Nama', 'Email', 'Password'],
            [
                [$operator->name, $operator->email, 'password'],
            ]
        );
        $this->command->info('🎉 Database seeding selesai! Kasir Sesi Potret siap digunakan.');
    }
}
