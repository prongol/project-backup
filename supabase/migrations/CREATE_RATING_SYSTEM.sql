-- Rating & Review System Setup
-- Run this in Supabase SQL Editor

-- 1. Create the reviews table if it doesn't exist
-- Aligned with PHASE_4_5_COMPLETE.md documentation
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_type VARCHAR(20) NOT NULL CHECK (reviewer_type IN ('freelancer', 'client')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(contract_id, reviewer_id)
);

-- 2. Add rating-related columns to profiles if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- 3. Function to update profile rating when a new review is added
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    avg_rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE reviewee_id = NEW.reviewee_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id)
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger to update profile rating
DROP TRIGGER IF EXISTS trigger_update_profile_rating ON reviews;
CREATE TRIGGER trigger_update_profile_rating
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_rating();

-- 5. RLS Policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public reviews" ON reviews;
CREATE POLICY "Anyone can view public reviews"
  ON reviews FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Users can create their own reviews" ON reviews;
CREATE POLICY "Users can create their own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);
