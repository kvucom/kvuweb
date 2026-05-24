-- ============================================================
-- SQL Privileges Fix for Google Reviews Auto-Sync
-- Run this in your Supabase Dashboard SQL Editor (https://supabase.com)
-- ============================================================

-- 1. Grant SELECT (Read) access to anonymous and authenticated users
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;

-- 2. Grant ALL (Create/Read/Update/Delete) access to authenticated users (Admin) and service_role
GRANT ALL ON public.site_settings TO authenticated, service_role;
GRANT ALL ON public.reviews TO authenticated, service_role;

-- 3. Grant sequence permissions so ID auto-incrementing works properly
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
