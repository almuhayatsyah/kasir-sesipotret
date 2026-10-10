<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Product;
use App\Models\Recipe;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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
        $products     = Product::with(['recipes.ingredient', 'variants'])->orderBy('name')->get();
        $ingredients  = Ingredient::orderBy('name')->get();

        return Inertia::render('Inventory/Products', [
            'products'    => $products,
            'ingredients' => $ingredients,
        ]);
    }

    private function productRules(): array
    {
        return [
            'name'         => 'required|string|max:100',
            'category'     => 'required|in:minuman,makanan',
            'sub_category' => 'nullable|in:coffee,non-coffee,refreshing,healthy,snack,makanan,aneka-mie',
            'temperature_mode' => 'nullable|in:both,hot,ice,single',
            'price'        => 'nullable|integer|min:0',
            'price_hot'    => 'nullable|integer|min:0',
            'price_ice'    => 'nullable|integer|min:0',
            'is_active'    => 'boolean',
            'recipes'      => 'array',
            'recipes.*.ingredient_id'   => 'required|exists:ingredients,id',
            'recipes.*.quantity_needed' => 'required|integer|min:1',
        ];
    }

    /**
     * Susun atribut produk + harga varian dari input tervalidasi.
     * Minuman: temperature_mode both|hot|ice memakai harga varian, single memakai harga tunggal.
     * Makanan: selalu harga tunggal.
     */
    private function buildProductData(array $v, ?bool $fallbackActive = null): array
    {
        $isDrink = $v['category'] === 'minuman';
        $mode    = $isDrink ? ($v['temperature_mode'] ?? 'both') : 'single';
        $needHot = in_array($mode, ['both', 'hot']);
        $needIce = in_array($mode, ['both', 'ice']);

        if ($mode !== 'single') {
            if ($needHot && !isset($v['price_hot'])) {
                throw ValidationException::withMessages(['price_hot' => 'Harga Hot wajib diisi.']);
            }
            if ($needIce && !isset($v['price_ice'])) {
                throw ValidationException::withMessages(['price_ice' => 'Harga Ice wajib diisi.']);
            }
            $prices = array_filter([
                $needHot ? $v['price_hot'] : null,
                $needIce ? $v['price_ice'] : null,
            ], fn ($p) => $p !== null);
            $basePrice = min($prices);
        } else {
            if (!isset($v['price'])) {
                throw ValidationException::withMessages(['price' => 'Harga wajib diisi.']);
            }
            $basePrice = $v['price'];
        }

        return [
            'name'         => $v['name'],
            'category'     => $v['category'],
            'sub_category' => $v['sub_category'] ?? null,
            'temperature_mode' => $mode,
            'price'        => $basePrice, // harga terendah, dipakai sebagai harga "mulai dari"
            'is_active'    => $v['is_active'] ?? $fallbackActive ?? true,
        ];
    }

    private function syncVariants(Product $product, array $v): void
    {
        $product->variants()->delete();

        if ($product->category !== 'minuman') {
            return;
        }

        $mode = $product->temperature_mode;

        if (in_array($mode, ['both', 'hot'])) {
            $product->variants()->create(['temperature' => 'hot', 'price' => $v['price_hot']]);
        }
        if (in_array($mode, ['both', 'ice'])) {
            $product->variants()->create(['temperature' => 'ice', 'price' => $v['price_ice']]);
        }
    }

    private function syncRecipes(Product $product, array $recipes): void
    {
        $product->recipes()->delete();
        foreach ($recipes as $recipe) {
            Recipe::create([
                'product_id'      => $product->id,
                'ingredient_id'   => $recipe['ingredient_id'],
                'quantity_needed' => $recipe['quantity_needed'],
            ]);
        }
    }

    public function storeProduct(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->productRules());

        DB::transaction(function () use ($validated) {
            $product = Product::create($this->buildProductData($validated));
            $this->syncVariants($product, $validated);
            $this->syncRecipes($product, $validated['recipes'] ?? []);
        });

        return redirect()->back()->with('success', 'Menu berhasil ditambahkan.');
    }

    public function updateProduct(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate($this->productRules());

        DB::transaction(function () use ($validated, $product) {
            $product->update($this->buildProductData($validated, $product->is_active));
            $this->syncVariants($product, $validated);
            $this->syncRecipes($product, $validated['recipes'] ?? []);
        });

        return redirect()->back()->with('success', 'Menu berhasil diperbarui.');
    }

    public function destroyProduct(Product $product): RedirectResponse
    {
        $product->recipes()->delete();
        $product->variants()->delete();
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
