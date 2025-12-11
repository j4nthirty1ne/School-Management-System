-- Migration: Remove capacity column from classes table
-- Description: Removes the capacity column that is no longer needed
-- Date: 2025-11-17

-- Drop the capacity column from classes table
ALTER TABLE public.classes DROP COLUMN IF EXISTS capacity;

-- Verify the column was dropped
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'classes' 
    AND column_name = 'capacity'
  ) THEN
    RAISE NOTICE 'Migration successful! Capacity column removed from classes table.';
  ELSE
    RAISE NOTICE 'Warning: Capacity column still exists in classes table.';
  END IF;
END $$;
