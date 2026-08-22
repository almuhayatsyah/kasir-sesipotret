<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Product;
use App\Models\Recipe;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    // ──────────────────────────────────────────
    // INGREDIENTS
    // ──────────────────────────────────────────

    public function ingredients(): Response
    {
        $ingredients = Ingredient::orderBy('name')->get();

        return Inertia::render('Inventory/Ingredients', [
            'ingredients' => $ingredients,
        ]);
    }

    public function storeIngredient(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:100',
            'unit'            => 'required|string|max:20',
            'stock'           => 'required|integer|min:0',
            'min_alert_stock' => 'required|integer|min:0',
        ]);

        Ingredient::create($validated);

        return redirect()->back()->with('success', 'Bahan baku berhasil ditambahkan.');
    }

    public function updateIngredient(Request $request, Ingredient $ingredient): RedirectResponse
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:100',
            'unit'            => 'required|string|max:20',
            'stock'           => 'required|integer|min:0',
            'min_alert_stock' => 'required|integer|min:0',
        ]);

        $ingredient->update($validated);

        return redirect()->back()->with('success', 'Bahan baku berhasil diperbarui.');
    }

    public function destroyIngredient(Ingredient $ingredient): RedirectResponse
    {
        $ingredient->delete();

        return redirect()->back()->with('success', 'Bahan baku berhasil dihapus.');
    }

    public function topUpIngredient(Request $request, Ingredient $ingredient): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
        ]);

        $ingredient->increment('stock', $validated['amount']);

        return redirect()->back()->with('success', "Stok {$ingredient->name} berhasil ditambah {$validated['amount']} {$ingredient->unit}.");
    }

    // ──────────────────────────────────────────
    // PRODUCTS & RECIPES
    // ──────────────────────────────────────────

    public function products(): Response
    {
        $products     = Product::with('recipes.ingredient')->orderBy('name')->get();
        $ingredients  = Ingredient::orderBy('name')->get();

        return Inertia::render('Inventory/Products', [
            'products'    => $products,
            'ingredients' => $ingredients,
        ]);
    }

    public function storeProduct(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:100',
            'category'  => 'required|in:coffee,non-coffee,makanan',
            'price'     => 'required|integer|min:0',
            'is_active' => 'boolean',
            'recipes'   => 'array',
            'recipes.*.ingredient_id'  => 'required|exists:ingredients,id',
            'recipes.*.quantity_needed' => 'required|integer|min:1',
        ]);

        $product = Product::create([
            'name'      => $validated['name'],
            'category'  => $validated['category'],
            'price'     => $validated['price'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        foreach ($validated['recipes'] ?? [] as $recipe) {
            Recipe::create([
                'product_id'      => $product->id,
                'ingredient_id'   => $recipe['ingredient_id'],
                'quantity_needed' => $recipe['quantity_needed'],
            ]);
        }

        return redirect()->back()->with('success', 'Menu berhasil ditambahkan.');
    }

    public function updateProduct(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:100',
            'category'  => 'required|in:coffee,non-coffee,makanan',
            'price'     => 'required|integer|min:0',
            'is_active' => 'boolean',
            'recipes'   => 'array',
            'recipes.*.ingredient_id'   => 'required|exists:ingredients,id',
            'recipes.*.quantity_needed' => 'required|integer|min:1',
        ]);

        $product->update([
            'name'      => $validated['name'],
            'category'  => $validated['category'],
            'price'     => $validated['price'],
            'is_active' => $validated['is_active'] ?? $product->is_active,
        ]);

        // Sync resep: hapus semua lalu buat ulang
        $product->recipes()->delete();
        foreach ($validated['recipes'] ?? [] as $recipe) {
            Recipe::create([
                'product_id'      => $product->id,
                'ingredient_id'   => $recipe['ingredient_id'],
                'quantity_needed' => $recipe['quantity_needed'],
            ]);
        }

        return redirect()->back()->with('success', 'Menu berhasil diperbarui.');
    }

    public function destroyProduct(Product $product): RedirectResponse
    {
        $product->recipes()->delete();
        $product->delete();

        return redirect()->back()->with('success', 'Menu berhasil dihapus.');
    }

    public function toggleProduct(Product $product): RedirectResponse
    {
        $product->update(['is_active' => !$product->is_active]);
        $status = $product->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Menu {$product->name} berhasil {$status}.");
    }
}
