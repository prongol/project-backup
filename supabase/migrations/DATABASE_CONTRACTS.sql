-- =====================================================
-- CONTRACTS TABLE SCHEMA
-- For managing contracts between clients and freelancers
-- =====================================================

-- Drop existing table if needed
-- DROP TABLE IF EXISTS contract_milestones CASCADE;
-- DROP TABLE IF EXISTS contracts CASCADE;

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_freelancer ON contracts(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_job ON contracts(job_id);
CREATE INDEX IF NOT EXISTS idx_contracts_proposal ON contracts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at DESC);

-- Add foreign key constraints if the referenced tables exist
-- Note: These may fail if tables don't exist yet - that's okay
DO $$ 
BEGIN
  -- Try to add proposal_id foreign key
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proposals') THEN
    ALTER TABLE contracts 
    DROP CONSTRAINT IF EXISTS contracts_proposal_id_fkey;
    
    ALTER TABLE contracts 
    ADD CONSTRAINT contracts_proposal_id_fkey 
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE;
  END IF;

  -- Try to add job_id foreign key
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
    ALTER TABLE contracts 
    DROP CONSTRAINT IF EXISTS contracts_job_id_fkey;
    
    ALTER TABLE contracts 
    ADD CONSTRAINT contracts_job_id_fkey 
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
  END IF;

  -- Try to add client_id foreign key
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE contracts 
    DROP CONSTRAINT IF EXISTS contracts_client_id_fkey;
    
    ALTER TABLE contracts 
    ADD CONSTRAINT contracts_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  -- Try to add freelancer_id foreign key
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE contracts 
    DROP CONSTRAINT IF EXISTS contracts_freelancer_id_fkey;
    
    ALTER TABLE contracts 
    ADD CONSTRAINT contracts_freelancer_id_fkey 
    FOREIGN KEY (freelancer_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view contracts they're part of
CREATE POLICY "Users can view their own contracts"
  ON contracts FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = freelancer_id);

-- Clients can create contracts
CREATE POLICY "Clients can create contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Both parties can update contracts (for signing)
CREATE POLICY "Contract parties can update contracts"
  ON contracts FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = freelancer_id);

-- Only contract parties can delete (cancel)
CREATE POLICY "Contract parties can delete contracts"
  ON contracts FOR DELETE
  USING (auth.uid() = client_id OR auth.uid() = freelancer_id);

-- Create milestones table for milestone-based contracts
CREATE TABLE IF NOT EXISTS contract_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  due_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'paid', 'rejected')),
  completed_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for milestones
CREATE INDEX IF NOT EXISTS idx_contract_milestones_contract ON contract_milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_milestones_status ON contract_milestones(status);

-- Enable RLS for milestones
ALTER TABLE contract_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for milestones
CREATE POLICY "Users can view milestones of their contracts"
  ON contract_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_milestones.contract_id
      AND (contracts.client_id = auth.uid() OR contracts.freelancer_id = auth.uid())
    )
  );

CREATE POLICY "Contract parties can manage milestones"
  ON contract_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_milestones.contract_id
      AND (contracts.client_id = auth.uid() OR contracts.freelancer_id = auth.uid())
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contracts
DROP TRIGGER IF EXISTS update_contracts_updated_at_trigger ON contracts;
CREATE TRIGGER update_contracts_updated_at_trigger
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contracts_updated_at();

-- Create trigger for milestones
DROP TRIGGER IF EXISTS update_contract_milestones_updated_at_trigger ON contract_milestones;
CREATE TRIGGER update_contract_milestones_updated_at_trigger
  BEFORE UPDATE ON contract_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_contracts_updated_at();

-- Grant permissions
GRANT ALL ON contracts TO authenticated;
GRANT ALL ON contract_milestones TO authenticated;
