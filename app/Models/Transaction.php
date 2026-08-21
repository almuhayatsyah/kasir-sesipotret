<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $guarded = ['id'];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function details()
    {
        return $this->hasMany(TransactionDetail::class);
    }
}
