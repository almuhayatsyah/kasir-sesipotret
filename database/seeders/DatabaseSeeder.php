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
    /**
     * Seed the application's database.
     * Kasir Sesi Potret — Coffee Shop POS System
     */
    public function run(): void
    {
        // ─────────────────────────────────────────
        // 1. USER (Single-role: satu akun untuk semua)
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
            'name'            => 'Espresso Shot',
            'unit'            => 'shot',
            'stock'           => 200,
            'min_alert_stock' => 20,
        ]);

        $susuSegar = Ingredient::create([
            'name'            => 'Susu Segar',
            'unit'            => 'ml',
            'stock'           => 10000,
            'min_alert_stock' => 1000,
        ]);

        $bubukCoklat = Ingredient::create([
            'name'            => 'Bubuk Coklat',
            'unit'            => 'gram',
            'stock'           => 2000,
            'min_alert_stock' => 200,
        ]);

        $gulaPasir = Ingredient::create([
            'name'            => 'Gula Pasir',
            'unit'            => 'gram',
            'stock'           => 5000,
            'min_alert_stock' => 500,
        ]);

        $es = Ingredient::create([
            'name'            => 'Es Batu',
            'unit'            => 'pcs',
            'stock'           => 500,
            'min_alert_stock' => 50,
        ]);

        $this->command->info('✅ Ingredients berhasil dibuat: 5 bahan baku');

        // ─────────────────────────────────────────
        // 3. PRODUCTS (Menu Kafe)
        // ─────────────────────────────────────────
        $americano = Product::create([
            'name'      => 'Americano',
            'price'     => 18000,
            'is_active' => true,
        ]);

        $cappuccino = Product::create([
            'name'      => 'Cappuccino',
            'price'     => 22000,
            'is_active' => true,
        ]);

        $icedChocolate = Product::create([
            'name'      => 'Iced Chocolate',
            'price'     => 20000,
            'is_active' => true,
        ]);

        $caramelLatte = Product::create([
            'name'      => 'Caramel Latte',
            'price'     => 25000,
            'is_active' => true,
        ]);

        $matcaLatte = Product::create([
            'name'      => 'Matcha Latte',
            'price'     => 24000,
            'is_active' => false, // Habis / tidak tersedia sementara
        ]);

        $this->command->info('✅ Products berhasil dibuat: 5 menu (4 aktif, 1 nonaktif)');

        // ─────────────────────────────────────────
        // 4. RECIPES (BOM / Bill of Materials)
        // ─────────────────────────────────────────

        // Americano: 2 shot espresso, 5 pcs es batu
        Recipe::create(['product_id' => $americano->id, 'ingredient_id' => $espresso->id,   'quantity_needed' => 2]);
        Recipe::create(['product_id' => $americano->id, 'ingredient_id' => $es->id,          'quantity_needed' => 5]);

        // Cappuccino: 2 shot espresso, 150ml susu, 5g gula
        Recipe::create(['product_id' => $cappuccino->id, 'ingredient_id' => $espresso->id,  'quantity_needed' => 2]);
        Recipe::create(['product_id' => $cappuccino->id, 'ingredient_id' => $susuSegar->id, 'quantity_needed' => 150]);
        Recipe::create(['product_id' => $cappuccino->id, 'ingredient_id' => $gulaPasir->id, 'quantity_needed' => 5]);

        // Iced Chocolate: 30g bubuk coklat, 200ml susu, 10g gula, 8 pcs es batu
        Recipe::create(['product_id' => $icedChocolate->id, 'ingredient_id' => $bubukCoklat->id, 'quantity_needed' => 30]);
        Recipe::create(['product_id' => $icedChocolate->id, 'ingredient_id' => $susuSegar->id,   'quantity_needed' => 200]);
        Recipe::create(['product_id' => $icedChocolate->id, 'ingredient_id' => $gulaPasir->id,   'quantity_needed' => 10]);
        Recipe::create(['product_id' => $icedChocolate->id, 'ingredient_id' => $es->id,          'quantity_needed' => 8]);

        // Caramel Latte: 2 shot espresso, 180ml susu, 15g gula, 6 pcs es batu
        Recipe::create(['product_id' => $caramelLatte->id, 'ingredient_id' => $espresso->id,  'quantity_needed' => 2]);
        Recipe::create(['product_id' => $caramelLatte->id, 'ingredient_id' => $susuSegar->id, 'quantity_needed' => 180]);
        Recipe::create(['product_id' => $caramelLatte->id, 'ingredient_id' => $gulaPasir->id, 'quantity_needed' => 15]);
        Recipe::create(['product_id' => $caramelLatte->id, 'ingredient_id' => $es->id,        'quantity_needed' => 6]);

        // Matcha Latte: 200ml susu, 5g gula, 5 pcs es batu (no espresso)
        Recipe::create(['product_id' => $matcaLatte->id, 'ingredient_id' => $susuSegar->id, 'quantity_needed' => 200]);
        Recipe::create(['product_id' => $matcaLatte->id, 'ingredient_id' => $gulaPasir->id, 'quantity_needed' => 5]);
        Recipe::create(['product_id' => $matcaLatte->id, 'ingredient_id' => $es->id,        'quantity_needed' => 5]);

        $this->command->info('✅ Recipes berhasil dibuat: resep untuk semua 5 produk');

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
