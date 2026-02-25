-- Add payment and escrow fields to contracts table
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS completion_note TEXT,
ADD COLUMN IF NOT EXISTS approval_note TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'held', 'approved', 'released', 'refunded', 'disputed')),
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS freelancer_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_release_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS released_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dispute_status TEXT CHECK (dispute_status IN ('pending', 'under_review', 'resolved_client', 'resolved_freelancer', 'resolved_split'));

-- Update the status constraint to include new statuses
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
ALTER TABLE contracts ADD CONSTRAINT contracts_status_check 
CHECK (status IN ('pending', 'active', 'pending_completion', 'approved', 'completed', 'cancelled', 'disputed'));

-- Add stripe_customer_id to clients table for payment methods
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contracts_payment_intent
ON contracts(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_contracts_auto_release
ON contracts(auto_release_at) WHERE payment_status = 'held';

CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer
ON clients(stripe_customer_id);

COMMENT ON COLUMN contracts.completion_note IS 'Note from freelancer when submitting work for approval';
COMMENT ON COLUMN contracts.stripe_payment_intent_id IS 'Stripe Payment Intent ID for escrow payment';
COMMENT ON COLUMN contracts.payment_status IS 'Status of payment: pending (not paid), paid (client paid), held (in escrow), released (sent to freelancer), refunded, disputed';
COMMENT ON COLUMN contracts.auto_release_at IS 'Timestamp when payment will auto-release if no dispute filed';
COMMENT ON COLUMN contracts.dispute_reason IS 'Reason provided by client for filing dispute';
