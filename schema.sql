-- ================================================================
--  VIRTUAL PHOTOBOOTH — SUPABASE SCHEMA
--  Jalankan di: Supabase Dashboard → SQL Editor → New Query
--  Urutan: jalankan satu blok per blok dari atas ke bawah
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- 1. TABEL EVENTS (data per acara/wedding)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT        UNIQUE NOT NULL,       -- "ahmad-siti-2024" → URL: /?event=ahmad-siti-2024
  couple_name      TEXT        NOT NULL,              -- "Ahmad & Siti"
  event_date       DATE,                              -- Tanggal acara
  event_location   TEXT,                              -- "Gedung Serbaguna, Bandung"
  couple_photo_url TEXT,                              -- Background foto pengantin di dashboard
  theme_color      TEXT        DEFAULT '#c9a96e',     -- Warna tema utama (emas)
  allow_voice      BOOLEAN     DEFAULT TRUE,          -- Fitur voice note aktif?
  allow_chat       BOOLEAN     DEFAULT TRUE,          -- Fitur pesan teks aktif?
  require_name     BOOLEAN     DEFAULT TRUE,          -- Wajib isi nama?
  allow_retake     BOOLEAN     DEFAULT TRUE,          -- Boleh retake foto?
  is_active        BOOLEAN     DEFAULT TRUE,          -- Event aktif? (bisa dinonaktifkan setelah acara)
  max_guests       INTEGER     DEFAULT 500,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 2. TABEL FRAMES (bingkai polaroid per event)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.frames (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID        REFERENCES public.events(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,              -- "Garden Rose", "Vintage Gold", dll
  svg_code    TEXT,                              -- SVG inline (jika bingkai SVG)
  png_url     TEXT,                              -- URL PNG transparan (jika upload gambar)
  is_active   BOOLEAN     DEFAULT TRUE,
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 3. TABEL SUBMISSIONS (kiriman tamu)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.submissions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID        REFERENCES public.events(id) ON DELETE CASCADE,
  guest_name   TEXT        NOT NULL,             -- Nama tamu
  photo_url    TEXT,                             -- URL foto di Storage bucket "photos"
  voice_url    TEXT,                             -- URL voice note di bucket "voices" (nullable)
  message_text TEXT,                             -- Pesan teks ucapan dari tamu (nullable)
  frame_name   TEXT,                             -- Nama bingkai yang dipilih
  frame_index  INTEGER     DEFAULT 0,            -- Index bingkai (0-3)
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk query cepat berdasarkan event_id
CREATE INDEX IF NOT EXISTS idx_submissions_event_id ON public.submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);


-- ================================================================
-- STORAGE BUCKETS
-- Catatan: Bisa dibuat manual di Dashboard → Storage → New Bucket
-- Atau jalankan SQL ini (butuh akses service_role)
-- ================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('photos',         'photos',         TRUE, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('voices',         'voices',         TRUE, 20971520, ARRAY['audio/webm','audio/mp4','audio/ogg']),
  ('couple-photos',  'couple-photos',  TRUE, 20971520, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Aktifkan RLS untuk semua tabel
ALTER TABLE public.events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frames      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- ── EVENTS ──
-- Siapa pun bisa baca (untuk validasi slug di guest app)
DROP POLICY IF EXISTS "events_select_public" ON public.events;
CREATE POLICY "events_select_public" ON public.events
  FOR SELECT USING (true);

-- Diubah agar public/anon bisa modifikasi (karena admin panel berjalan client-side tanpa login)
DROP POLICY IF EXISTS "events_modify_public" ON public.events;
CREATE POLICY "events_modify_public" ON public.events
  FOR ALL USING (true)
  WITH CHECK (true);

-- ── FRAMES ──
DROP POLICY IF EXISTS "frames_select_public" ON public.frames;
CREATE POLICY "frames_select_public" ON public.frames
  FOR SELECT USING (true);

-- Diubah agar public/anon bisa modifikasi (tambah/hapus frame dari admin panel)
DROP POLICY IF EXISTS "frames_modify_public" ON public.frames;
CREATE POLICY "frames_modify_public" ON public.frames
  FOR ALL USING (true)
  WITH CHECK (true);

-- ── SUBMISSIONS ──
-- Tamu (tidak login) bisa INSERT kiriman mereka
DROP POLICY IF EXISTS "submissions_insert_public" ON public.submissions;
CREATE POLICY "submissions_insert_public" ON public.submissions
  FOR INSERT WITH CHECK (true);

-- Dashboard pengantin dan admin bisa baca semua kiriman
DROP POLICY IF EXISTS "submissions_select_public" ON public.submissions;
CREATE POLICY "submissions_select_public" ON public.submissions
  FOR SELECT USING (true);

-- Hanya admin yang bisa hapus/edit
DROP POLICY IF EXISTS "submissions_modify_admin" ON public.submissions;
CREATE POLICY "submissions_modify_admin" ON public.submissions
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "submissions_delete_admin" ON public.submissions;
CREATE POLICY "submissions_delete_admin" ON public.submissions
  FOR DELETE USING (auth.role() = 'authenticated');


-- ================================================================
-- STORAGE POLICIES
-- ================================================================

-- PHOTOS: tamu (anonymous) bisa upload foto, semua bisa lihat
DROP POLICY IF EXISTS "photos_public_upload" ON storage.objects;
CREATE POLICY "photos_public_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos');

DROP POLICY IF EXISTS "photos_public_read" ON storage.objects;
CREATE POLICY "photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

-- VOICES: tamu (anonymous) bisa upload suara, semua bisa putar
DROP POLICY IF EXISTS "voices_public_upload" ON storage.objects;
CREATE POLICY "voices_public_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'voices');

DROP POLICY IF EXISTS "voices_public_read" ON storage.objects;
CREATE POLICY "voices_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'voices');

-- COUPLE-PHOTOS: tamu/admin bisa upload foto pengantin (karena admin panel client-side)
DROP POLICY IF EXISTS "couple_photos_admin_upload" ON storage.objects;
CREATE POLICY "couple_photos_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'couple-photos');

DROP POLICY IF EXISTS "couple_photos_public_read" ON storage.objects;
CREATE POLICY "couple_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'couple-photos');


-- ================================================================
-- REALTIME — aktifkan untuk tabel submissions
-- Dashboard pengantin akan auto-refresh saat ada kiriman baru
-- ================================================================
-- Hapus jika sudah ada untuk menghindari error 42710
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;


-- ================================================================
-- SAMPLE DATA — untuk testing di mode demo
-- ================================================================
INSERT INTO public.events (
  slug, couple_name, event_date, event_location, theme_color, is_active
) VALUES (
  'demo',
  'Ahmad & Siti',
  '2024-12-14',
  'Gedung Serbaguna, Bandung',
  '#c9a96e',
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- ================================================================
-- VERIFIKASI — cek apakah semua sudah terbuat
-- ================================================================
SELECT 'events' as tabel, count(*) as jumlah FROM public.events
UNION ALL
SELECT 'frames', count(*) FROM public.frames
UNION ALL
SELECT 'submissions', count(*) FROM public.submissions;
