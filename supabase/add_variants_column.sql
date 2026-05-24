-- Migration to add variants column to products table
-- Allows storing dynamic multi-variant settings for products

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb;

-- Ensure that the comments/documentations specify:
-- Expected JSON structure for variants:
-- [
--   {
--     "variant_name": "0.75 TO 1 TON/Hr",
--     "specs": [
--       { "label": "Required HP", "value": "14 HP" },
--       { "label": "Feed Grinder", "value": "Single Screen" },
--       { "label": "Feed Mixer", "value": "3x3 (250-300KGS)" },
--       { "label": "Screw Conveyor 1", "value": "8x8" },
--       { "label": "Screw Conveyor 2", "value": "8x10" }
--     ]
--   }
-- ]
