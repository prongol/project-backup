-- Add rejection_reason column to contracts table
-- This allows clients to request revisions with specific feedback

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add a column to track revision count
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;

-- Add column to track when work was rejected
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND column_name IN ('rejection_reason', 'revision_count', 'rejected_at');

COMMENT ON COLUMN contracts.rejection_reason IS 'Reason provided by client when requesting work revision';
COMMENT ON COLUMN contracts.revision_count IS 'Number of times work has been sent back for revision';
COMMENT ON COLUMN contracts.rejected_at IS 'Timestamp when work was most recently rejected';
