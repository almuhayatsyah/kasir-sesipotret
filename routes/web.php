<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ShiftController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─────────────────────────────────────────────
// Root → redirect ke login atau POS
// ─────────────────────────────────────────────
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('shift.index');
    }
    return redirect()->route('login');
});

// ─────────────────────────────────────────────
// Dashboard (Admin summary)
// ─────────────────────────────────────────────
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

// ─────────────────────────────────────────────
// AUTH REQUIRED GROUP
// ─────────────────────────────────────────────
Route::middleware(['auth'])->group(function () {

    // ── Profile ──
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ── Shift Management ──
    Route::prefix('shift')->name('shift.')->group(function () {
        Route::get('/',                       [ShiftController::class, 'index'])->name('index');
        Route::post('/open',                  [ShiftController::class, 'open'])->name('open');
        Route::post('/{shift}/close',         [ShiftController::class, 'close'])->name('close');
        Route::get('/{shift}',                [ShiftController::class, 'show'])->name('show');
    });

    // ── POS (Kasir) ──
    Route::prefix('pos')->name('pos.')->group(function () {
        Route::get('/',                       [POSController::class, 'index'])->name('index');
        Route::post('/checkout',              [POSController::class, 'checkout'])->name('checkout');
        Route::get('/transaction/{transaction}', [POSController::class, 'getTransaction'])->name('transaction');
        Route::get('/low-stock',              [POSController::class, 'lowStockAlert'])->name('low-stock');
    });

    // ── Inventory ──
    Route::prefix('inventory')->name('inventory.')->group(function () {
        // Ingredients
        Route::get('/ingredients',                    [InventoryController::class, 'ingredients'])->name('ingredients');
        Route::post('/ingredients',                   [InventoryController::class, 'storeIngredient'])->name('ingredients.store');
        Route::put('/ingredients/{ingredient}',       [InventoryController::class, 'updateIngredient'])->name('ingredients.update');
        Route::delete('/ingredients/{ingredient}',    [InventoryController::class, 'destroyIngredient'])->name('ingredients.destroy');
        Route::post('/ingredients/{ingredient}/topup',[InventoryController::class, 'topUpIngredient'])->name('ingredients.topup');

        // Products
        Route::get('/products',                       [InventoryController::class, 'products'])->name('products');
        Route::post('/products',                      [InventoryController::class, 'storeProduct'])->name('products.store');
        Route::put('/products/{product}',             [InventoryController::class, 'updateProduct'])->name('products.update');
        Route::delete('/products/{product}',          [InventoryController::class, 'destroyProduct'])->name('products.destroy');
        Route::patch('/products/{product}/toggle',    [InventoryController::class, 'toggleProduct'])->name('products.toggle');
    });
});

require __DIR__ . '/auth.php';
