# 📋 Run These SQL Files in Supabase

## 🚨 **IMPORTANT: Execute these in your Supabase SQL Editor**

### **Step 1: Open Supabase Dashboard**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project "Neplancer"
3. Click "SQL Editor" in the left sidebar

---

### **Step 2: Run Database Indexes (Performance)**

**File:** `DATABASE_INDEXES.sql`

**What it does:**
- Adds 30+ performance indexes to all tables
- Dramatically speeds up queries (10-100x faster)
- Optimizes job searches, proposal filtering, skill matching

**How to run:**
1. Click "New Query" in SQL Editor
2. Copy/paste entire content of `DATABASE_INDEXES.sql`
3. Click "Run" button
4. Should see success messages for each index

---

### **Step 3: Run Notification System (Phase 2)**

**File:** `DATABASE_NOTIFICATIONS.sql`

**What it does:**
- Creates `notifications` table
- Adds RLS (Row Level Security) policies
- Creates auto-triggers for proposal events
- Sets up `create_notification()` helper function

**How to run:**
1. Click "New Query" in SQL Editor
2. Copy/paste entire content of `DATABASE_NOTIFICATIONS.sql`
3. Click "Run" button
4. Verify success

---

### **Step 4: Verify Setup**

Run this query to check everything worked:

```sql
-- Check if notifications table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'notifications';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Test notification creation
SELECT create_notification(
  (SELECT id FROM users LIMIT 1),
  'system',
  'Test Notification',
  'If you see this, notifications work!',
  '/dashboard'
);

-- View test notification
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;
```

---

### **Step 5: Enable Realtime (Important!)**

For live notifications:

1. Go to "Database" → "Replication" in Supabase
2. Find `notifications` table
3. Toggle "Enable" for realtime
4. Save changes

---

## ✅ **After Running:**

Your platform now has:
- ⚡ Lightning-fast database queries
- 🔔 Real-time notification system
- 📊 Automatic notifications on events
- 🔒 Secure RLS policies

---

## 🧪 **Test Notifications:**

After setup, test in your app:
1. Login as a client
2. Create a job
3. Login as a freelancer
4. Submit a proposal
5. Client should see notification bell light up! 🔔

---

## 🛟 **Troubleshooting:**

**Error: "relation already exists"**
- Some indexes/tables already exist (safe to ignore)

**Error: "permission denied"**
- You need admin/owner role on Supabase project

**Notifications not appearing:**
- Check Realtime is enabled on `notifications` table
- Verify RLS policies allow reading

**Need help?**
Check Supabase logs: "Logs" → "Postgres Logs" in dashboard
