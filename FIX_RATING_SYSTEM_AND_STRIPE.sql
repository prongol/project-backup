-- ==========================================
-- FIX RATING SYSTEM & STRIPE ESCROW
-- ==========================================
-- This file fixes two issues:
-- 1. Missing 'reviews' table preventing rating system from working
-- 2. Provides guidance on Stripe escrow funds location
-- ==========================================

-- PART 1: CREATE REVIEWS TABLE
-- ==========================================

-- Create the reviews table
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

-- Add rating columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_contract ON reviews(contract_id);

-- Function to update profile rating when review is added/updated
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    avg_rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE reviewee_id = NEW.reviewee_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id),
    updated_at = TIMEZONE('utc', NOW())
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update profile ratings
DROP TRIGGER IF EXISTS trigger_update_profile_rating ON reviews;
CREATE TRIGGER trigger_update_profile_rating
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_rating();

-- Function to recalculate ratings when review is deleted
CREATE OR REPLACE FUNCTION recalculate_profile_rating_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    avg_rating = COALESCE((SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE reviewee_id = OLD.reviewee_id), 0),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = OLD.reviewee_id),
    updated_at = TIMEZONE('utc', NOW())
  WHERE id = OLD.reviewee_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for review deletion
DROP TRIGGER IF EXISTS trigger_recalculate_rating_on_delete ON reviews;
CREATE TRIGGER trigger_recalculate_rating_on_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_profile_rating_on_delete();

-- ==========================================
-- PART 2: RLS POLICIES FOR REVIEWS
-- ==========================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view public reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews for contracts they're part of" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;

-- Policy: Anyone can view public reviews
CREATE POLICY "Anyone can view public reviews"
  ON reviews FOR SELECT
  USING (is_public = true);

-- Policy: Users can view their own reviews (even if not public)
CREATE POLICY "Users can view their own reviews"
  ON reviews FOR SELECT
  USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

-- Policy: Users can create reviews for contracts they're part of
CREATE POLICY "Users can create reviews for contracts they're part of"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_id
      AND (
        -- User must be client or freelancer of the contract
        EXISTS (SELECT 1 FROM clients WHERE clients.id = contracts.client_id AND clients.profile_id = auth.uid())
        OR EXISTS (SELECT 1 FROM freelancers WHERE freelancers.id = contracts.freelancer_id AND freelancers.profile_id = auth.uid())
      )
    )
  );

-- Policy: Users can update their own reviews (within reasonable time)
CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- ==========================================
-- PART 3: CLEAN UP MOCK/DEMO RATING DATA
-- ==========================================

-- Remove hardcoded ratings from freelancers table (set to 0 until real reviews accumulate)
UPDATE freelancers 
SET 
  rating = 0,
  total_reviews = 0
WHERE rating IS NOT NULL OR total_reviews > 0;

-- Remove hardcoded ratings from profiles table (set to 0 until real reviews accumulate)
UPDATE profiles 
SET 
  avg_rating = 0,
  total_reviews = 0
WHERE avg_rating IS NOT NULL OR total_reviews > 0;

-- Optional: Delete sample freelancer data if it exists (uncomment if you want to remove demo freelancers)
/*
DELETE FROM freelancers 
WHERE username IN (
  'sarah_webdev', 'alex_designer', 'mike_mobile', 'emma_writer', 'david_backend',
  'anjali_designs', 'bikash_dev', 'kritika_writes', 'dipesh_market', 'srijana_video'
);
*/

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check if reviews table was created successfully
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
    RAISE NOTICE '✅ Reviews table created successfully';
  ELSE
    RAISE WARNING '❌ Reviews table was not created';
  END IF;
END $$;

-- Check if profile rating columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avg_rating'
  ) THEN
    RAISE NOTICE '✅ Profile rating columns added successfully';
  ELSE
    RAISE WARNING '❌ Profile rating columns not found';
  END IF;
END $$;

-- Check that mock ratings were cleared
DO $$
DECLARE
  freelancer_count INTEGER;
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO freelancer_count FROM freelancers WHERE rating > 0 OR total_reviews > 0;
  SELECT COUNT(*) INTO profile_count FROM profiles WHERE avg_rating > 0 OR total_reviews > 0;
  
  IF freelancer_count = 0 AND profile_count = 0 THEN
    RAISE NOTICE '✅ Mock rating data cleared successfully';
  ELSE
    RAISE WARNING '⚠️  Found % freelancers and % profiles with ratings', freelancer_count, profile_count;
  END IF;
END $$;

-- ==========================================
-- STRIPE FUNDS LOCATION GUIDE
-- ==========================================

/*
╔══════════════════════════════════════════════════════════════════════════╗
║                    WHERE TO FIND YOUR STRIPE FUNDS                       ║
╚══════════════════════════════════════════════════════════════════════════╝

Your terminal logs show:
  "Falling back to platform escrow: Your destination account needs to have 
   the stripe_balance.stripe_transfers feature enabled."

This means:
  ✅ FUNDS ARE IN YOUR PLATFORM STRIPE ACCOUNT (not a separate escrow account)
  ✅ Payment was successful: POST /api/stripe/escrow 200 in 2192ms
  ✅ Amount secured: $34.00 (from your contract)

HOW TO FIND THE FUNDS:
  1. Go to: https://dashboard.stripe.com/test/payments
     (or https://dashboard.stripe.com/payments for live mode)
  
  2. Look for payment with:
     - Amount: $34.00
     - Status: "Requires capture" or "Succeeded"
     - Description: Contains contract ID "bbd0b8cd-2c70-4cc3-b3b2-cd3bb34788ad"
  
  3. Or search by Payment Intent ID in your database:
     - Check escrow_accounts table
     - Look at stripe_payment_intent_id column
     - Search that ID in Stripe dashboard

WHY "REQUIRES CAPTURE":
  - Funds are authorized but not yet captured
  - They're held on the customer's card
  - When work is approved, funds get captured and released to freelancer
  - This is the escrow mechanism working correctly

BALANCES TO CHECK:
  1. Stripe Dashboard → Balances
  2. Look for "Available" balance (funds already captured)
  3. Look for "Pending" balance (funds authorized but not captured)

DATABASE VERIFICATION:
  Run this query in Supabase SQL Editor to see your escrow records:
  
  SELECT 
    ea.id,
    ea.contract_id,
    ea.total_amount,
    ea.held_amount,
    ea.status,
    ea.stripe_payment_intent_id,
    ea.created_at,
    c.title as contract_title,
    c.status as contract_status
  FROM escrow_accounts ea
  JOIN contracts c ON c.id = ea.contract_id
  ORDER BY ea.created_at DESC
  LIMIT 10;

*/
