# 🔧 Fix Rating & Review System - Database Setup Required

## Problem
The rating system and work revision features are not working because 3 critical database tables are missing:
- ❌ `contract_submissions` - Required for work submission
- ❌ `work_reviews` - Required for review workflow and ratings
- ❌ `activities` - Required for activity tracking on dashboard

## Solution: Manual Database Setup (2 minutes)

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: **neplancer**
3. Click on **SQL Editor** in the left sidebar

### Step 2: Execute SQL Script
1. Click **New Query**
2. Copy the **ENTIRE contents** of `MINIMAL_REVIEW_SYSTEM.sql` (in your project root)
3. Paste it into the SQL editor
4. Click **RUN** (or press Ctrl+Enter)

### Step 3: Verify Tables Created
After running the SQL, verify by running this query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'contract_submissions',
    'work_reviews',
    'activities'
  )
ORDER BY table_name;
```

You should see all 3 tables listed.

### Step 4: Test the System
After tables are created, restart your dev server:
```bash
npm run dev
```

Then test:
1. **Work Submission**: Submit work on an active contract
2. **Review**: Client can approve or request revisions
3. **Rating**: After approval, both parties can rate each other
4. **Activity**: Dashboard should show recent activities

## What Gets Created

### Core Tables (3)
- `contract_submissions` - Work submitted by freelancers for client review
- `work_reviews` - Client reviews, ratings, and approval/revision requests
- `activities` - User activity logs for dashboard display

### Additional Features
- **Indexes** for fast queries
- **Row Level Security (RLS)** policies for data access control
- **Automatic trigger** to create review entry when work is submitted
- **3-day review deadline** automatically calculated

## Quick Verification Script

After setup, run this to verify:
```bash
node -r dotenv/config check-all-tables.js dotenv_config_path=.env.local
```

You should see:
```
✅ contract_submissions
✅ work_reviews
✅ activities
```

## Troubleshooting

### If SQL execution fails:
1. **Run in smaller chunks**: Execute one CREATE TABLE statement at a time
2. **Check for errors**: Red error messages will tell you what's wrong
3. **Ignore "already exists"**: If something already exists, that's fine

### If tables still missing:
Try creating just the core tables manually in SQL Editor:

```sql
-- Essential tables only
CREATE TABLE contract_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deliverables TEXT NOT NULL,
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE work_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES contract_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_status VARCHAR(50) DEFAULT 'pending',
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

## Need Help?

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Look for error messages in the SQL Editor
3. Ensure you're using the correct project
4. Verify your database connection in `.env.local`

---

**Once complete, your rating and review system will be fully functional! 🎉**
