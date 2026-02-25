-- Fix RLS policies for escrow_accounts and milestones
-- The previous policies compared table-specific IDs (client_id, freelancer_id) 
-- directly with auth.uid() (which is a profile_id), causing them to always fail.

-- 0. Clean up duplicate escrow rows, then add unique constraint
-- Keep only the most recent escrow row per contract_id
DELETE FROM escrow_accounts
WHERE id NOT IN (
  SELECT DISTINCT ON (contract_id) id
  FROM escrow_accounts
  ORDER BY contract_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST
);

-- Now create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_escrow_contract_unique ON escrow_accounts(contract_id);

-- 1. Fix escrow_accounts policies
DROP POLICY IF EXISTS "Users can view own escrow accounts" ON escrow_accounts;
CREATE POLICY "Users can view own escrow accounts"
  ON escrow_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = escrow_accounts.contract_id
      AND (
        c.client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
        OR 
        c.freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid())
      )
    )
  );

-- 2. Fix milestones policies
DROP POLICY IF EXISTS "Users can view own milestones" ON milestones;
CREATE POLICY "Users can view own milestones"
  ON milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = milestones.contract_id
      AND (
        c.client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
        OR 
        c.freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Freelancers can update milestone status" ON milestones;
CREATE POLICY "Freelancers can update milestone status"
  ON milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = milestones.contract_id
      AND c.freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid())
    )
  );

-- 3. Also fix transactions if they were broken (checking)
-- The transactions table uses from_user_id and to_user_id which are profile IDs,
-- so those should be fine, but let's make sure there's a policy for viewing by contract too if needed.
-- Current policy: from_user_id = auth.uid() OR to_user_id = auth.uid()
-- This is fine for direct participants.

-- 4. Ensure payment_methods RLS is correct
DROP POLICY IF EXISTS "Users can manage own payment methods" ON payment_methods;
CREATE POLICY "Users can manage own payment methods"
  ON payment_methods FOR ALL
  USING (user_id = auth.uid()); -- This is correct as user_id is profile_id

-- 5. Ensure withdrawals RLS is correct
DROP POLICY IF EXISTS "Users can manage own withdrawals" ON withdrawals;
CREATE POLICY "Users can manage own withdrawals"
  ON withdrawals FOR ALL
  USING (user_id = auth.uid()); -- This is correct as user_id is profile_id

-- 6. Fix proposal notification trigger - broken links and wrong join
CREATE OR REPLACE FUNCTION notify_on_proposal()
RETURNS TRIGGER AS $$
DECLARE
  v_client_profile_id UUID;
  v_job_title VARCHAR;
  v_freelancer_name VARCHAR;
BEGIN
  -- Get client profile_id (through clients table) and job title
  SELECT c.profile_id, j.title
  INTO v_client_profile_id, v_job_title
  FROM jobs j
  JOIN clients c ON c.id = j.client_id
  WHERE j.id = NEW.job_id;
  
  -- Get freelancer name (freelancers.profile_id -> profiles.id)
  SELECT p.full_name
  INTO v_freelancer_name
  FROM freelancers f
  JOIN profiles p ON p.id = f.profile_id
  WHERE f.id = NEW.freelancer_id;
  
  -- Create notification for client with a valid link
  IF v_client_profile_id IS NOT NULL THEN
    PERFORM create_notification(
      v_client_profile_id,
      'proposal_received',
      'New Proposal Received',
      format('%s submitted a proposal for "%s"', COALESCE(v_freelancer_name, 'A freelancer'), v_job_title),
      format('/client/proposals?job=%s', NEW.job_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
