<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\Setting\UserController;
use Illuminate\Support\Facades\Route;

// ─────────────────────────────────────────────
// Root → redirect ke dashboard atau login
// ─────────────────────────────────────────────
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

// ─────────────────────────────────────────────
// Dashboard
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

    // ── POS (Kasir) ──
    Route::prefix('pos')->name('pos.')->group(function () {
        Route::get('/',                       [POSController::class, 'index'])->name('index');
        Route::post('/checkout',              [POSController::class, 'checkout'])->name('checkout');
        Route::get('/transaction/{transaction}', [POSController::class, 'getTransaction'])->name('transaction');
        Route::get('/low-stock',              [POSController::class, 'lowStockAlert'])->name('low-stock');
    });

    // ── Laporan Keuangan ──
    Route::get('/report', [ReportController::class, 'index'])->name('report.index');
    Route::get('/report/export', [ReportController::class, 'exportExcel'])->name('report.export');

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

    // ── Pengaturan ──
    Route::prefix('setting')->name('setting.')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });
});

require __DIR__ . '/auth.php';
