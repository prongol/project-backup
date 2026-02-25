# 🚨 FIX: "Database error saving new user"

## Problem
Your registration is failing because the database tables don't exist in Supabase yet.

## Solution (5 minutes)

### Step 1: Open Supabase Dashboard
1. Open your browser
2. Go to: **https://ghnxqbhjpkaszvtxbsdk.supabase.co**
3. Log in if needed

### Step 2: Open SQL Editor
1. Look at the **left sidebar**
2. Click on **"SQL Editor"**
3. Click the **"New Query"** button

### Step 3: Get the SQL Script
1. In VS Code, open the file: **`DATABASE_SETUP.md`** (it's in your project root)
2. Scroll down to find the SQL code (starts with `CREATE EXTENSION IF NOT EXISTS`)
3. Select **ALL** the SQL code (Ctrl+A or Cmd+A)
4. Copy it (Ctrl+C or Cmd+C)

### Step 4: Run the SQL Script
1. Go back to Supabase SQL Editor
2. Paste the SQL code (Ctrl+V or Cmd+V)
3. Click the **"Run"** button (green play button) or press Ctrl+Enter
4. Wait for completion (should show "Success. No rows returned")

### Step 5: Verify Tables Created
1. In Supabase, click **"Table Editor"** in the left sidebar
2. You should now see these tables:
   - ✅ profiles
   - ✅ clients
   - ✅ freelancers
   - ✅ jobs
   - ✅ proposals
   - ✅ contracts

### Step 6: Enable Email Authentication
1. Click **"Authentication"** in the left sidebar
2. Click **"Providers"** tab
3. Find **"Email"** provider
4. Make sure it's **toggled ON** (green)

### Step 7: Test Registration Again
1. Go back to your app: http://localhost:3000/register
2. Fill in the form:
   - Full name: **Samarpan KC**
   - Username: **kcsamar34** (or any unique username)
   - Email: **kcsamar34@gmail.com**
   - Password: (at least 8 characters)
3. Click **"Create account"**

## ✅ It Should Work Now!

If you still get an error, check:
1. All SQL ran successfully (no red errors in Supabase)
2. Email auth is enabled
3. Your internet connection is working
4. Try a different username if the current one is taken

## 🆘 Still Having Issues?

Check the browser console (F12) for detailed error messages and share them with me.

---

**Quick Reference:**
- Supabase Dashboard: https://ghnxqbhjpkaszvtxbsdk.supabase.co
- SQL Script: `DATABASE_SETUP.md`
- Registration Page: http://localhost:3000/register
