-- Add bank_details_completed flag to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bank_details_completed BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_bank_details_completed 
ON profiles(bank_details_completed);

-- Update existing profiles with bank details to mark them as completed
UPDATE profiles
SET bank_details_completed = true
WHERE bank_details IS NOT NULL 
  AND bank_details != '{}'::jsonb
  AND bank_details_completed = false;

COMMENT ON COLUMN profiles.bank_details_completed IS 'Flag to track if user has completed bank details setup';
