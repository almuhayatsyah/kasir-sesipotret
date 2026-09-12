<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Development : php artisan db:seed
     * Production  : php artisan db:seed --class=ProductionSeeder
     */
    public function run(): void
    {
        $this->call(ProductionSeeder::class);
    }
}
