-- ============================================================
-- CalorieSnap - Initial Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Meal type enum
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- Meals table
CREATE TABLE meals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   TEXT NOT NULL,
  image_url   TEXT,
  dish_name   TEXT NOT NULL,
  calories    INTEGER NOT NULL,
  protein_g   REAL NOT NULL DEFAULT 0,
  carbs_g     REAL NOT NULL DEFAULT 0,
  fat_g       REAL NOT NULL DEFAULT 0,
  meal_type   meal_type NOT NULL DEFAULT 'snack',
  confidence  REAL NOT NULL DEFAULT 0.5,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-device date queries
CREATE INDEX idx_meals_device_created ON meals (device_id, created_at DESC);

-- Row Level Security (open policy for Phase 1 — no auth yet)
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for Phase 1"
  ON meals FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Storage bucket for meal images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-images', 'meal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads and reads (Phase 1)
CREATE POLICY "Allow public uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'meal-images');

CREATE POLICY "Allow public reads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'meal-images');

CREATE POLICY "Allow public deletes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'meal-images');
