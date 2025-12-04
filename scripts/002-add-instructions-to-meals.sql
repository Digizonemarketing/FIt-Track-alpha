-- Migration: Add instructions column to meals table
-- This column stores step-by-step cooking instructions as a text array

ALTER TABLE meals
ADD COLUMN IF NOT EXISTS instructions TEXT[];

-- Add a comment for documentation
COMMENT ON COLUMN meals.instructions IS 'Array of step-by-step cooking instructions for the meal';
