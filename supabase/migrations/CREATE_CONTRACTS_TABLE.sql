-- Complete Contracts Table Creation Script
-- Run this if your contracts table is missing columns or needs to be recreated

-- Drop and recreate the table (WARNING: This will delete all existing data)
-- Uncomment the next line only if you want to start fresh
-- DROP TABLE IF EXISTS contracts CASCADE;

-- Create contracts table with all required columns
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  proposal_id UUID,
  job_id UUID,
  client_id UUID NOT NULL,
  freelancer_id UUID NOT NULL,
  
  -- Contract details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  contract_type VARCHAR(50) CHECK (contract_type IN ('fixed_price', 'hourly', 'milestone')),
  
  -- Financial details
  total_amount DECIMAL(12, 2) NOT NULL,
  hourly_rate DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'NPR',
  
  -- Timeline
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  estimated_hours INTEGER,
  
  -- Terms and conditions
  terms TEXT,
  deliverables TEXT,
  payment_terms TEXT,
  custom_fields JSONB DEFAULT '{}',
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'disputed')),
  
  -- Signatures
  client_signed_at TIMESTAMP,
  freelancer_signed_at TIMESTAMP,
  client_signature TEXT,
  freelancer_signature TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_freelancer ON contracts(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_job ON contracts(job_id);
CREATE INDEX IF NOT EXISTS idx_contracts_proposal ON contracts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at DESC);

-- Add foreign key constraints (if tables exist)
DO $$ 
BEGIN
  -- Add proposal_id foreign key if proposals table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proposals') THEN
    ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_proposal_id_fkey;
    ALTER TABLE contracts ADD CONSTRAINT contracts_proposal_id_fkey 
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE SET NULL;
  END IF;

  -- Add job_id foreign key if jobs table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
    ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_job_id_fkey;
    ALTER TABLE contracts ADD CONSTRAINT contracts_job_id_fkey 
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;
  END IF;

  -- Add client_id foreign key if profiles table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_client_id_fkey;
    ALTER TABLE contracts ADD CONSTRAINT contracts_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  -- Add freelancer_id foreign key if profiles table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_freelancer_id_fkey;
    ALTER TABLE contracts ADD CONSTRAINT contracts_freelancer_id_fkey 
    FOREIGN KEY (freelancer_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own contracts" ON contracts;
DROP POLICY IF EXISTS "Clients can create contracts" ON contracts;
DROP POLICY IF EXISTS "Contract parties can update contracts" ON contracts;

-- Create RLS policies
CREATE POLICY "Users can view their own contracts" ON contracts
  FOR SELECT
  USING (
    auth.uid() = client_id OR 
    auth.uid() = freelancer_id
  );

CREATE POLICY "Clients can create contracts" ON contracts
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Contract parties can update contracts" ON contracts
  FOR UPDATE
  USING (
    auth.uid() = client_id OR 
    auth.uid() = freelancer_id
  );

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'contracts'
ORDER BY ordinal_position;
