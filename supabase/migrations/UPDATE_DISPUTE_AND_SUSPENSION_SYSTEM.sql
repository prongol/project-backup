-- ============================================
-- COMPLETE DISPUTE & SUSPENSION SYSTEM
-- ============================================
-- Features:
-- 1. Both client and freelancer can file disputes
-- 2. Disputes route to admin dashboard
-- 3. Admin can resolve disputes
-- 4. Time-limited suspensions (20-30 days) with reasons
-- ============================================

-- Ensure dispute table exists (should already be created)
CREATE TABLE IF NOT EXISTS contract_disputes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  opened_by UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Who opened the dispute (client or freelancer)
  dispute_type VARCHAR(50) NOT NULL, -- 'payment_issue', 'quality_issue', 'scope_change', 'abandoned_work', 'refund_request', 'delivery_issue'
  reason TEXT NOT NULL,
  evidence JSONB DEFAULT '[]'::jsonb, -- Array of evidence files/links
  amount_disputed DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'under_review', 'resolved', 'closed'
  admin_assigned UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_type VARCHAR(50), -- 'full_refund', 'partial_refund', 'no_refund', 'additional_work', 'payment_released', 'contract_cancelled'
  resolution_details TEXT,
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure suspension fields exist in profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active', -- 'active', 'warning', 'suspended', 'banned'
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Which admin suspended
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 100; -- 0-100 scale

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_disputes_contract ON contract_disputes(contract_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON contract_disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_admin ON contract_disputes(admin_assigned);
CREATE INDEX IF NOT EXISTS idx_disputes_opened_by ON contract_disputes(opened_by);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended_until ON profiles(suspended_until);

-- Function to automatically lift suspensions when time expires
CREATE OR REPLACE FUNCTION lift_expired_suspensions()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if suspension has expired
  IF NEW.account_status = 'suspended' AND NEW.suspended_until IS NOT NULL AND NEW.suspended_until < NOW() THEN
    NEW.account_status := 'active';
    NEW.suspension_reason := NULL;
    NEW.suspended_until := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-lift suspensions on profile access
DROP TRIGGER IF EXISTS check_suspension_expiry ON profiles;
CREATE TRIGGER check_suspension_expiry
  BEFORE SELECT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION lift_expired_suspensions();

-- Function to check if user can file dispute (not suspended, part of contract)
CREATE OR REPLACE FUNCTION can_file_dispute(
  p_user_id UUID,
  p_contract_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_account_status VARCHAR(20);
  v_is_party BOOLEAN;
BEGIN
  -- Check if user is suspended
  SELECT account_status INTO v_account_status
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_account_status = 'suspended' OR v_account_status = 'banned' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is part of the contract (client or freelancer)
  SELECT EXISTS(
    SELECT 1 FROM contracts c
    JOIN jobs j ON c.job_id = j.id
    WHERE c.id = p_contract_id 
    AND (j.client_id = p_user_id OR c.freelancer_id = p_user_id)
  ) INTO v_is_party;
  
  RETURN v_is_party;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for disputes (both client and freelancer can view/create)
ALTER TABLE contract_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view disputes they're involved in" ON contract_disputes;
CREATE POLICY "Users can view disputes they're involved in"
  ON contract_disputes FOR SELECT
  USING (
    opened_by = auth.uid()
    OR admin_assigned = auth.uid()
    OR EXISTS (
      SELECT 1 FROM contracts c
      JOIN jobs j ON c.job_id = j.id
      WHERE c.id = contract_disputes.contract_id
      AND (j.client_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Users can create disputes for their contracts" ON contract_disputes;
CREATE POLICY "Users can create disputes for their contracts"
  ON contract_disputes FOR INSERT
  WITH CHECK (
    opened_by = auth.uid()
    AND can_file_dispute(auth.uid(), contract_id)
  );

DROP POLICY IF EXISTS "Admins can update disputes" ON contract_disputes;
CREATE POLICY "Admins can update disputes"
  ON contract_disputes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Grant permissions
GRANT ALL ON contract_disputes TO authenticated;
GRANT EXECUTE ON FUNCTION can_file_dispute TO authenticated;
GRANT EXECUTE ON FUNCTION lift_expired_suspensions TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE contract_disputes IS 'Stores disputes filed by clients or freelancers for admin resolution';
COMMENT ON COLUMN contract_disputes.opened_by IS 'User who filed the dispute (can be client or freelancer)';
COMMENT ON COLUMN profiles.account_status IS 'User account status: active, warning, suspended (temp), banned (permanent)';
COMMENT ON COLUMN profiles.suspended_until IS 'Automatic unsuspension date (typically 20-30 days)';
COMMENT ON COLUMN profiles.suspension_reason IS 'Public reason shown on user profile during suspension';
