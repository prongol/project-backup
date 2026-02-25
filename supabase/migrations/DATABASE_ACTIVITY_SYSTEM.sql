-- ==========================================
-- ACTIVITY SYSTEM SCHEMA
-- ==========================================
-- Run this SQL in your Supabase SQL Editor
-- ==========================================

-- Create activities table for tracking user activities
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'job', 'proposal', 'contract', 'message', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Reference to related entities
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  
  -- Activity metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_job_id ON activities(job_id);
CREATE INDEX IF NOT EXISTS idx_activities_contract_id ON activities(contract_id);
CREATE INDEX IF NOT EXISTS idx_activities_proposal_id ON activities(proposal_id);

-- Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own activities
CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create activities for themselves
CREATE POLICY "Users can create own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own activities
CREATE POLICY "Users can update own activities"
  ON activities FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- FUNCTIONS FOR CREATING ACTIVITIES
-- ==========================================

-- Function to create activity when job is posted
CREATE OR REPLACE FUNCTION create_job_posted_activity()
RETURNS TRIGGER AS $$
DECLARE
  client_profile_id UUID;
BEGIN
  -- Get client's profile_id from the job
  SELECT c.profile_id INTO client_profile_id
  FROM clients c
  WHERE c.id = NEW.client_id;
  
  -- Create activity for job posting
  INSERT INTO activities (user_id, type, title, description, job_id)
  VALUES (
    client_profile_id,
    'job',
    'Posted a new job: ' || NEW.title,
    'You posted a new job listing for $' || NEW.budget,
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create activity when proposal is submitted
CREATE OR REPLACE FUNCTION create_proposal_submitted_activity()
RETURNS TRIGGER AS $$
DECLARE
  freelancer_profile_id UUID;
  client_profile_id UUID;
  job_title TEXT;
BEGIN
  -- Get freelancer's profile_id
  SELECT f.profile_id INTO freelancer_profile_id
  FROM freelancers f
  WHERE f.id = NEW.freelancer_id;
  
  -- Get client's profile_id and job title
  SELECT c.profile_id, j.title 
  INTO client_profile_id, job_title
  FROM jobs j
  JOIN clients c ON j.client_id = c.id
  WHERE j.id = NEW.job_id;
  
  -- Create activity for freelancer
  INSERT INTO activities (user_id, type, title, description, job_id, proposal_id)
  VALUES (
    freelancer_profile_id,
    'proposal',
    'Submitted proposal for: ' || job_title,
    'You submitted a proposal for $' || NEW.proposed_budget,
    NEW.job_id,
    NEW.id
  );
  
  -- Create activity for client
  INSERT INTO activities (user_id, type, title, description, job_id, proposal_id)
  VALUES (
    client_profile_id,
    'proposal',
    'New proposal received for: ' || job_title,
    'A freelancer submitted a proposal for $' || NEW.proposed_budget,
    NEW.job_id,
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create activity when contract is created
CREATE OR REPLACE FUNCTION create_contract_activity()
RETURNS TRIGGER AS $$
DECLARE
  client_profile_id UUID;
  freelancer_profile_id UUID;
  job_title TEXT;
BEGIN
  -- Get profile IDs
  SELECT c.profile_id INTO client_profile_id
  FROM clients c
  WHERE c.id = NEW.client_id;
  
  SELECT f.profile_id INTO freelancer_profile_id
  FROM freelancers f
  WHERE f.id = NEW.freelancer_id;
  
  -- Get job title
  SELECT j.title INTO job_title
  FROM jobs j
  WHERE j.id = NEW.job_id;
  
  -- Create activity for client
  INSERT INTO activities (user_id, type, title, description, job_id, contract_id)
  VALUES (
    client_profile_id,
    'contract',
    'Contract created for: ' || COALESCE(job_title, 'Project'),
    'A new contract has been created for $' || NEW.budget,
    NEW.job_id,
    NEW.id
  );
  
  -- Create activity for freelancer
  INSERT INTO activities (user_id, type, title, description, job_id, contract_id)
  VALUES (
    freelancer_profile_id,
    'contract',
    'Contract received for: ' || COALESCE(job_title, 'Project'),
    'You received a new contract for $' || NEW.budget,
    NEW.job_id,
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- CREATE TRIGGERS
-- ==========================================

-- Trigger for job posting
CREATE TRIGGER trigger_job_posted_activity
  AFTER INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION create_job_posted_activity();

-- Trigger for proposal submission
CREATE TRIGGER trigger_proposal_submitted_activity
  AFTER INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION create_proposal_submitted_activity();

-- Trigger for contract creation
CREATE TRIGGER trigger_contract_activity
  AFTER INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION create_contract_activity();

-- ==========================================
-- DEMO DATA (Optional)
-- ==========================================

-- Insert some sample activities for existing users
-- Note: Run this only after you have users in your system
/*
INSERT INTO activities (user_id, type, title, description, created_at)
SELECT 
  p.id,
  'job',
  'Welcome to Neplancer!',
  'Welcome to the platform. Start by posting your first job or browsing available opportunities.',
  NOW() - INTERVAL '1 day'
FROM profiles p
WHERE p.role = 'client'
LIMIT 5;

INSERT INTO activities (user_id, type, title, description, created_at)
SELECT 
  p.id,
  'profile',
  'Profile created successfully',
  'Your freelancer profile has been created. Complete your profile to start applying for jobs.',
  NOW() - INTERVAL '2 hours'
FROM profiles p
WHERE p.role = 'freelancer'
LIMIT 5;
*/