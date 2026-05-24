-- ============================================================
-- SQL Fix for media_items type check constraint
-- Run this in your Supabase Dashboard SQL Editor
-- ============================================================

-- 1. Drop the old constraint if it exists
ALTER TABLE public.media_items DROP CONSTRAINT IF EXISTS media_items_type_check;

-- 2. Add the updated constraint that allows 'image', 'video', and 'embed'
ALTER TABLE public.media_items ADD CONSTRAINT media_items_type_check CHECK (type IN ('image', 'video', 'embed'));
