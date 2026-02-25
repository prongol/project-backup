-- Admin Dashboard & Contract Monitoring System
-- Run this SQL in Supabase SQL Editor

-- ==============================================
-- 1. CONTRACT MONITORING TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS contract_monitoring (
  id BIGSERIAL PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  issue_type VARCHAR(50) NOT NULL, -- 'abandoned_work', 'payment_delay', 'dispute', 'no_activity'
  risk_score INTEGER DEFAULT 0,
  risk_level VARCHAR(20) DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  flags JSONB DEFAULT '[]'::jsonb, -- Array of specific issues detected
  first_detected TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'escalated', 'closed'
  admin_assigned UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  auto_actions_taken JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_contract_monitoring_contract ON contract_monitoring(contract_id);
CREATE INDEX idx_contract_monitoring_risk_level ON contract_monitoring(risk_level);
CREATE INDEX idx_contract_monitoring_status ON contract_monitoring(status);
CREATE INDEX idx_contract_monitoring_admin ON contract_monitoring(admin_assigned);

-- ==============================================
-- 2. ADMIN ACTIONS LOG
-- ==============================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id BIGSERIAL PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  monitoring_id BIGINT REFERENCES contract_monitoring(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL, -- 'contacted_user', 'froze_escrow', 'released_payment', 'suspended_account', 'mediated_dispute', 'closed_contract'
  action_details JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  outcome VARCHAR(50), -- 'resolved', 'escalated', 'pending', 'failed'
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_contract ON admin_actions(contract_id);
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_timestamp ON admin_actions(timestamp DESC);

-- ==============================================
-- 3. USER VIOLATION HISTORY
-- ==============================================
CREATE TABLE IF NOT EXISTS violation_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL, -- 'client' or 'freelancer'
  violation_type VARCHAR(50) NOT NULL, -- 'abandoned_work', 'late_payment', 'poor_communication', 'scope_violation', 'refund_abuse'
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  severity VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  penalty_applied VARCHAR(100), -- 'warning', 'account_suspended_7d', 'rating_penalty', 'payment_held'
  description TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- For temporary penalties
);

CREATE INDEX idx_violation_history_user ON violation_history(user_id);
CREATE INDEX idx_violation_history_contract ON violation_history(contract_id);
CREATE INDEX idx_violation_history_severity ON violation_history(severity);

-- ==============================================
-- 4. DISPUTE RESOLUTION TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS contract_disputes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  opened_by UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Who opened the dispute
  dispute_type VARCHAR(50) NOT NULL, -- 'payment_issue', 'quality_issue', 'scope_change', 'abandoned_work', 'refund_request'
  reason TEXT NOT NULL,
  evidence JSONB DEFAULT '[]'::jsonb, -- Array of evidence files/links
  amount_disputed DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'under_review', 'resolved', 'closed'
  admin_assigned UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_type VARCHAR(50), -- 'full_refund', 'partial_refund', 'no_refund', 'additional_work', 'payment_released'
  resolution_details TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disputes_contract ON contract_disputes(contract_id);
CREATE INDEX idx_disputes_status ON contract_disputes(status);
CREATE INDEX idx_disputes_admin ON contract_disputes(admin_assigned);

-- ==============================================
-- 5. CONTRACT ACTIVITY LOG
-- ==============================================
CREATE TABLE IF NOT EXISTS contract_activity_log (
  id BIGSERIAL PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'message_sent', 'milestone_delivered', 'payment_released', 'file_uploaded', 'status_change'
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_role VARCHAR(20), -- 'client', 'freelancer', 'admin'
  details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_contract ON contract_activity_log(contract_id);
CREATE INDEX idx_activity_log_timestamp ON contract_activity_log(timestamp DESC);

-- ==============================================
-- 6. AUTOMATED NOTIFICATIONS QUEUE
-- ==============================================
CREATE TABLE IF NOT EXISTS notification_queue (
  id BIGSERIAL PRIMARY KEY,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'inactivity_warning', 'payment_reminder', 'dispute_opened', 'admin_contact'
  template_name VARCHAR(100) NOT NULL,
  template_data JSONB DEFAULT '{}'::jsonb,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_recipient ON notification_queue(recipient_id);

-- ==============================================
-- 7. CREATE CONTRACT MILESTONES TABLE (if not exists)
-- ==============================================
CREATE TABLE IF NOT EXISTS contract_milestones (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  due_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'delivered', 'approved', 'revision_requested'
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'held_in_escrow', 'released', 'refunded'
  delivered_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  deliverables JSONB DEFAULT '[]'::jsonb,
  revision_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contract_milestones_contract ON contract_milestones(contract_id);
CREATE INDEX idx_contract_milestones_status ON contract_milestones(status);
CREATE INDEX idx_contract_milestones_payment_status ON contract_milestones(payment_status);

-- ==============================================
-- 8. ADD ADMIN ROLE TO PROFILES
-- ==============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_level VARCHAR(20), -- 'support', 'moderator', 'admin', 'super_admin'
ADD COLUMN IF NOT EXISTS admin_permissions JSONB DEFAULT '[]'::jsonb;

-- ==============================================
-- 9. ADD TRUST SCORE TO PROFILES
-- ==============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 100, -- 0-100 scale
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active', -- 'active', 'warning', 'suspended', 'banned'
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspension_until TIMESTAMPTZ;

-- ==============================================
-- 10. UPDATE CONTRACTS TABLE FOR MONITORING
-- ==============================================
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS freelancer_last_seen TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_last_seen TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS warning_level INTEGER DEFAULT 0, -- 0-3, escalating warnings
ADD COLUMN IF NOT EXISTS auto_action_date TIMESTAMPTZ, -- When auto-action will trigger
ADD COLUMN IF NOT EXISTS health_status VARCHAR(20) DEFAULT 'healthy'; -- 'healthy', 'warning', 'critical'

-- ==============================================
-- 11. CREATE VIEWS FOR ADMIN DASHBOARD
-- ==============================================

-- View: At-Risk Contracts
CREATE OR REPLACE VIEW admin_at_risk_contracts AS
SELECT 
  c.id,
  c.title,
  c.status,
  c.total_amount,
  c.health_status,
  cm.risk_level,
  cm.risk_score,
  cm.flags,
  cm.issue_type,
  cm.first_detected,
  client.full_name as client_name,
  freelancer.full_name as freelancer_name,
  EXTRACT(DAY FROM (NOW() - c.last_activity_at)) as days_inactive
FROM contracts c
LEFT JOIN contract_monitoring cm ON cm.contract_id = c.id AND cm.status = 'active'
LEFT JOIN profiles client ON c.client_id = client.id
LEFT JOIN profiles freelancer ON c.freelancer_id = freelancer.id
WHERE 
  c.status IN ('active', 'pending')
  AND (
    cm.risk_level IN ('HIGH', 'CRITICAL')
    OR c.health_status IN ('warning', 'critical')
    OR EXTRACT(DAY FROM (NOW() - c.last_activity_at)) >= 7
  )
ORDER BY 
  CASE cm.risk_level
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    ELSE 4
  END,
  cm.first_detected DESC;

-- View: Payment Issues
CREATE OR REPLACE VIEW admin_payment_issues AS
SELECT 
  c.id as contract_id,
  c.title,
  cm.id as milestone_id,
  cm.title as milestone_title,
  cm.amount,
  cm.status as milestone_status,
  cm.due_date,
  cm.delivered_at,
  EXTRACT(DAY FROM (NOW() - cm.delivered_at)) as days_pending,
  client.full_name as client_name,
  client.id as client_id,
  freelancer.full_name as freelancer_name,
  freelancer.id as freelancer_id
FROM contracts c
JOIN contract_milestones cm ON cm.contract_id = c.id
LEFT JOIN profiles client ON c.client_id = client.id
LEFT JOIN profiles freelancer ON c.freelancer_id = freelancer.id
WHERE 
  cm.status = 'delivered'
  AND cm.payment_status = 'pending'
  AND cm.delivered_at < NOW() - INTERVAL '3 days'
ORDER BY cm.delivered_at ASC;

-- View: User Violation Summary
CREATE OR REPLACE VIEW admin_user_violations AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.email,
  p.role,
  p.trust_score,
  p.account_status,
  COUNT(vh.id) as total_violations,
  COUNT(CASE WHEN vh.severity = 'CRITICAL' THEN 1 END) as critical_violations,
  COUNT(CASE WHEN vh.severity = 'HIGH' THEN 1 END) as high_violations,
  MAX(vh.recorded_at) as last_violation_date,
  STRING_AGG(DISTINCT vh.violation_type, ', ') as violation_types
FROM profiles p
LEFT JOIN violation_history vh ON vh.user_id = p.id
WHERE vh.id IS NOT NULL
GROUP BY p.id, p.full_name, p.email, p.role, p.trust_score, p.account_status
HAVING COUNT(vh.id) > 0
ORDER BY critical_violations DESC, total_violations DESC;

-- ==============================================
-- 12. FUNCTIONS FOR AUTOMATED DETECTION
-- ==============================================

-- Function: Calculate contract risk score
CREATE OR REPLACE FUNCTION calculate_contract_risk_score(contract_uuid TEXT)
RETURNS INTEGER AS $$
DECLARE
  risk_score INTEGER := 0;
  days_inactive INTEGER;
  days_overdue INTEGER;
  freelancer_last_login TIMESTAMPTZ;
BEGIN
  -- Check days since last activity
  SELECT EXTRACT(DAY FROM (NOW() - last_activity_at))
  INTO days_inactive
  FROM contracts
  WHERE id = contract_uuid;
  
  IF days_inactive >= 7 THEN
    risk_score := risk_score + (days_inactive * 5);
  END IF;
  
  -- Check overdue milestones
  SELECT EXTRACT(DAY FROM (NOW() - MIN(due_date)))
  INTO days_overdue
  FROM contract_milestones
  WHERE contract_id = contract_uuid
    AND status = 'in_progress'
    AND due_date < NOW();
  
  IF days_overdue > 0 THEN
    risk_score := risk_score + (days_overdue * 10);
  END IF;
  
  -- Add more checks as needed...
  
  RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-detect and flag contracts
CREATE OR REPLACE FUNCTION auto_detect_contract_issues()
RETURNS void AS $$
BEGIN
  -- Flag contracts with no activity for 7+ days
  INSERT INTO contract_monitoring (contract_id, issue_type, risk_level, flags, risk_score)
  SELECT 
    c.id,
    'no_activity',
    CASE 
      WHEN EXTRACT(DAY FROM (NOW() - c.last_activity_at)) >= 14 THEN 'CRITICAL'
      WHEN EXTRACT(DAY FROM (NOW() - c.last_activity_at)) >= 10 THEN 'HIGH'
      ELSE 'MEDIUM'
    END,
    jsonb_build_array(
      format('No activity for %s days', EXTRACT(DAY FROM (NOW() - c.last_activity_at)))
    ),
    EXTRACT(DAY FROM (NOW() - c.last_activity_at))::INTEGER * 5
  FROM contracts c
  WHERE c.status = 'active'
    AND c.last_activity_at < NOW() - INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM contract_monitoring cm
      WHERE cm.contract_id = c.id 
        AND cm.issue_type = 'no_activity'
        AND cm.status = 'active'
    );
    
  -- Flag payment delays
  INSERT INTO contract_monitoring (contract_id, issue_type, risk_level, flags, risk_score)
  SELECT 
    cm.contract_id,
    'payment_delay',
    CASE 
      WHEN EXTRACT(DAY FROM (NOW() - cm.delivered_at)) >= 10 THEN 'CRITICAL'
      WHEN EXTRACT(DAY FROM (NOW() - cm.delivered_at)) >= 5 THEN 'HIGH'
      ELSE 'MEDIUM'
    END,
    jsonb_build_array(
      format('Payment pending for %s days', EXTRACT(DAY FROM (NOW() - cm.delivered_at)))
    ),
    EXTRACT(DAY FROM (NOW() - cm.delivered_at))::INTEGER * 8
  FROM contract_milestones cm
  WHERE cm.status = 'delivered'
    AND cm.payment_status = 'pending'
    AND cm.delivered_at < NOW() - INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM contract_monitoring cmon
      WHERE cmon.contract_id = cm.contract_id 
        AND cmon.issue_type = 'payment_delay'
        AND cmon.status = 'active'
    );
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 13. TRIGGERS FOR AUTOMATIC UPDATES
-- ==============================================

-- Update last_activity_at on contract changes
CREATE OR REPLACE FUNCTION update_contract_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contracts
  SET last_activity_at = NOW()
  WHERE id = NEW.contract_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contract_milestone_activity
AFTER INSERT OR UPDATE ON contract_milestones
FOR EACH ROW
EXECUTE FUNCTION update_contract_activity();

-- Log all contract activities
CREATE OR REPLACE FUNCTION log_contract_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO contract_activity_log (contract_id, activity_type, details)
  VALUES (
    NEW.id,
    TG_OP,
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 14. SCHEDULED JOB (Run via pg_cron or external scheduler)
-- ==============================================
-- To run automatically every hour, use:
-- SELECT cron.schedule('detect-contract-issues', '0 * * * *', 'SELECT auto_detect_contract_issues()');

-- ==============================================
-- 15. RLS POLICIES FOR ADMIN ACCESS
-- ==============================================

-- Enable RLS
ALTER TABLE contract_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_disputes ENABLE ROW LEVEL SECURITY;

-- Admin access policies
CREATE POLICY "Admins can view all monitoring data"
  ON contract_monitoring
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can manage monitoring data"
  ON contract_monitoring
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Similar policies for other admin tables...

-- ==============================================
-- 16. GRANT PERMISSIONS
-- ==============================================
GRANT ALL ON contract_monitoring TO authenticated;
GRANT ALL ON admin_actions TO authenticated;
GRANT ALL ON violation_history TO authenticated;
GRANT ALL ON contract_disputes TO authenticated;
GRANT ALL ON contract_activity_log TO authenticated;
GRANT ALL ON notification_queue TO authenticated;

-- Grant access to sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
