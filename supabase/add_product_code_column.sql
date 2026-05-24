-- Migration to add product_code column to products table
-- Allows storing standard model or product identifier codes (e.g. KVUTKC-6, KVUNC-8)

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_code text;
