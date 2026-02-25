-- ==========================================
-- PAYMENT & ESCROW SYSTEM
-- ==========================================
-- Run this SQL in your Supabase SQL Editor
-- ==========================================

-- Create escrow_accounts table
CREATE TABLE IF NOT EXISTS escrow_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  held_amount DECIMAL(10, 2) DEFAULT 0 CHECK (held_amount >= 0),
  released_amount DECIMAL(10, 2) DEFAULT 0 CHECK (released_amount >= 0),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'disputed', 'refunded'
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT check_amounts CHECK (held_amount + released_amount <= total_amount)
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  escrow_account_id UUID REFERENCES escrow_accounts(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  due_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'submitted', 'approved', 'paid', 'disputed'
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create transactions table (payment history)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  escrow_account_id UUID REFERENCES escrow_accounts(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  type VARCHAR(50) NOT NULL, -- 'deposit', 'release', 'refund', 'platform_fee', 'withdrawal'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'card', 'bank_account'
  brand VARCHAR(50), -- 'visa', 'mastercard', etc.
  last4 VARCHAR(4),
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  stripe_transfer_id VARCHAR(255),
  bank_account_last4 VARCHAR(4),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_escrow_contract 
ON escrow_accounts(contract_id);

CREATE INDEX IF NOT EXISTS idx_escrow_status 
ON escrow_accounts(status);

CREATE INDEX IF NOT EXISTS idx_milestones_contract 
ON milestones(contract_id);

CREATE INDEX IF NOT EXISTS idx_milestones_escrow 
ON milestones(escrow_account_id);

CREATE INDEX IF NOT EXISTS idx_milestones_status 
ON milestones(status);

CREATE INDEX IF NOT EXISTS idx_transactions_escrow 
ON transactions(escrow_account_id);

CREATE INDEX IF NOT EXISTS idx_transactions_milestone 
ON transactions(milestone_id);

CREATE INDEX IF NOT EXISTS idx_transactions_from_user 
ON transactions(from_user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_to_user 
ON transactions(to_user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_type_status 
ON transactions(type, status);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user 
ON payment_methods(user_id);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user 
ON withdrawals(user_id);

CREATE INDEX IF NOT EXISTS idx_withdrawals_status 
ON withdrawals(status);

-- Enable Row Level Security
ALTER TABLE escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for escrow_accounts
CREATE POLICY "Users can view own escrow accounts"
  ON escrow_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
      AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
  );

-- RLS Policies for milestones
CREATE POLICY "Users can view own milestones"
  ON milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
      AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
    )
  );

CREATE POLICY "Freelancers can update milestone status"
  ON milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_id
      AND c.freelancer_id = auth.uid()
    )
  );

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
  );

-- RLS Policies for payment_methods
CREATE POLICY "Users can manage own payment methods"
  ON payment_methods FOR ALL
  USING (user_id = auth.uid());

-- RLS Policies for withdrawals
CREATE POLICY "Users can manage own withdrawals"
  ON withdrawals FOR ALL
  USING (user_id = auth.uid());

-- ==========================================
-- HELPER FUNCTION: Create Escrow Account
-- ==========================================

CREATE OR REPLACE FUNCTION create_escrow_account(
  p_contract_id UUID,
  p_total_amount DECIMAL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_escrow_id UUID;
BEGIN
  INSERT INTO escrow_accounts (contract_id, total_amount, held_amount)
  VALUES (p_contract_id, p_total_amount, p_total_amount)
  RETURNING id INTO v_escrow_id;
  
  RETURN v_escrow_id;
END;
$$;

-- ==========================================
-- HELPER FUNCTION: Release Milestone Payment
-- ==========================================

CREATE OR REPLACE FUNCTION release_milestone_payment(
  p_milestone_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount DECIMAL;
  v_escrow_id UUID;
  v_contract_id UUID;
  v_client_id UUID;
  v_freelancer_id UUID;
BEGIN
  -- Get milestone details
  SELECT m.amount, m.escrow_account_id, m.contract_id
  INTO v_amount, v_escrow_id, v_contract_id
  FROM milestones m
  WHERE m.id = p_milestone_id
  AND m.status = 'approved';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get contract parties
  SELECT c.client_id, c.freelancer_id
  INTO v_client_id, v_freelancer_id
  FROM contracts c
  WHERE c.id = v_contract_id;
  
  -- Update escrow account
  UPDATE escrow_accounts
  SET 
    held_amount = held_amount - v_amount,
    released_amount = released_amount + v_amount,
    updated_at = NOW()
  WHERE id = v_escrow_id;
  
  -- Create transaction record
  INSERT INTO transactions (
    escrow_account_id,
    milestone_id,
    contract_id,
    from_user_id,
    to_user_id,
    amount,
    type,
    status,
    description
  ) VALUES (
    v_escrow_id,
    p_milestone_id,
    v_contract_id,
    v_client_id,
    v_freelancer_id,
    v_amount,
    'release',
    'completed',
    'Milestone payment released'
  );
  
  -- Update milestone status
  UPDATE milestones
  SET 
    status = 'paid',
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = p_milestone_id;
  
  RETURN TRUE;
END;
$$;

-- ==========================================
-- TRIGGER: Update updated_at timestamp
-- ==========================================

CREATE OR REPLACE FUNCTION update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_escrow_updated_at
  BEFORE UPDATE ON escrow_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

CREATE TRIGGER set_milestone_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

CREATE TRIGGER set_transaction_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

CREATE TRIGGER set_payment_method_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

CREATE TRIGGER set_withdrawal_updated_at
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

-- ==========================================
-- TRIGGER: Notify on milestone approval
-- ==========================================

CREATE OR REPLACE FUNCTION notify_on_milestone_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_freelancer_profile_id UUID;
  v_milestone_title VARCHAR;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Get freelancer profile_id
    SELECT c.freelancer_id, m.title
    INTO v_freelancer_profile_id, v_milestone_title
    FROM contracts c
    JOIN milestones m ON m.id = NEW.id
    WHERE c.id = NEW.contract_id;
    
    -- Create notification
    PERFORM create_notification(
      v_freelancer_profile_id,
      'milestone_approved',
      'Milestone Approved! 💰',
      format('"%s" has been approved. Payment will be released soon.', v_milestone_title),
      format('/milestones/%s', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_milestone_approval
  AFTER UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_milestone_approval();

-- ==========================================
-- VERIFICATION
-- ==========================================

SELECT 'Payment and escrow system created successfully!' AS status;
