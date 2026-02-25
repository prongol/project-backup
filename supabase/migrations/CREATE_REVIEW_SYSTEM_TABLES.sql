-- ==========================================
-- REVIEW SYSTEM TABLES
-- Required for work submission, review, and rating features
-- ==========================================

-- Create contract work submissions table
CREATE TABLE IF NOT EXISTS contract_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_type VARCHAR(50) DEFAULT 'final',
  deliverables TEXT NOT NULL,
  message TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  client_viewed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending',
  client_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create work review workflow table
CREATE TABLE IF NOT EXISTS work_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES contract_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  approval_checklist JSONB DEFAULT '{}',
  deadline TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  auto_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create requirement verifications table
CREATE TABLE IF NOT EXISTS requirement_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  requirement_id VARCHAR(100) NOT NULL,
  requirement_text TEXT NOT NULL,
  verification_status VARCHAR(50) DEFAULT 'pending',
  freelancer_proof TEXT,
  client_verification TEXT,
  admin_decision VARCHAR(50),
  admin_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create dispute evidence table
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES contract_disputes(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evidence_type VARCHAR(50) NOT NULL,
  file_url TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create payment setup progress table
CREATE TABLE IF NOT EXISTS payment_setup_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL,
  setup_stage VARCHAR(50) NOT NULL,
  stripe_account_id VARCHAR(255),
  setup_data JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create platform fees table
CREATE TABLE IF NOT EXISTS platform_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 7.00,
  fee_amount DECIMAL(10, 2) NOT NULL,
  contract_amount DECIMAL(10, 2) NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE,
  stripe_fee_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create activities table for user activity tracking
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_contract ON contract_submissions(contract_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON contract_submissions(status);
CREATE INDEX IF NOT EXISTS idx_work_reviews_contract ON work_reviews(contract_id);
CREATE INDEX IF NOT EXISTS idx_work_reviews_submission ON work_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_requirement_verifications_contract ON requirement_verifications(contract_id);
CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute ON dispute_evidence(dispute_id);
CREATE INDEX IF NOT EXISTS idx_payment_setup_user ON payment_setup_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_contract ON platform_fees(contract_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_status ON platform_fees(status);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- Add missing columns to contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_hold_released BOOLEAN DEFAULT FALSE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_release_method VARCHAR(50);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_released_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS work_approval_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_requirements JSONB DEFAULT '{}';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deliverable_checklist JSONB DEFAULT '[]';

-- Add missing columns to escrow_accounts table
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS review_period_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS review_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS auto_release_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS work_submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE escrow_accounts ADD COLUMN IF NOT EXISTS client_approved_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS net_freelancer_amount DECIMAL(10, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS stripe_application_fee_id VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS escrow_release_type VARCHAR(50);

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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for work submission
DROP TRIGGER IF EXISTS trigger_start_review_period ON contract_submissions;
CREATE TRIGGER trigger_start_review_period
  AFTER INSERT ON contract_submissions
  FOR EACH ROW
  EXECUTE FUNCTION start_work_review_period();

-- Enable Row Level Security
ALTER TABLE contract_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_setup_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_submissions
CREATE POLICY "Users can view own submissions"
  ON contract_submissions FOR SELECT
  USING (
    freelancer_id = auth.uid() OR 
    contract_id IN (SELECT id FROM contracts WHERE client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()))
  );

CREATE POLICY "Freelancers can create submissions"
  ON contract_submissions FOR INSERT
  WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Users can update own submissions"
  ON contract_submissions FOR UPDATE
  USING (
    freelancer_id = auth.uid() OR 
    contract_id IN (SELECT id FROM contracts WHERE client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()))
  );

-- RLS Policies for work_reviews
CREATE POLICY "Users can view related reviews"
  ON work_reviews FOR SELECT
  USING (
    reviewer_id = auth.uid() OR
    contract_id IN (SELECT id FROM contracts WHERE freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid()))
  );

CREATE POLICY "Reviewers can create reviews"
  ON work_reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Reviewers can update reviews"
  ON work_reviews FOR UPDATE
  USING (reviewer_id = auth.uid());

-- RLS Policies for activities
CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own activities"
  ON activities FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for requirement_verifications
CREATE POLICY "Contract parties can view verifications"
  ON requirement_verifications FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts 
      WHERE client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
      OR freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid())
    )
  );

-- RLS Policies for dispute_evidence
CREATE POLICY "Dispute parties can view evidence"
  ON dispute_evidence FOR SELECT
  USING (
    submitted_by = auth.uid() OR
    dispute_id IN (
      SELECT id FROM contract_disputes 
      WHERE contract_id IN (
        SELECT id FROM contracts 
        WHERE client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
        OR freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can submit evidence"
  ON dispute_evidence FOR INSERT
  WITH CHECK (submitted_by = auth.uid());

-- RLS Policies for payment_setup_progress
CREATE POLICY "Users can view own payment setup"
  ON payment_setup_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own payment setup"
  ON payment_setup_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can modify own payment setup"
  ON payment_setup_progress FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for platform_fees
CREATE POLICY "Users can view related fees"
  ON platform_fees FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts 
      WHERE client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
      OR freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid())
    )
  );

COMMENT ON TABLE contract_submissions IS 'Stores work submissions from freelancers';
COMMENT ON TABLE work_reviews IS 'Tracks client reviews of submitted work';
COMMENT ON TABLE requirement_verifications IS 'Verifies contract requirements are met';
COMMENT ON TABLE dispute_evidence IS 'Evidence submitted during contract disputes';
COMMENT ON TABLE payment_setup_progress IS 'Tracks payment method setup progress';
COMMENT ON TABLE platform_fees IS 'Tracks platform fees (7%) collected from transactions';
COMMENT ON TABLE activities IS 'User activity log for dashboard';
