-- ============================================================
-- SQL Script for Google Reviews Auto-Sync
-- Run this in your Supabase Dashboard SQL Editor (https://supabase.com)
-- ============================================================

-- 1. Add origin and is_hidden columns to public.reviews table
ALTER TABLE public.reviews 
  ADD COLUMN IF NOT EXISTS origin VARCHAR DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- 2. Create site_settings table to store configuration and state
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 3. Populate default settings (Replace Place ID with your actual Google Place ID)
INSERT INTO public.site_settings (key, value) VALUES 
  ('google_place_id', 'ChIJN1t_tDeuEmsRUsoyG83frY4'),
  ('last_review_sync', '1970-01-01T00:00:00.000Z')
ON CONFLICT (key) DO NOTHING;

-- 4. Enable Row Level Security (RLS) on site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS Policies for site_settings
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can manage site settings" ON public.site_settings;
CREATE POLICY "Authenticated can manage site settings" ON public.site_settings
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 6. Verify or add SELECT policy on reviews so anyone can read reviews that are NOT hidden
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
CREATE POLICY "Public can view reviews" ON public.reviews
  FOR SELECT USING (is_hidden = FALSE);
