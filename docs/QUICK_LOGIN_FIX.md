# Quick Login Fix Guide

## Problem
Login button stuck on "Signing in..." state

## Root Cause
Missing or incorrect Supabase environment variables

## Solution Steps

### 1. Create `.env.local` File
Create a file named `.env.local` in your project root (`d:\Samarpan\Code\Web\Projects\neplancer\.env.local`)

### 2. Add Your Supabase Credentials

Go to your Supabase project dashboard:
- Visit: https://supabase.com/dashboard
- Select your project
- Go to Settings → API

Copy these values and paste into `.env.local`:

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Email Configuration (Optional for now)
RESEND_API_KEY=re_demo_key
RESEND_FROM_EMAIL=noreply@neplancer.com

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Restart Your Development Server

**Stop the current server** (Ctrl+C in terminal)

**Start it again:**
```bash
npm run dev
```

### 4. Clear Browser Cache (Optional)
- Press `Ctrl + Shift + Delete`
- Clear cached images and files
- OR open an incognito/private window

### 5. Try Login Again
- Navigate to `http://localhost:3000/login`
- Enter your credentials
- Click Sign in

## Still Having Issues?

### Check Browser Console for Errors:
1. Press `F12` to open DevTools
2. Click on "Console" tab
3. Look for red error messages
4. Common errors:
   - "Invalid API key" → Check SUPABASE_ANON_KEY
   - "Invalid URL" → Check SUPABASE_URL
   - "Network error" → Check internet connection

### Verify Supabase Setup:
Run this SQL in Supabase SQL Editor to check if your account exists:

```sql
SELECT id, email, full_name, role, is_admin 
FROM profiles 
WHERE email = 'your-email@example.com';
```

If no results, you need to register first!

## Make Yourself Admin (After Successful Login)

```sql
UPDATE profiles
SET is_admin = TRUE, admin_level = 'super_admin'
WHERE email = 'your-email@example.com';
```

Then logout and login again.

## Contact
If still stuck, check:
- Supabase dashboard is accessible
- Database tables exist (profiles, clients, freelancers)
- Email is verified in Supabase Auth
