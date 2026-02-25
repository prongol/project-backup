-- Add dispute-related change types to contract_history
-- Drop existing constraint
ALTER TABLE contract_history DROP CONSTRAINT IF EXISTS contract_history_change_type_check;

-- Add new constraint with additional change types
ALTER TABLE contract_history ADD CONSTRAINT contract_history_change_type_check 
  CHECK (change_type IN (
    'created', 
    'edited', 
    'signed_client', 
    'signed_freelancer', 
    'activated', 
    'completed', 
    'cancelled',
    'work_submitted',
    'work_approved',
    'work_rejected',
    'revision_submitted',
    'dispute_filed',
    'dispute_resolved'
  ));

-- Add comment
COMMENT ON COLUMN contract_history.change_type IS 'Type of change: created, edited, signed_client, signed_freelancer, activated, completed, cancelled, work_submitted, work_approved, work_rejected, revision_submitted, dispute_filed, dispute_resolved';

