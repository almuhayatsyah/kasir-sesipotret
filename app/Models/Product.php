<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Varian harga Hot / Ice (hanya untuk minuman).
     */
    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * Relasi ke tabel recipes (BOM / Bill of Materials).
     */
    public function recipes()
    {
        return $this->hasMany(Recipe::class);
    }

    /**
     * Relasi ke tabel transaction_details.
     */
    public function transactionDetails()
    {
        return $this->hasMany(TransactionDetail::class);
    }
}
