# 🔧 Troubleshooting Common Database Issues

## Before You Start

Make sure you've completed:
- ✅ Ran SQL from `DATABASE_SETUP.md` in Supabase
- ✅ Enabled Email authentication
- ✅ `.env.local` file has correct credentials
- ✅ Restarted your dev server after any `.env.local` changes

---

## Common Errors & Solutions

### ❌ "Database error saving new user"

**Symptoms:**
- Registration fails
- Error message appears during signup
- User not created in Supabase

**Cause:** Database tables don't exist yet

**Solution:**
1. Open Supabase dashboard → **SQL Editor**
2. Copy ALL SQL from `DATABASE_SETUP.md` (inside the ```sql code block)
3. Paste and click **Run**
4. Check **Table Editor** - should see 6 tables
5. Try registering again

**Verify Fix:**
```sql
-- Run this in Supabase SQL Editor to check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```
Should return: profiles, clients, freelancers, jobs, proposals, contracts

---

### ❌ "Invalid API credentials" / "supabaseUrl is required"

**Symptoms:**
- Can't connect to Supabase
- All database operations fail
- Console shows Supabase connection errors

**Cause:** Environment variables not set or incorrect

**Solution:**
1. Check `.env.local` exists in project root
2. Verify it contains:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Get correct values from Supabase:
   - Dashboard → Settings → API
   - Copy **Project URL** and **anon public** key
4. Restart dev server: `npm run dev`

**Your Current Values:**
```
NEXT_PUBLIC_SUPABASE_URL=https://ghnxqbhjpkaszvtxbsdk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```
✅ These are already configured!

---

### ❌ "Username already taken"

**Symptoms:**
- Registration fails for freelancer
- Error message about username

**Cause:** Username exists in database

**Solution (Option 1 - Choose different username):**
- Use a different username
- Try: `yourname123`, `yourname_dev`, etc.

**Solution (Option 2 - Delete test user):**
1. Supabase → **Authentication** → **Users**
2. Find and delete the test user
3. Supabase → **Table Editor** → **profiles**
4. Delete the corresponding profile row
5. Supabase → **Table Editor** → **freelancers**
6. Delete the corresponding freelancer row
7. Try registration again

---

### ❌ "Email not confirmed"

**Symptoms:**
- Can register but can't login
- Message about confirming email
- No email received

**Cause:** Supabase requires email confirmation by default

**Solution (Disable for testing):**
1. Supabase → **Authentication** → **Providers**
2. Click on **Email** provider
3. Find **"Confirm email"** toggle
4. Turn it OFF for development
5. Click **Save**
6. Try logging in again

**Note:** Re-enable this in production for security!

---

### ❌ React Hydration Warning

**Symptoms:**
```
Warning: Prop `suppressHydrationWarning` did not match
Warning: Text content did not match
```

**Cause:** Server/client rendering mismatch or browser extensions

**Solution:**
✅ Already fixed! The layout.tsx has `suppressHydrationWarning` attribute

If still seeing warnings:
1. Check browser extensions (QuickBooks, Grammarly, etc.)
2. Try in incognito/private mode
3. These warnings don't break functionality - can be ignored

---

### ❌ "Failed to fetch user profile"

**Symptoms:**
- Login succeeds but redirects fail
- Profile data not loading
- Blank dashboard

**Cause:** Profile not created during signup

**Solution:**
1. Check if profile trigger is working:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM profiles WHERE email = 'your-test-email@example.com';
   ```
2. If no profile found, trigger didn't fire
3. Re-run the trigger creation SQL from `DATABASE_SETUP.md`:
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
       INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
       VALUES (
           NEW.id,
           NEW.email,
           COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
           COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'),
           NEW.raw_user_meta_data->>'avatar_url'
       );
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

---

### ❌ Password Too Short

**Symptoms:**
- Registration fails with password error
- Message about password length

**Cause:** Supabase requires min 6 characters, app requires 8

**Solution:**
- Use password with at least 8 characters
- Example: `password123`, `myPass123!`

---

### ❌ "Session expired" / Keeps logging out

**Symptoms:**
- Gets logged out randomly
- Session doesn't persist
- Have to login frequently

**Cause:** Session not being stored properly

**Solution:**
1. Clear browser storage:
   - Open DevTools (F12)
   - Go to Application/Storage tab
   - Clear localStorage and cookies
2. Login again
3. Check if `authToken` is stored in localStorage

**Already Fixed:** The updated `auth.ts` now properly stores sessions!

---

### ❌ Build Errors / TypeScript Errors

**Symptoms:**
```
Type error: Cannot find module '@/lib/auth'
Type error: Property 'role' does not exist on type 'User'
```

**Solution:**
1. Make sure all files are saved
2. Restart TypeScript server:
   - VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
3. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

---

### ❌ Tables Not Appearing in Supabase

**Symptoms:**
- SQL runs successfully but tables don't show
- Table Editor is empty

**Cause:** SQL didn't actually execute or errors were ignored

**Solution:**
1. Copy SQL in smaller chunks
2. Run each CREATE TABLE statement separately
3. Check for error messages in SQL Editor
4. Common issues:
   - Forgot to enable UUID extension (first line of SQL)
   - Didn't create ENUMs first
   - Trying to create duplicate tables

**To start fresh:**
```sql
-- Drop all tables (WARNING: deletes all data)
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS freelancers CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS proposal_status CASCADE;
DROP TYPE IF EXISTS contract_status CASCADE;
DROP TYPE IF EXISTS freelancer_status CASCADE;

-- Now run the full SQL from DATABASE_SETUP.md again
```

---

### ❌ RLS (Row Level Security) Errors

**Symptoms:**
```
new row violates row-level security policy
permission denied for table
```

**Cause:** Row Level Security blocking operations

**Solution:**
1. Make sure you're logged in (check user in navbar)
2. Verify RLS policies were created:
   ```sql
   -- Check policies exist
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```
3. Re-run the policy creation SQL from `DATABASE_SETUP.md`

**For testing only (NOT production):**
```sql
-- Temporarily disable RLS (testing only!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE freelancers DISABLE ROW LEVEL SECURITY;
-- etc...
```

---

## 🔍 Debugging Tips

### Check Supabase Logs
1. Supabase dashboard → **Logs**
2. Click **Postgres Logs** or **API Logs**
3. Look for errors during registration/login

### Check Browser Console
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for red errors
4. Common ones:
   - Network errors (401, 403, 500)
   - CORS errors
   - TypeScript errors

### Check Network Tab
1. Open DevTools (F12)
2. Go to **Network** tab
3. Try registration/login
4. Look for failed requests (red)
5. Click on request → **Response** tab to see error

### Verify Database State
```sql
-- Check if user exists
SELECT * FROM auth.users WHERE email = 'your-email@example.com';

-- Check if profile exists
SELECT * FROM profiles WHERE email = 'your-email@example.com';

-- Check if freelancer exists
SELECT * FROM freelancers WHERE profile_id = 'user-id-here';

-- Check all tables have data
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'freelancers', COUNT(*) FROM freelancers
UNION ALL
SELECT 'jobs', COUNT(*) FROM jobs
UNION ALL
SELECT 'proposals', COUNT(*) FROM proposals
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts;
```

---

## 🆘 Still Not Working?

1. **Review Guides:**
   - `SETUP_GUIDE.md` - Step-by-step setup
   - `QUICK_START_DATABASE.md` - Fast setup
   - `DATABASE_SETUP.md` - SQL schema

2. **Check All Steps:**
   - [ ] SQL executed in Supabase
   - [ ] 6 tables exist in Table Editor
   - [ ] Email auth enabled
   - [ ] .env.local configured
   - [ ] Dev server restarted
   - [ ] Browser cache cleared

3. **Test Basics:**
   ```bash
   # Check if environment variables load
   npm run dev
   # Should NOT show "supabaseUrl is required" error
   ```

4. **Start Fresh:**
   - Delete test users from Supabase
   - Clear browser localStorage
   - Re-run SQL setup
   - Try registration with new email

---

## ✅ Success Checklist

Your setup is working correctly when:
- [ ] Can access http://localhost:3000
- [ ] Can register new user (both roles)
- [ ] User appears in Supabase Authentication → Users
- [ ] Profile row created in profiles table
- [ ] Client/Freelancer row created in respective table
- [ ] Can login with registered user
- [ ] Navbar shows user name
- [ ] User menu appears when clicking name
- [ ] Can logout successfully
- [ ] No console errors

---

**Need more help?** Check the complete setup guide in `SETUP_GUIDE.md`
