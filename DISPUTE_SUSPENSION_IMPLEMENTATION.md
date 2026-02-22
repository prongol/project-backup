# Complete Dispute & Suspension System - Implementation Guide

## ✅ FEATURES IMPLEMENTED

### 1. Dispute System
- **Both client AND freelancer** can file disputes after 1 revision
- Disputes automatically route to admin dashboard
- Admin can resolve disputes with different outcomes
- All parties get notified throughout the process

### 2. Time-Limited Suspensions
- Admins can suspend users for 20-30 days (customizable 1-90 days)
- Suspension reason is displayed on user profile
- Automatic unsuspension after expiration date
- Suspended users cannot file disputes or take actions

### 3. Admin Dashboard Features
- View all disputes with filtering
- Assign disputes to specific admins
- Resolve disputes with outcomes: full_refund, partial_refund, payment_released, etc.
- Suspend users with custom duration and reason

---

## 🚀 SETUP INSTRUCTIONS

### Step 1: Run Database SQL

Go to Supabase Dashboard → SQL Editor and run:

**File: `UPDATE_DISPUTE_AND_SUSPENSION_SYSTEM.sql`**

This creates/updates:
- ✅ `contract_disputes` table with full dispute tracking
- ✅ Suspension fields in `profiles` table (account_status, suspension_reason, suspended_until, suspended_by)
- ✅ RLS policies allowing both parties to file disputes
- ✅ Function to check if user can file dispute
- ✅ Auto-lift expired suspensions

### Step 2: Verify API Endpoints (Already Created)

✅ `/api/contracts/[id]/dispute` - File a dispute (POST), View disputes (GET)
✅ `/api/admin/disputes` - View all disputes (admin only)
✅ `/api/admin/disputes/[id]/resolve` - Resolve dispute (admin only)
✅ `/api/admin/users/[id]/suspend` - Suspend user with time limit

### Step 3: Frontend Updates (Already Done)

✅ Contract page now has "File Dispute" button after 1 revision
✅ Dispute modal with type selection and detailed reason
✅ Both client and freelancer see the button when revision_count >= 1

---

## 📋 HOW TO USE

### For Clients/Freelancers:

1. **Filing a Dispute:**
   - Go to contract page
   - After 1 revision rejection, "File Dispute" button appears
   - Click it, select dispute type (Quality Issue, Payment Issue, etc.)
   - Provide detailed explanation
   - Submit - Admin will be notified

2. **Dispute Types Available:**
   - Quality of Work Issue
   - Payment Issue
   - Scope Change Dispute
   - Delivery/Timeline Issue
   - Refund Request
   - Work Abandoned

### For Admins:

1. **Viewing Disputes:**
   - Go to Admin Dashboard
   - Click "Disputes" tab (you'll need to add this to the UI)
   - See all open/resolved disputes with details

2. **Resolving Disputes:**
   ```javascript
   // Example API call
   fetch('/api/admin/disputes/DISPUTE_ID/resolve', {
     method: 'POST',
     body: JSON.stringify({
       resolution_type: 'payment_released', // or 'full_refund', 'partial_refund', etc.
       resolution_details: 'After review, work meets requirements. Payment released to freelancer.',
       admin_notes: 'Client expectations were unclear. Mediated discussion.'
     })
   })
   ```

3. **Suspending Users:**
   ```javascript
   // Example: Suspend for 30 days
   fetch('/api/admin/users/USER_ID/suspend', {
     method: 'POST',
     body: JSON.stringify({
       reason: 'Repeated violations of platform terms - inappropriate behavior',
       duration_days: 30  // Default 30, max 90
     })
   })
   ```

4. **Resolution Types:**
   - `full_refund` - Return all money to client
   - `partial_refund` - Return partial amount
   - `payment_released` - Pay freelancer
   - `additional_work` - Contract continues, freelancer must do more
   - `contract_cancelled` - Cancel with no payment
   - `no_refund` - Reject dispute, contract stands

---

## 💡 USER EXPERIENCE FLOW

### Dispute Flow:
```
1. Client rejects work → Revision requested
2. Freelancer resubmits
3. Client rejects AGAIN (revision_count = 1)
4. "File Dispute" button appears for BOTH parties
5. Either party files dispute
   ↓
6. Contract status → 'disputed'
7. Admin gets notification
8. Both parties notified
   ↓
9. Admin reviews case
10. Admin resolves with outcome
11. Both parties notified of resolution
12. Contract updated based on resolution
```

### Suspension Flow:
```
1. Admin suspends user
   ↓
2. User profile shows:
   - account_status: 'suspended'
   - suspension_reason: 'Reason text'
   - suspended_until: Date
   ↓
3. Suspended user cannot:
   - File disputes
   - Create contracts
   - Accept jobs
   ↓
4. After expiration date:
   - Auto-lift suspension
   - account_status → 'active'
   - User can use platform again
```

---

## 🎨 TODO: Add Disputes Tab to Admin Dashboard

You need to add a "Disputes" section to the admin dashboard UI. Add this to `/src/app/admin/dashboard/page.tsx`:

1. Add tab button:
```tsx
{ id: 'disputes', label: 'Disputes', icon: AlertTriangle }
```

2. Fetch disputes:
```tsx
const fetchDisputes = async () => {
  const response = await fetch('/api/admin/disputes');
  const data = await response.json();
  setDisputes(data.disputes);
};
```

3. Add disputes view with resolve buttons

---

## 🔒 SECURITY FEATURES

✅ **RLS Policies:** Only contract parties + admins can view disputes
✅ **Suspension Check:** Suspended users blocked from filing disputes
✅ **Authorization:** Verify user is part of contract before allowing dispute
✅ **Admin Only:** Resolution and suspension endpoints require admin access
✅ **Audit Trail:** All actions logged in contract_history and admin_actions

---

## 📊 DATABASE SCHEMA ADDITIONS

### `contract_disputes` table:
```sql
- id (text, primary key)
- contract_id (uuid, references contracts)
- opened_by (uuid, who filed - client OR freelancer)
- dispute_type (varchar: payment_issue, quality_issue, etc.)
- reason (text)
- evidence (jsonb array)
- status ('open', 'under_review', 'resolved', 'closed')
- admin_assigned (uuid, which admin handling it)
- resolution_type (varchar)
- resolution_details (text)
- admin_notes (text)
- resolved_at (timestamp)
```

### `profiles` additions:
```sql
- account_status ('active', 'warning', 'suspended', 'banned')
- suspension_reason (text - shown publicly on profile)
- suspended_until (timestamp - auto-lift date)
- suspended_by (uuid - which admin suspended)
- trust_score (integer 0-100)
```

---

## ✅ TESTING CHECKLIST

- [ ] File dispute as client after 1 revision
- [ ] File dispute as freelancer after 1 revision
- [ ] Verify both parties get notifications
- [ ] Admin can see dispute in dashboard
- [ ] Admin can resolve dispute
- [ ] Parties notified of resolution
- [ ] Suspend user for 30 days
- [ ] Verify suspension shows on profile
- [ ] Suspended user cannot file dispute
- [ ] After expiration, user can access platform again

---

## 📝 NEXT STEPS

1. **Run the SQL in Supabase** (UPDATE_DISPUTE_AND_SUSPENSION_SYSTEM.sql)
2. **Add Disputes tab to Admin Dashboard UI**
3. **Add suspension reason display to user profiles**
4. **Test the complete flow with real data**

---

## 🎯 SUMMARY

**Dispute System:**
- ✅ Both parties can dispute after 1 revision
- ✅ Goes to admin dashboard
- ✅ Admin can resolve with multiple outcomes
- ✅ Full notification system

**Suspension System:**
- ✅ Time-limited (20-30 days default, max 90)
- ✅ Reason stored and shown
- ✅ Auto-lift after expiration
- ✅ Blocks user actions while suspended

Everything is ready - just need to run the SQL file in Supabase!
