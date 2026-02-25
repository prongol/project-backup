-- Add bank details to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{}'::jsonb;

-- Bank details structure will be:
-- {
--   "account_holder_name": "John Doe",
--   "bank_name": "Example Bank",
--   "account_number": "1234567890",
--   "routing_number": "123456789",
--   "swift_code": "EXAMPXXX",
--   "country": "US"
-- }

-- Add platform fee tracking to contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS platform_fee_percentage DECIMAL(5,2) DEFAULT 7.00;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS freelancer_net_amount DECIMAL(12,2) DEFAULT 0;

-- Add platform fee tracking to milestones
ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS platform_fee_percentage DECIMAL(5,2) DEFAULT 7.00;
ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS freelancer_net_amount DECIMAL(12,2) DEFAULT 0;

-- Create platform_transactions table to track all fees
-- Note: milestone_id type matches contract_milestones.id type (check if UUID or TEXT)
CREATE TABLE IF NOT EXISTS platform_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  milestone_id TEXT,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('contract_payment', 'milestone_payment', 'refund')),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  freelancer_id UUID REFERENCES freelancers(id) ON DELETE SET NULL,
  gross_amount DECIMAL(12,2) NOT NULL,
  platform_fee_amount DECIMAL(12,2) NOT NULL,
  freelancer_net_amount DECIMAL(12,2) NOT NULL,
  platform_fee_percentage DECIMAL(5,2) DEFAULT 7.00,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
  transaction_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint for milestone_id if contract_milestones exists and has compatible type
-- Check the actual type of contract_milestones.id first
DO $$
BEGIN
  -- Try to add foreign key if contract_milestones table exists and types are compatible
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'contract_milestones'
  ) THEN
    -- Add foreign key constraint
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'platform_transactions_milestone_id_fkey'
    ) THEN
      EXECUTE 'ALTER TABLE platform_transactions 
               ADD CONSTRAINT platform_transactions_milestone_id_fkey 
               FOREIGN KEY (milestone_id) 
               REFERENCES contract_milestones(id) 
               ON DELETE SET NULL';
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If foreign key fails, just log and continue (milestone_id will remain as reference without FK)
    RAISE NOTICE 'Could not add milestone foreign key constraint. Milestone ID will be stored as reference.';
END $$;

-- Create indexes for platform_transactions
CREATE INDEX IF NOT EXISTS idx_platform_transactions_contract ON platform_transactions(contract_id);
CREATE INDEX IF NOT EXISTS idx_platform_transactions_milestone ON platform_transactions(milestone_id);
CREATE INDEX IF NOT EXISTS idx_platform_transactions_client ON platform_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_platform_transactions_freelancer ON platform_transactions(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_platform_transactions_status ON platform_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_platform_transactions_date ON platform_transactions(transaction_date);

-- Enable RLS for platform_transactions
ALTER TABLE platform_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'platform_transactions' 
    AND policyname = 'Users can view their own transactions'
  ) THEN
    CREATE POLICY "Users can view their own transactions"
      ON platform_transactions FOR SELECT
      USING (
        client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
        OR freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid())
      );
  END IF;
END $$;

-- Add comments
COMMENT ON TABLE platform_transactions IS 'Tracks all platform fees and payment transactions';
COMMENT ON COLUMN profiles.bank_details IS 'Stores bank account information for payment transfers (encrypted in production)';
COMMENT ON COLUMN contracts.platform_fee_percentage IS 'Platform commission percentage (default 7%)';
COMMENT ON COLUMN contracts.platform_fee_amount IS 'Calculated platform fee amount';
COMMENT ON COLUMN contracts.freelancer_net_amount IS 'Amount freelancer receives after platform fee';
