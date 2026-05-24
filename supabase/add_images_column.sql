-- Migration to add images column to products table
-- Allows storing an array of product image URLs

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;
