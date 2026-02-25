-- ==========================================
-- ANALYTICS SCHEMA
-- ==========================================
-- Run this SQL in your Supabase SQL Editor
-- ==========================================

-- Create analytics_events table for tracking user actions
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL, -- 'job_posted', 'proposal_submitted', 'job_viewed', 'search_performed', etc.
  event_data JSONB DEFAULT '{}'::jsonb,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create platform_stats table for aggregated statistics
CREATE TABLE IF NOT EXISTS platform_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_date DATE NOT NULL,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  active_jobs INTEGER DEFAULT 0,
  total_proposals INTEGER DEFAULT 0,
  total_contracts INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  platform_fees DECIMAL(12, 2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(stat_date)
);

-- Create user_stats table for individual user metrics
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  jobs_posted INTEGER DEFAULT 0,
  proposals_submitted INTEGER DEFAULT 0,
  proposals_accepted INTEGER DEFAULT 0,
  contracts_completed INTEGER DEFAULT 0,
  total_earned DECIMAL(10, 2) DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, stat_date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id 
ON analytics_events(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type 
ON analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created 
ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session 
ON analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_platform_stats_date 
ON platform_stats(stat_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_date 
ON user_stats(user_id, stat_date DESC);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own analytics events
CREATE POLICY "Users can view own analytics"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert analytics events
CREATE POLICY "Service role can insert analytics"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Platform stats are visible to all authenticated users (for public metrics)
CREATE POLICY "Authenticated users can view platform stats"
  ON platform_stats FOR SELECT
  TO authenticated
  USING (true);

-- Users can view their own stats
CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

-- ==========================================
-- ANALYTICS FUNCTIONS
-- ==========================================

-- Function to track analytics event
CREATE OR REPLACE FUNCTION track_analytics_event(
  p_user_id UUID,
  p_event_type VARCHAR,
  p_event_data JSONB DEFAULT '{}'::jsonb,
  p_session_id VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO analytics_events (user_id, event_type, event_data, session_id)
  VALUES (p_user_id, p_event_type, p_event_data, p_session_id)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Function to get platform stats for date range
CREATE OR REPLACE FUNCTION get_platform_stats(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  stat_date DATE,
  total_users INTEGER,
  active_users INTEGER,
  total_jobs INTEGER,
  total_revenue DECIMAL,
  platform_fees DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.stat_date,
    ps.total_users,
    ps.active_users,
    ps.total_jobs,
    ps.total_revenue,
    ps.platform_fees
  FROM platform_stats ps
  WHERE ps.stat_date BETWEEN p_start_date AND p_end_date
  ORDER BY ps.stat_date DESC;
END;
$$;

-- Function to calculate and update daily platform stats
CREATE OR REPLACE FUNCTION update_daily_platform_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_users INTEGER;
  v_active_users INTEGER;
  v_total_jobs INTEGER;
  v_active_jobs INTEGER;
  v_total_proposals INTEGER;
  v_total_contracts INTEGER;
  v_total_revenue DECIMAL;
  v_platform_fees DECIMAL;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO v_total_users FROM profiles;
  
  -- Count active users (users with activity in last 30 days)
  SELECT COUNT(DISTINCT user_id) INTO v_active_users
  FROM analytics_events
  WHERE created_at >= p_date - INTERVAL '30 days';
  
  -- Count total and active jobs
  SELECT COUNT(*) INTO v_total_jobs FROM jobs;
  SELECT COUNT(*) INTO v_active_jobs FROM jobs WHERE status = 'open';
  
  -- Count total proposals
  SELECT COUNT(*) INTO v_total_proposals FROM proposals;
  
  -- Count total contracts
  SELECT COUNT(*) INTO v_total_contracts FROM contracts;
  
  -- Calculate revenue
  SELECT COALESCE(SUM(amount), 0) INTO v_total_revenue
  FROM transactions
  WHERE type = 'release' AND status = 'completed';
  
  -- Calculate platform fees (10%)
  v_platform_fees := v_total_revenue * 0.10;
  
  -- Insert or update platform stats
  INSERT INTO platform_stats (
    stat_date,
    total_users,
    active_users,
    total_jobs,
    active_jobs,
    total_proposals,
    total_contracts,
    total_revenue,
    platform_fees
  )
  VALUES (
    p_date,
    v_total_users,
    v_active_users,
    v_total_jobs,
    v_active_jobs,
    v_total_proposals,
    v_total_contracts,
    v_total_revenue,
    v_platform_fees
  )
  ON CONFLICT (stat_date)
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    active_users = EXCLUDED.active_users,
    total_jobs = EXCLUDED.total_jobs,
    active_jobs = EXCLUDED.active_jobs,
    total_proposals = EXCLUDED.total_proposals,
    total_contracts = EXCLUDED.total_contracts,
    total_revenue = EXCLUDED.total_revenue,
    platform_fees = EXCLUDED.platform_fees,
    updated_at = TIMEZONE('utc', NOW());
END;
$$;

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_jobs_posted INTEGER := 0;
  v_proposals_submitted INTEGER := 0;
  v_proposals_accepted INTEGER := 0;
  v_contracts_completed INTEGER := 0;
  v_total_earned DECIMAL := 0;
  v_total_spent DECIMAL := 0;
BEGIN
  -- Get user role to determine which stats to calculate
  -- For clients
  SELECT COUNT(*) INTO v_jobs_posted
  FROM jobs j
  JOIN clients c ON c.id = j.client_id
  WHERE c.profile_id = p_user_id;
  
  SELECT COALESCE(SUM(t.amount), 0) INTO v_total_spent
  FROM transactions t
  WHERE t.from_user_id = p_user_id AND t.status = 'completed';
  
  -- For freelancers
  SELECT COUNT(*) INTO v_proposals_submitted
  FROM proposals pr
  JOIN freelancers f ON f.id = pr.freelancer_id
  WHERE f.profile_id = p_user_id;
  
  SELECT COUNT(*) INTO v_proposals_accepted
  FROM proposals pr
  JOIN freelancers f ON f.id = pr.freelancer_id
  WHERE f.profile_id = p_user_id AND pr.status = 'accepted';
  
  SELECT COUNT(*) INTO v_contracts_completed
  FROM contracts c
  WHERE c.freelancer_id = p_user_id AND c.status = 'completed';
  
  SELECT COALESCE(SUM(t.amount), 0) INTO v_total_earned
  FROM transactions t
  WHERE t.to_user_id = p_user_id AND t.type = 'release' AND t.status = 'completed';
  
  -- Insert or update user stats
  INSERT INTO user_stats (
    user_id,
    stat_date,
    jobs_posted,
    proposals_submitted,
    proposals_accepted,
    contracts_completed,
    total_earned,
    total_spent
  )
  VALUES (
    p_user_id,
    p_date,
    v_jobs_posted,
    v_proposals_submitted,
    v_proposals_accepted,
    v_contracts_completed,
    v_total_earned,
    v_total_spent
  )
  ON CONFLICT (user_id, stat_date)
  DO UPDATE SET
    jobs_posted = EXCLUDED.jobs_posted,
    proposals_submitted = EXCLUDED.proposals_submitted,
    proposals_accepted = EXCLUDED.proposals_accepted,
    contracts_completed = EXCLUDED.contracts_completed,
    total_earned = EXCLUDED.total_earned,
    total_spent = EXCLUDED.total_spent,
    updated_at = TIMEZONE('utc', NOW());
END;
$$;

-- ==========================================
-- AUTOMATED TRIGGERS
-- ==========================================

-- Trigger to track job views
CREATE OR REPLACE FUNCTION track_job_view()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be called from application layer with actual user_id
  -- Placeholder for concept
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SCHEDULED JOBS (Run via cron or manually)
-- ==========================================

-- Update yesterday's platform stats
-- Run this daily via cron job or Supabase Edge Function
SELECT update_daily_platform_stats(CURRENT_DATE - INTERVAL '1 day');

-- ==========================================
-- VERIFICATION
-- ==========================================

SELECT 'Analytics system created successfully!' AS status;
