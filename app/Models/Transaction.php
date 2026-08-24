<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'total_amount' => 'integer',
        'amount_paid'  => 'integer',
        'change'       => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function details()
    {
        return $this->hasMany(TransactionDetail::class);
    }

    /**
     * Scope: hanya transaksi yang sudah dibayar.
     */
    public function scopePaid($query)
    {
        return $query->where('payment_status', 'paid');
    }

    /**
     * Scope: hanya transaksi yang belum dibayar (pending).
     */
    public function scopePending($query)
    {
        return $query->where('payment_status', 'pending');
    }
}
