# ☕ Kasir Coffee — Sesi Potret

Aplikasi kasir modern berbasis web untuk coffee shop **Sesi Potret**, dibangun dengan Laravel 13 + React (Inertia.js) dan dapat diinstal sebagai **Progressive Web App (PWA)** di tablet Android.

![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20?style=flat-square&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)
![Inertia.js](https://img.shields.io/badge/Inertia.js-2.x-9553E9?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Fitur Utama

| Fitur | Keterangan |
|-------|-----------|
| 🛒 **Point of Sale (POS)** | Keranjang belanja interaktif, cari menu real-time, kategori produk |
| 💳 **Bayar Sekarang & Bayar Nanti** | Proses pembayaran cash/QRIS, dukungan order pending (Pay Later) |
| 📊 **Dashboard & Laporan** | Ringkasan omset harian, grafik penjualan, export CSV |
| 📦 **Inventori Menu** | Kelola produk, bahan baku, resep (Bill of Materials), search & filter |
| 👥 **Manajemen User** | Tambah/edit kasir, multi-user, autentikasi aman |
| 📱 **Progressive Web App** | Dapat diinstal di tablet Android, support offline dasar |
| 🖨️ **Print Bluetooth** *(coming soon)* | Integrasi printer thermal via Web Bluetooth API |

---

## 🛠️ Tech Stack

- **Backend:** Laravel 13 (PHP 8.3+)
- **Frontend:** React 18 + Inertia.js 2
- **Build Tool:** Vite 8
- **CSS:** Tailwind CSS 4
- **Database:** MySQL 8
- **Server:** Nginx + PHP-FPM
- **SSL:** Let's Encrypt (Certbot)
- **PWA:** Service Worker + Web App Manifest

---

## 🚀 Instalasi Lokal (Development)

### Prasyarat
- PHP >= 8.3
- Composer 2
- Node.js >= 18
- MySQL 8

### Langkah Instalasi

```bash
# 1. Clone repository
git clone https://github.com/almuhayatsyah/kasir-sesipotret.git
cd kasir-sesipotret

# 2. Install dependensi PHP
composer install

# 3. Salin file environment
cp .env.example .env

# 4. Sesuaikan konfigurasi database di .env
# DB_DATABASE, DB_USERNAME, DB_PASSWORD

# 5. Generate application key
php artisan key:generate

# 6. Jalankan migrasi dan seeder
php artisan migrate --seed

# 7. Install dependensi Node.js
npm install

# 8. Jalankan development server
php artisan serve
npm run dev
```

Akses aplikasi di: **http://localhost:8000**

### Akun Default (dari Seeder)

| Field | Value |
|-------|-------|
| Email | `kasir@sesipotret.com` |
| Password | `SesiPotret2024!` |

> ⚠️ **Ganti password** setelah login pertama kali!

---

## 🌐 Deploy ke VPS (Production)

### Prasyarat VPS
- Ubuntu 22.04+
- PHP 8.3, Composer, Node.js 20+
- MySQL 8, Nginx, Certbot

### Langkah Deploy

```bash
# 1. Buat database MySQL
sudo mysql -e "
  CREATE DATABASE kasir_sesipotret CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'kasir_user'@'localhost' IDENTIFIED BY 'your_password';
  GRANT ALL PRIVILEGES ON kasir_sesipotret.* TO 'kasir_user'@'localhost';
  FLUSH PRIVILEGES;
"

# 2. Clone repository
cd /var/www
sudo git clone https://github.com/almuhayatsyah/kasir-sesipotret.git kasir-sesipotret
sudo chown -R $USER:www-data kasir-sesipotret
cd kasir-sesipotret

# 3. Install dependensi & konfigurasi
composer update --no-dev --optimize-autoloader
cp .env.example .env
nano .env  # Isi DB_PASSWORD dan sesuaikan APP_URL

php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=ProductionSeeder

# 4. Build frontend
npm install --legacy-peer-deps
npm run build

# 5. Optimasi Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 6. Set permission
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### Konfigurasi Nginx

```nginx
server {
    listen 80;
    server_name kasirsesipotret.my.id www.kasirsesipotret.my.id;
    root /var/www/kasir-sesipotret/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### SSL (HTTPS)

```bash
sudo certbot --nginx -d kasirsesipotret.my.id -d www.kasirsesipotret.my.id
```

---

## 🔄 Update Aplikasi (Production)

Setelah setup awal, update cukup dengan satu perintah melalui alias `sesi_update` di VPS:

```bash
# Tambahkan alias ini ke ~/.bashrc di VPS:
alias sesi_update='cd /var/www/kasir-sesipotret && \
  git pull origin main && \
  composer install --no-dev --optimize-autoloader -q && \
  npm run build --silent && \
  php artisan migrate --force -q && \
  php artisan optimize -q && \
  echo "✅ Kasir Sesi Potret berhasil diupdate!"'
```

Workflow update:
```bash
# Di komputer lokal
git add .
git commit -m "feat: deskripsi perubahan"
git push origin main

# Di VPS (via SSH)
sesi_update
```

---

## 📂 Struktur Direktori Penting

```
kasir-sesipotret/
├── app/Http/Controllers/       # Controller Laravel
│   ├── POSController.php       # Logic kasir & transaksi
│   ├── InventoryController.php # Logic produk & bahan baku
│   └── ReportController.php    # Logic laporan & export
├── database/
│   ├── migrations/             # Skema database
│   └── seeders/
│       ├── ProductionSeeder.php # Seeder untuk production
│       └── MinumanSeeder.php   # Menu minuman Sesi Potret
├── resources/js/
│   ├── Pages/
│   │   ├── Dashboard/          # Halaman dashboard
│   │   ├── POS/                # Halaman kasir
│   │   ├── Inventory/          # Halaman inventori
│   │   ├── Report/             # Halaman laporan
│   │   └── Setting/            # Halaman pengaturan user
│   └── Layouts/
│       └── AuthenticatedLayout.jsx
└── public/
    ├── manifest.json           # PWA manifest
    └── sw.js                   # Service Worker
```

---

## 📱 Instalasi PWA di Tablet

1. Buka **https://kasirsesipotret.my.id** di Chrome Android
2. Tap menu **⋮** → **"Add to Home Screen"** / **"Install App"**
3. Atau tap tombol **"Install App"** yang muncul di navbar aplikasi
4. Aplikasi akan tersimpan di layar utama tablet seperti aplikasi native

---

## 🔮 Roadmap

- [x] POS dengan keranjang belanja
- [x] Bayar sekarang & bayar nanti (pending order)
- [x] Dashboard & laporan
- [x] Manajemen inventori & resep
- [x] Multi-user & manajemen kasir
- [x] PWA (installable)
- [x] Deploy production + HTTPS
- [ ] 🖨️ Print struk via Bluetooth (EPPOS EP-RPP02)
- [ ] Kategori menu tambahan (Jus)
- [ ] Notifikasi stok bahan baku menipis

---

## 🤝 Kontribusi

Repository ini bersifat privat untuk kebutuhan bisnis **Sesi Potret**. Untuk pertanyaan atau laporan bug, silakan hubungi developer.

---

## 📄 Lisensi

Hak cipta © 2026 Sesi Potret. Seluruh hak dilindungi.
