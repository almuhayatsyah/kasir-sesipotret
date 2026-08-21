<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * Single-role system: tidak ada role hierarchy.
     * Semua user yang login bisa akses POS + Inventori + Shift.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    /**
     * Semua shift milik user ini.
     */
    public function shifts()
    {
        return $this->hasMany(Shift::class);
    }

    /**
     * Shift yang sedang aktif (status open) milik user ini.
     */
    public function activeShift()
    {
        return $this->hasOne(Shift::class)->where('status', 'open')->latest();
    }
}
