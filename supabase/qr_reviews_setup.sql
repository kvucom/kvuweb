-- ============================================================
-- SQL Schema Setup for QR Code Reviews & Moderation Queue
-- Run this in your Supabase Dashboard SQL Editor
-- ============================================================

-- 1. Add approved and origin columns if they do not exist
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS origin text DEFAULT 'manual';

-- 2. Update existing reviews to be approved by default so they don't disappear
UPDATE public.reviews SET approved = true WHERE approved IS NULL;

-- 3. Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4. Re-create RLS policies for reviews

-- Drop old review policies
DROP POLICY IF EXISTS "Auth write reviews" ON public.reviews;
DROP POLICY IF EXISTS "Auth can manage own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public read for approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public insert for anonymous reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;

-- A. Authenticated users (Admins) can do everything
CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- B. Anonymous (Public) users can only view approved reviews
CREATE POLICY "Allow public read for approved reviews"
  ON public.reviews FOR SELECT TO anon
  USING (approved = true);

-- C. Anonymous (Public) users can submit reviews, but ONLY if they are set as unapproved (approved = false)
CREATE POLICY "Allow public insert for anonymous reviews"
  ON public.reviews FOR INSERT TO anon
  WITH CHECK (approved = false);

-- 5. Grant table privileges to anon and authenticated
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO authenticated, service_role;
