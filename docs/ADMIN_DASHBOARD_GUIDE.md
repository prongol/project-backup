# Admin Dashboard & Contract Monitoring System - Complete Implementation Guide

## ✅ Implementation Status

### 1. Contract Flow Improvements ✓
- **Proposal Approval Redirect**: After accepting a proposal, clients are automatically redirected to create a contract
- **Improved User Experience**: Clear messaging and smooth transitions between approval and contract creation

### 2. Database Schema ✓
**Location**: `DATABASE_ADMIN_MONITORING.sql`

**Tables Created:**
- `contract_monitoring` - Tracks all contract issues and risk scores
- `admin_actions` - Logs all admin interventions
- `violation_history` - Records user violations and penalties
- `contract_disputes` - Manages dispute resolution
- `contract_activity_log` - Tracks all contract activities
- `notification_queue` - Automated notification scheduling

**Views Created:**
- `admin_at_risk_contracts` - At-risk contracts with all metrics
- `admin_payment_issues` - Pending payments requiring attention
- `admin_user_violations` - User violation summaries

**Functions:**
- `calculate_contract_risk_score()` - Calculates risk scores dynamically
- `auto_detect_contract_issues()` - Automated issue detection

### 3. API Endpoints ✓

#### Admin Dashboard API
- `GET /api/admin/dashboard` - Dashboard overview with stats
- `GET /api/admin/monitoring` - Get monitoring issues
- `POST /api/admin/monitoring` - Create monitoring issue
- `PATCH /api/admin/monitoring/[id]` - Update monitoring issue

#### Admin Actions API
- `POST /api/admin/actions` - Execute admin actions
  - contact_user
  - freeze_escrow
  - release_payment
  - suspend_account
  - cancel_contract
  - mediate_dispute
  - issue_warning
- `GET /api/admin/actions` - Get action history

#### Disputes API
- `GET /api/disputes` - Get disputes (filtered by user/admin)
- `POST /api/disputes` - Create new dispute
- `GET /api/disputes/[id]` - Get single dispute
- `PATCH /api/disputes/[id]` - Update/resolve dispute

### 4. Email Templates ✓
**Location**: `src/lib/email.ts`

**New Templates:**
- `getContractWarningEmail()` - Admin warnings to users
- `getInactivityWarningEmail()` - Inactivity alerts
- `getPaymentDelayEmail()` - Payment reminders

### 5. Admin Dashboard UI ✓
**Location**: `src/app/admin/dashboard/page.tsx`

**Features:**
- Real-time statistics dashboard
- At-risk contracts table
- Payment issues view
- Active disputes management
- Filterable tabs
- Quick action buttons
- Risk level indicators
- Visual health metrics

## 📋 Setup Instructions

### Step 1: Run Database Migration
```sql
-- Execute in Supabase SQL Editor
-- File: DATABASE_ADMIN_MONITORING.sql
```

This creates all necessary tables, views, functions, and triggers.

### Step 2: Create Admin User
```sql
-- Make a user an admin
UPDATE profiles
SET 
  is_admin = TRUE,
  admin_level = 'super_admin',
  admin_permissions = '["view_dashboard", "take_actions", "resolve_disputes"]'::jsonb
WHERE email = 'admin@neplancer.com';
```

### Step 3: Set Up Automated Detection
```sql
-- Run this periodically (every hour recommended)
SELECT auto_detect_contract_issues();

-- Or set up with pg_cron (if available)
SELECT cron.schedule(
  'detect-contract-issues',
  '0 * * * *',  -- Every hour
  'SELECT auto_detect_contract_issues()'
);
```

### Step 4: Configure Notifications
Ensure email configuration is set up:
```env
RESEND_API_KEY=your_api_key
RESEND_FROM_EMAIL=noreply@neplancer.com
NEXT_PUBLIC_APP_URL=https://neplancer.com
```

## 🎯 Admin Features

### 1. Real-Time Monitoring Dashboard

**Key Metrics:**
- Total At-Risk Contracts
- Critical Issues Count
- High Risk Issues
- Payment Delays
- Active Disputes

**Issue Breakdown:**
- Abandoned Work
- Payment Delays
- No Activity
- Disputes

### 2. Automated Detection System

**Abandonment Detection:**
- Freelancer inactive 5+ days: +30 risk score
- No communication 7+ days: +25 risk score
- Milestone overdue: +5 per day
- 0% progress after 7 days: +20 risk score
- Client complaints: +35 risk score

**Payment Issue Detection:**
- Payment pending 5+ days: HIGH severity
- Payment pending 10+ days: CRITICAL severity
- Escrow held 14+ days: HIGH severity
- Completed contract, incomplete payment: CRITICAL

**Risk Levels:**
- CRITICAL: Score >= 70
- HIGH: Score >= 40  
- MEDIUM: Score >= 20
- LOW: Score < 20

### 3. Admin Action Workflow

**For Abandoned Work:**
```
Day 5: Automated warning email
Day 7: Appears in admin dashboard
Day 8: Admin direct contact
Day 10: Escalation (freeze escrow, offer cancellation)
Resolution: Complete, cancel, or suspend
```

**For Payment Issues:**
```
Day 3: Automated reminder
Day 5: Warning email
Day 7: Appears in admin dashboard
Day 8: Admin intervention
Day 10-14: Auto-release or dispute
```

### 4. Admin Actions Available

1. **Contact User** - Send warning/reminder emails
2. **Freeze Escrow** - Protect funds during investigation
3. **Release Payment** - Override and release milestone payment
4. **Suspend Account** - Temporary suspension with reason
5. **Cancel Contract** - Cancel and issue refunds
6. **Mediate Dispute** - Assign admin to mediate
7. **Issue Warning** - Log violation and decrease trust score

### 5. Dispute Resolution Process

**Evidence Collection:**
- Contract messages and files
- Milestone submission history
- Payment transaction records
- Both parties' statements
- Screenshots and proof

**Resolution Options:**
- Full refund to client
- Full payment to freelancer
- Partial payment (compromise)
- Escrow split based on work completed
- Require additional revisions
- Penalties to violating party

### 6. Trust Score System

**Default:** 100 points

**Penalties:**
- Warning: -10 points
- Late payment: -15 points
- Abandoned work: -25 points
- Dispute loss: -30 points
- Terms violation: -40 points

**Account Status Thresholds:**
- 80-100: Active (green)
- 60-79: Warning (yellow)
- 40-59: Restricted (orange)
- 0-39: Suspended (red)

## 📊 Dashboard Views

### At-Risk Contracts Tab
Displays:
- Contract title and ID
- Client and freelancer names
- Risk level badge
- Issue type
- Days inactive
- Risk score
- Flags and warnings
- Quick action buttons

### Payment Issues Tab
Displays:
- Contract and milestone details
- Amount pending
- Days since delivery
- Client and freelancer info
- Quick investigation button

### Active Disputes Tab
Displays:
- Dispute type and reason
- Amount disputed
- Opened by (user)
- Created date
- Status
- Quick resolve button

## 🚀 Usage Guide

### For Admins:

1. **Access Dashboard**
   - Navigate to `/admin/dashboard`
   - View real-time stats

2. **Review At-Risk Contracts**
   - Click "At-Risk Contracts" tab
   - Sort by risk level
   - Review flags and details

3. **Take Action**
   - Click "Take Action" button
   - Select action type
   - Provide notes/reason
   - Execute action

4. **Resolve Disputes**
   - Go to "Active Disputes" tab
   - Click "Resolve" on dispute
   - Review evidence
   - Make decision
   - Apply resolution

5. **Monitor User Violations**
   - Query `admin_user_violations` view
   - Review violation history
   - Apply appropriate penalties

### For Users:

**Opening a Dispute:**
```javascript
POST /api/disputes
{
  contract_id: "contract-uuid",
  dispute_type: "payment_issue",
  reason: "Work delivered but payment not released",
  evidence: ["url1", "url2"],
  amount_disputed: 500
}
```

**Checking Dispute Status:**
```javascript
GET /api/disputes?contract_id=uuid
```

## 🔧 Customization

### Adjust Risk Thresholds

Edit `DATABASE_ADMIN_MONITORING.sql`:
```sql
-- Modify risk level calculation
CASE 
  WHEN EXTRACT(DAY FROM (NOW() - c.last_activity_at)) >= 14 THEN 'CRITICAL'
  WHEN EXTRACT(DAY FROM (NOW() - c.last_activity_at)) >= 10 THEN 'HIGH'
  -- Adjust these values as needed
END
```

### Add New Admin Actions

1. Add case to `/api/admin/actions/route.ts`
2. Implement action logic
3. Log to `admin_actions` table
4. Send appropriate notifications

### Customize Email Templates

Edit `src/lib/email.ts`:
- Modify HTML templates
- Adjust wording and styling
- Add new template functions

## 📈 Reporting

### Weekly Admin Report
```sql
SELECT 
  COUNT(*) FILTER (WHERE risk_level = 'CRITICAL') as critical_count,
  COUNT(*) FILTER (WHERE risk_level = 'HIGH') as high_count,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
  AVG(EXTRACT(DAY FROM (resolved_at - first_detected))) as avg_resolution_days
FROM contract_monitoring
WHERE first_detected >= NOW() - INTERVAL '7 days';
```

### User Violation Report
```sql
SELECT * FROM admin_user_violations
WHERE total_violations > 3
ORDER BY critical_violations DESC, total_violations DESC;
```

### Payment Issue Trends
```sql
SELECT 
  DATE_TRUNC('week', cm.delivered_at) as week,
  COUNT(*) as payment_issues,
  AVG(EXTRACT(DAY FROM (NOW() - cm.delivered_at))) as avg_days_pending
FROM contract_milestones cm
WHERE status = 'delivered' AND payment_status = 'pending'
GROUP BY week
ORDER BY week DESC;
```

## 🔐 Security & Permissions

### RLS Policies
All admin tables have Row Level Security enabled:
```sql
-- Only admins can access
CREATE POLICY "Admins only"
  ON contract_monitoring
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );
```

### Admin Levels
- **support**: View only, can comment
- **moderator**: View + basic actions
- **admin**: Full access except deletions
- **super_admin**: Complete access

## ⚠️ Best Practices

1. **Regular Monitoring**: Check dashboard daily
2. **Quick Response**: Address critical issues within 24 hours
3. **Documentation**: Always add notes to actions
4. **Fair Mediation**: Review all evidence before deciding
5. **Communication**: Keep both parties informed
6. **Consistency**: Apply penalties consistently
7. **Escalation Path**: Know when to involve senior admins
8. **Privacy**: Handle user data responsibly

## 🐛 Troubleshooting

### Issue: Auto-detection not working
**Solution**: Run manually: `SELECT auto_detect_contract_issues();`

### Issue: Admin can't access dashboard
**Solution**: Verify `is_admin = TRUE` in profiles table

### Issue: Emails not sending
**Solution**: Check Resend API key and email templates

### Issue: Risk scores seem incorrect
**Solution**: Review `calculate_contract_risk_score()` function

## 📞 Support

For issues or questions:
- Review this documentation
- Check database logs
- Contact development team
- Email: admin@neplancer.com

---

**Version**: 1.0.0
**Last Updated**: January 17, 2026
**Status**: Production Ready ✅
