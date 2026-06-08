# 🎉 Virtual Photobooth — Panduan Setup & Deploy
> Estimasi waktu: **30–45 menit** (dari nol sampai live)

---

## LANGKAH 1 — Buat Akun Supabase (gratis)

1. Buka **https://supabase.com** → klik **Start your project**
2. Sign up pakai akun GitHub
3. Klik **New Project**
4. Isi:
   - **Name**: `virtual-photobooth`
   - **Database Password**: buat password kuat (simpan!)
   - **Region**: pilih **Southeast Asia (Singapore)**
5. Tunggu ±2 menit sampai project siap

---

## LANGKAH 2 — Jalankan Schema SQL

1. Di dashboard Supabase, klik **SQL Editor** (ikon database di sidebar kiri)
2. Klik **New Query**
3. Copy-paste isi file `schema.sql` ke editor
4. Klik **Run** (atau Ctrl+Enter)
5. Pastikan muncul output tabel: `events`, `frames`, `submissions` → ✅

---

## LANGKAH 3 — Setup Storage Bucket (jika SQL tidak bisa buat)

Jika langkah storage di SQL gagal (butuh service_role), buat manual:

1. Klik **Storage** di sidebar kiri
2. Klik **New Bucket** → buat 3 bucket ini:

| Bucket Name    | Public? | Keterangan                    |
|----------------|---------|-------------------------------|
| `photos`       | ✅ Yes  | Foto tamu                     |
| `voices`       | ✅ Yes  | Voice note tamu               |
| `couple-photos`| ✅ Yes  | Foto background pengantin     |

3. Untuk setiap bucket, masuk ke **Policies** → tambahkan:
   - `INSERT`: allow for all roles (agar tamu bisa upload)
   - `SELECT`: allow for all roles (agar semua bisa lihat)

---

## LANGKAH 4 — Ambil API Keys

1. Di sidebar Supabase → klik **Settings** (gear icon)
2. Klik **API**
3. Copy dua nilai ini:

```
Project URL:  https://xxxxxxxxxxxxxxxxxxxx.supabase.co
anon/public:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## LANGKAH 5 — Update Config di File HTML

Buka **kedua file** ini dan ganti nilai config:

### `virtual_photobooth_app.html`
Cari bagian `SUPABASE CONFIG` di dalam `<script>`:
```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxxxxxxxxxx.supabase.co'; // ← GANTI INI
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // ← GANTI INI
```

### `dashboard_pengantin.html`
Cari bagian yang sama dan ganti dengan nilai yang sama.

### `admin_panel_photobooth.html`
Sama, ganti nilai config Supabase.

---

## LANGKAH 6 — Buat Event Pertama

Jalankan SQL ini di Supabase SQL Editor (ganti sesuai data nyata):

```sql
INSERT INTO public.events (
  slug, couple_name, event_date, event_location, theme_color, is_active
) VALUES (
  'ahmad-siti-2024',           -- ← ini jadi URL: /?event=ahmad-siti-2024
  'Ahmad & Siti',
  '2024-12-14',
  'Gedung Serbaguna, Bandung',
  '#c9a96e',
  TRUE
);
```

Kalau mau upload foto pengantin sebagai background:
1. Supabase → Storage → `couple-photos` → Upload foto
2. Copy URL foto
3. Update baris `couple_photo_url` di tabel events:
```sql
UPDATE public.events 
SET couple_photo_url = 'https://xxxx.supabase.co/storage/v1/object/public/couple-photos/foto.jpg'
WHERE slug = 'ahmad-siti-2024';
```

---

## LANGKAH 7 — Deploy ke Netlify (gratis, 5 menit)

### Cara A — Drag & Drop (paling cepat)
1. Buka **https://netlify.com** → Login
2. Di dashboard Netlify, ada zona **"Drag and drop your site folder here"**
3. Buat folder baru, masukkan semua file HTML:
   ```
   📁 photobooth/
   ├── index.html          ← rename dari virtual_photobooth_app.html
   ├── dashboard.html      ← rename dari dashboard_pengantin.html
   └── admin.html          ← rename dari admin_panel_photobooth.html
   ```
4. Drag folder `photobooth/` ke Netlify
5. Netlify auto-generate URL seperti: `https://graceful-swan-123.netlify.app`

### Cara B — GitHub (lebih proper untuk update gampang)
1. Buat repo baru di GitHub
2. Upload semua file HTML ke repo
3. Di Netlify → **Add new site** → **Import from Git**
4. Connect GitHub → pilih repo → Deploy
5. Setiap kali push ke GitHub, Netlify auto-redeploy ✅

---

## LANGKAH 8 — Generate QR Code

QR Code yang discan tamu arahkan ke URL dengan parameter event:

```
https://graceful-swan-123.netlify.app/index.html?event=ahmad-siti-2024
```

Cara buat QR Code gratis:
- **https://qr-code-generator.com** 
- Atau di admin panel tab "QR Code" (sudah ada fitur generate)

---

## STRUKTUR URL FINAL

| Halaman           | URL                                               |
|-------------------|---------------------------------------------------|
| 🎴 Guest App       | `yoursite.netlify.app/?event=ahmad-siti-2024`    |
| 💒 Dashboard       | `yoursite.netlify.app/dashboard.html?event=ahmad-siti-2024` |
| ⚙️ Admin Panel     | `yoursite.netlify.app/admin.html`                |

---

## CHECKLIST SEBELUM HARI H

- [ ] Supabase project aktif dan schema sudah dijalankan
- [ ] Storage bucket `photos`, `voices`, `couple-photos` sudah ada
- [ ] Event sudah dibuat di tabel `events`
- [ ] API keys sudah di-update di semua file HTML
- [ ] Test dari HP: scan QR → isi nama → foto → voice note → kirim
- [ ] Cek dashboard: foto & voice note muncul realtime
- [ ] QR code sudah dicetak / disiapkan
- [ ] Pastikan venue punya WiFi yang stabil untuk tamu

---

## TIPS & TROUBLESHOOTING

### ❗ Kamera tidak muncul
- Pastikan URL pakai `https://` (kamera tidak bisa di `http://`)
- Di HP, buka browser Settings → izinkan kamera untuk situs ini

### ❗ Upload gagal
- Cek apakah API keys sudah benar
- Cek Supabase Storage → apakah bucket sudah ada dan policy sudah diset

### ❗ Dashboard tidak update realtime
- Pastikan sudah menjalankan `ALTER PUBLICATION supabase_realtime ADD TABLE submissions;`
- Cek browser console (F12) untuk error

### ❗ Foto tamu tidak muncul di dashboard
- Pastikan bucket `photos` sudah di-set **Public**
- Cek URL foto di tabel submissions, pastikan bisa diakses langsung

### 💡 Kalau mau custom domain (misal: photobooth.namaacara.com)
- Beli domain di Niagahoster/Domainesia (~Rp 100-150rb/tahun)
- Di Netlify: Site Settings → Domain Management → Add custom domain

---

## CARA TAMBAH EVENT BARU (untuk acara berbeda)

Cukup insert ke tabel `events` dengan slug berbeda:

```sql
INSERT INTO public.events (slug, couple_name, event_date, event_location)
VALUES ('budi-ani-2025', 'Budi & Ani', '2025-03-20', 'Hotel Savoy, Bandung');
```

Tamu baru scan QR yang link ke `?event=budi-ani-2025` — langsung berfungsi!

---

*Dibuat untuk Virtual Photobooth Project | Supabase + Vanilla JS + Netlify*
