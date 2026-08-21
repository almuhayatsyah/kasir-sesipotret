<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $guarded = ['id'];

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
