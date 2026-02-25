-- Fix for notifications realtime
-- Run this in your Supabase SQL Editor

-- Enable realtime for notifications table if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
END $$;

-- Verify RLS policies are correct for notifications
-- (Should already be set by DATABASE_NOTIFICATIONS.sql but let's ensure they are robust)

-- Users can only see their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Anyone authenticated can insert notifications (to allow users to notify each other)
-- Alternatively, use SECURITY DEFINER functions for this.
-- The current sendNotification lib uses the user's client to insert, so it needs this policy.
DROP POLICY IF EXISTS "Any authenticated user can insert notifications" ON notifications;
CREATE POLICY "Any authenticated user can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Fix the broken proposal trigger
CREATE OR REPLACE FUNCTION notify_on_proposal()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_job_title VARCHAR;
  v_freelancer_name VARCHAR;
BEGIN
  -- Get client_id and job title
  -- (client_id in jobs table already points to the client's profile ID/client ID)
  SELECT j.client_id, j.title
  INTO v_client_id, v_job_title
  FROM jobs j
  WHERE j.id = NEW.job_id;
  
  -- Get freelancer name
  SELECT p.full_name
  INTO v_freelancer_name
  FROM freelancers f
  JOIN profiles p ON p.id = f.id
  WHERE f.id = NEW.freelancer_id;
  
  -- Create notification for client
  IF v_client_id IS NOT NULL THEN
    PERFORM create_notification(
      v_client_id,
      'proposal_received',
      'New Proposal Received',
      format('%s submitted a proposal for "%s"', COALESCE(v_freelancer_name, 'A freelancer'), v_job_title),
      format('/jobs/%s/proposals/%s', NEW.job_id, NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
