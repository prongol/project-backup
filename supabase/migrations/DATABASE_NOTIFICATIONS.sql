-- ==========================================
-- NOTIFICATIONS SYSTEM
-- ==========================================
-- Run this SQL in your Supabase SQL Editor
-- ==========================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'new_message', 'proposal_received', 'job_accepted', 'contract_signed', 'payment_received'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500), -- Optional link to navigate to
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read 
ON notifications(read);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
ON notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(type);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Only the system (service role) can insert notifications
CREATE POLICY "Service role can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true); -- This will be restricted by service role in API

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- HELPER FUNCTION: Create Notification
-- ==========================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_link VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_link)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- ==========================================
-- TRIGGER: Update updated_at timestamp
-- ==========================================

CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notification_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_updated_at();

-- ==========================================
-- AUTO NOTIFICATIONS ON PROPOSAL CREATION
-- ==========================================

CREATE OR REPLACE FUNCTION notify_on_proposal()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_job_title VARCHAR;
  v_freelancer_name VARCHAR;
BEGIN
  -- Get client_id and job title
  SELECT j.client_id, j.title, c.profile_id
  INTO v_client_id, v_job_title
  FROM jobs j
  JOIN clients c ON c.id = j.client_id
  WHERE j.id = NEW.job_id;
  
  -- Get freelancer name
  SELECT p.full_name
  INTO v_freelancer_name
  FROM freelancers f
  JOIN profiles p ON p.id = f.profile_id
  WHERE f.id = NEW.freelancer_id;
  
  -- Create notification for client
  PERFORM create_notification(
    v_client_id,
    'proposal_received',
    'New Proposal Received',
    format('%s submitted a proposal for "%s"', v_freelancer_name, v_job_title),
    format('/jobs/%s/proposals/%s', NEW.job_id, NEW.id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_on_proposal
  AFTER INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_proposal();

-- ==========================================
-- AUTO NOTIFICATIONS ON PROPOSAL ACCEPTANCE
-- ==========================================

CREATE OR REPLACE FUNCTION notify_on_proposal_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_freelancer_profile_id UUID;
  v_job_title VARCHAR;
BEGIN
  -- Only notify on status change to 'accepted' or 'rejected'
  IF NEW.status != OLD.status AND NEW.status IN ('accepted', 'rejected') THEN
    -- Get freelancer's profile_id
    SELECT f.profile_id
    INTO v_freelancer_profile_id
    FROM freelancers f
    WHERE f.id = NEW.freelancer_id;
    
    -- Get job title
    SELECT j.title
    INTO v_job_title
    FROM jobs j
    WHERE j.id = NEW.job_id;
    
    -- Create notification
    IF NEW.status = 'accepted' THEN
      PERFORM create_notification(
        v_freelancer_profile_id,
        'proposal_accepted',
        'Proposal Accepted! 🎉',
        format('Your proposal for "%s" has been accepted', v_job_title),
        format('/proposals/%s', NEW.id)
      );
    ELSE
      PERFORM create_notification(
        v_freelancer_profile_id,
        'proposal_rejected',
        'Proposal Update',
        format('Your proposal for "%s" was not accepted this time', v_job_title),
        format('/proposals/%s', NEW.id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_on_proposal_status
  AFTER UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_proposal_status_change();

-- ==========================================
-- VERIFICATION
-- ==========================================

SELECT 'Notifications system created successfully!' AS status;
