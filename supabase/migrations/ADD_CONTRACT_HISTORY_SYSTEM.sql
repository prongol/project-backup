-- Add editable flag to contracts (client can edit until freelancer signs)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT true;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES profiles(id);

-- Create contract_history table to track all changes
CREATE TABLE IF NOT EXISTS contract_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  edited_by UUID REFERENCES profiles(id),
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('created', 'edited', 'signed_client', 'signed_freelancer', 'activated', 'completed', 'cancelled')),
  changes JSONB DEFAULT '{}'::jsonb,
  -- Changes structure will be:
  -- {
  --   "field": "title",
  --   "old_value": "Original Title",
  --   "new_value": "Updated Title"
  -- }
  previous_data JSONB DEFAULT '{}'::jsonb,
  new_data JSONB DEFAULT '{}'::jsonb,
  change_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for contract_history
CREATE INDEX IF NOT EXISTS idx_contract_history_contract ON contract_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_history_edited_by ON contract_history(edited_by);
CREATE INDEX IF NOT EXISTS idx_contract_history_created_at ON contract_history(created_at);
CREATE INDEX IF NOT EXISTS idx_contract_history_change_type ON contract_history(change_type);

-- Enable RLS for contract_history
ALTER TABLE contract_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contract_history' 
    AND policyname = 'Users can view contract history they are part of'
  ) THEN
    CREATE POLICY "Users can view contract history they are part of"
      ON contract_history FOR SELECT
      USING (
        contract_id IN (
          SELECT id FROM contracts 
          WHERE client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
          OR freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid())
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contract_history' 
    AND policyname = 'Users can insert contract history for their contracts'
  ) THEN
    CREATE POLICY "Users can insert contract history for their contracts"
      ON contract_history FOR INSERT
      WITH CHECK (
        contract_id IN (
          SELECT id FROM contracts 
          WHERE client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
          OR freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid())
        )
      );
  END IF;
END $$;

-- Add comments
COMMENT ON TABLE contract_history IS 'Tracks all changes made to contracts including edits, signatures, and status changes';
COMMENT ON COLUMN contracts.is_editable IS 'Determines if contract can be edited by client (false after freelancer signs)';
COMMENT ON COLUMN contracts.last_edited_at IS 'Timestamp of last contract edit';
COMMENT ON COLUMN contracts.edited_by IS 'Profile ID of user who last edited the contract';
COMMENT ON COLUMN contract_history.changes IS 'Detailed JSON of what changed in the contract';
COMMENT ON COLUMN contract_history.change_summary IS 'Human-readable summary of changes';

-- Function to automatically record contract changes
CREATE OR REPLACE FUNCTION record_contract_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Record edit in history when contract is modified (excluding status-only changes)
  IF (TG_OP = 'UPDATE' AND (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.total_amount IS DISTINCT FROM NEW.total_amount OR
    OLD.end_date IS DISTINCT FROM NEW.end_date OR
    OLD.contract_type IS DISTINCT FROM NEW.contract_type
  )) THEN
    INSERT INTO contract_history (
      contract_id,
      edited_by,
      change_type,
      previous_data,
      new_data,
      change_summary
    ) VALUES (
      NEW.id,
      NEW.edited_by,
      'edited',
      jsonb_build_object(
        'title', OLD.title,
        'description', OLD.description,
        'total_amount', OLD.total_amount,
        'end_date', OLD.end_date,
        'contract_type', OLD.contract_type
      ),
      jsonb_build_object(
        'title', NEW.title,
        'description', NEW.description,
        'total_amount', NEW.total_amount,
        'end_date', NEW.end_date,
        'contract_type', NEW.contract_type
      ),
      'Contract details updated'
    );
    
    -- Update last_edited_at
    NEW.last_edited_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic history recording
DROP TRIGGER IF EXISTS contract_change_trigger ON contracts;
CREATE TRIGGER contract_change_trigger
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION record_contract_change();
