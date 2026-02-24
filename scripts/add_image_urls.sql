-- Migration to add multi-image support
-- Run this in your Supabase SQL Editor

ALTER TABLE public.garments 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Optional: Verify the column was added
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'garments' AND column_name = 'image_urls';
