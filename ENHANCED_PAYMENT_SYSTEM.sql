-- ==========================================
-- ENHANCED PAYMENT & ESCROW SYSTEM WITH 7% FEE
-- ==========================================

-- Add Stripe Connect fields to freelancers table
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255);
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS payment_setup_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS fee_acceptance_agreement BOOLEAN DEFAULT FALSE;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS fee_accepted_at TIMESTAMP WITH TIME ZONE;

-- Add Stripe Customer fields to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS default_payment_method VARCHAR(255);

-- Enhanced escrow_accounts table for proper escrow workflow
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS client_stripe_customer_id VARCHAR(255);
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS freelancer_connect_account_id VARCHAR(255);
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS review_period_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS review_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS auto_release_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS work_submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS client_approved_at TIMESTAMP WITH TIME ZONE;

-- Create payment method setup tracking
CREATE TABLE IF NOT EXISTS payment_setup_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL, -- 'client', 'freelancer'
  setup_stage VARCHAR(50) NOT NULL, -- 'started', 'stripe_connect_created', 'onboarding_completed', 'verified'
  stripe_account_id VARCHAR(255),
  setup_data JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create contract work submissions table
CREATE TABLE IF NOT EXISTS contract_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_type VARCHAR(50) DEFAULT 'final', -- 'draft', 'milestone', 'final'
  deliverables JSONB NOT NULL DEFAULT '[]', -- Array of file URLs, descriptions
  message TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  client_viewed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'revision_requested', 'disputed'
  client_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create platform fee tracking
CREATE TABLE IF NOT EXISTS platform_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 7.00,
  fee_amount DECIMAL(10, 2) NOT NULL,
  contract_amount DECIMAL(10, 2) NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE,
  stripe_fee_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'collected', 'refunded'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Update contracts table for enhanced workflow
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_hold_released BOOLEAN DEFAULT FALSE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_release_method VARCHAR(50); -- 'auto', 'manual', 'dispute_resolved'
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_released_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS work_approval_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_requirements JSONB DEFAULT '{}';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deliverable_checklist JSONB DEFAULT '[]';

-- Enhanced transactions table for better tracking
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS net_freelancer_amount DECIMAL(10, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS stripe_application_fee_id VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS escrow_release_type VARCHAR(50); -- 'auto', 'manual_approval', 'dispute_resolution'

-- Create dispute evidence table
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES contract_disputes(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evidence_type VARCHAR(50) NOT NULL, -- 'file', 'screenshot', 'document', 'communication', 'requirements'
  file_url TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create contract requirements verification table
CREATE TABLE IF NOT EXISTS requirement_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  requirement_id VARCHAR(100) NOT NULL, -- Maps to client_requirements keys
  requirement_text TEXT NOT NULL,
  verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'met', 'not_met', 'disputed'
  freelancer_proof TEXT,
  client_verification TEXT,
  admin_decision VARCHAR(50), -- 'approved', 'rejected', 'partial'
  admin_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create work review workflow table
CREATE TABLE IF NOT EXISTS work_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES contract_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_status VARCHAR(50) NOT NULL, -- 'pending', 'approved', 'revision_requested', 'disputed'
  review_notes TEXT,
  approval_checklist JSONB DEFAULT '{}',
  deadline TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  auto_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_setup_user ON payment_setup_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_contract ON contract_submissions(contract_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON contract_submissions(status);
CREATE INDEX IF NOT EXISTS idx_platform_fees_contract ON platform_fees(contract_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_status ON platform_fees(status);
CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute ON dispute_evidence(dispute_id);
CREATE INDEX IF NOT EXISTS idx_requirement_verifications_contract ON requirement_verifications(contract_id);
CREATE INDEX IF NOT EXISTS idx_work_reviews_contract ON work_reviews(contract_id);

-- Function to automatically start review period when work is submitted
CREATE OR REPLACE FUNCTION start_work_review_period()
RETURNS TRIGGER AS $$
DECLARE
  contract_record RECORD;
BEGIN
  -- Get contract details
  SELECT * INTO contract_record FROM contracts WHERE id = NEW.contract_id;
  
  -- Start 3-day review period
  UPDATE escrow_accounts 
  SET 
    work_submitted_at = NEW.submitted_at,
    review_period_start = NEW.submitted_at,
    review_period_end = NEW.submitted_at + INTERVAL '3 days',
    status = 'under_review'
  WHERE contract_id = NEW.contract_id;
  
  -- Create work review entry
  INSERT INTO work_reviews (
    contract_id,
    submission_id,
    reviewer_id,
    review_status,
    deadline
  ) VALUES (
    NEW.contract_id,
    NEW.id,
    contract_record.client_id,
    'pending',
    NEW.submitted_at + INTERVAL '3 days'
  );
  
  -- Notify client about submission
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    action_url
  ) VALUES (
    contract_record.client_id,
    'work_submitted',
    'Work Delivered - Review Required',
    'The freelancer has submitted the work. You have 3 days to review and approve.',
    '/contracts/' || contract_record.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for work submission
DROP TRIGGER IF EXISTS trigger_start_review_period ON contract_submissions;
CREATE TRIGGER trigger_start_review_period
  AFTER INSERT ON contract_submissions
  FOR EACH ROW
  EXECUTE FUNCTION start_work_review_period();

-- Function to auto-release payment after review period
CREATE OR REPLACE FUNCTION check_auto_release_payments()
RETURNS void AS $$
BEGIN
  -- Auto-approve work that hasn't been reviewed within 3 days
  UPDATE escrow_accounts 
  SET 
    status = 'approved',
    client_approved_at = NOW(),
    payment_hold_released = TRUE
  WHERE 
    status = 'under_review' 
    AND auto_release_enabled = TRUE
    AND review_period_end < NOW()
    AND payment_hold_released = FALSE;
    
  -- Update corresponding work reviews
  UPDATE work_reviews 
  SET 
    review_status = 'approved',
    reviewed_at = NOW(),
    auto_approved = TRUE
  WHERE 
    review_status = 'pending'
    AND deadline < NOW();
    
  -- Update contracts
  UPDATE contracts 
  SET 
    payment_hold_released = TRUE,
    payment_release_method = 'auto',
    payment_released_at = NOW()
  WHERE 
    id IN (
      SELECT contract_id 
      FROM escrow_accounts 
      WHERE status = 'approved' 
      AND payment_hold_released = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and track platform fees
CREATE OR REPLACE FUNCTION track_platform_fee(
  p_contract_id UUID,
  p_transaction_id UUID,
  p_contract_amount DECIMAL
) RETURNS UUID AS $$
DECLARE
  fee_record UUID;
  fee_amount DECIMAL;
BEGIN
  fee_amount := ROUND(p_contract_amount * 0.07, 2);
  
  INSERT INTO platform_fees (
    contract_id,
    transaction_id,
    fee_percentage,
    fee_amount,
    contract_amount,
    status
  ) VALUES (
    p_contract_id,
    p_transaction_id,
    7.00,
    fee_amount,
    p_contract_amount,
    'pending'
  ) RETURNING id INTO fee_record;
  
  RETURN fee_record;
END;
$$ LANGUAGE plpgsql;