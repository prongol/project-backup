`-- ==========================================
-- MINIMAL REVIEW & RATING SYSTEM
-- Only the essential tables needed for work submission and rating
-- ==========================================

-- 1. Table for work submissions by freelancers
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

-- 2. Table for work reviews/ratings
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

-- 3. Table for user activity tracking (for dashboard)
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_contract ON contract_submissions(contract_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON contract_submissions(status);
CREATE INDEX IF NOT EXISTS idx_work_reviews_contract ON work_reviews(contract_id);
CREATE INDEX IF NOT EXISTS idx_work_reviews_submission ON work_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- 5. Enable Row Level Security
ALTER TABLE contract_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for contract_submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON contract_submissions;
CREATE POLICY "Users can view own submissions"
  ON contract_submissions FOR SELECT
  USING (
    freelancer_id = auth.uid() OR 
    contract_id IN (SELECT id FROM contracts WHERE client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Freelancers can create submissions" ON contract_submissions;
CREATE POLICY "Freelancers can create submissions"
  ON contract_submissions FOR INSERT
  WITH CHECK (freelancer_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own submissions" ON contract_submissions;
CREATE POLICY "Users can update own submissions"
  ON contract_submissions FOR UPDATE
  USING (
    freelancer_id = auth.uid() OR 
    contract_id IN (SELECT id FROM contracts WHERE client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()))
  );

-- 7. RLS Policies for work_reviews
DROP POLICY IF EXISTS "Users can view related reviews" ON work_reviews;
CREATE POLICY "Users can view related reviews"
  ON work_reviews FOR SELECT
  USING (
    reviewer_id = auth.uid() OR
    contract_id IN (SELECT id FROM contracts WHERE freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Reviewers can create reviews" ON work_reviews;
CREATE POLICY "Reviewers can create reviews"
  ON work_reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "Reviewers can update reviews" ON work_reviews;
CREATE POLICY "Reviewers can update reviews"
  ON work_reviews FOR UPDATE
  USING (reviewer_id = auth.uid());

-- 8. RLS Policies for activities
DROP POLICY IF EXISTS "Users can view own activities" ON activities;
CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own activities" ON activities;
CREATE POLICY "Users can create own activities"
  ON activities FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 9. Trigger function to create work review when submission is made
CREATE OR REPLACE FUNCTION create_work_review_on_submission()
RETURNS TRIGGER AS $$
DECLARE
  client_profile_id UUID;
BEGIN
  -- Get client profile_id from contract
  SELECT c.client_id INTO client_profile_id
  FROM contracts c
  INNER JOIN clients cl ON c.client_id = cl.id
  WHERE c.id = NEW.contract_id;
  
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
    (SELECT profile_id FROM clients WHERE id = client_profile_id),
    'pending',
    NEW.submitted_at + INTERVAL '3 days'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Attach trigger to contract_submissions
DROP TRIGGER IF EXISTS trigger_create_review ON contract_submissions;
CREATE TRIGGER trigger_create_review
  AFTER INSERT ON contract_submissions
  FOR EACH ROW
  EXECUTE FUNCTION create_work_review_on_submission();
`