# 🚀 Quick Start - Get Database Working in 5 Minutes

## Step 1: Open Supabase (1 min)
1. Go to https://supabase.com
2. Sign in to your project
3. Click **SQL Editor** in sidebar

## Step 2: Run Database Setup (2 min)
1. Open `DATABASE_SETUP.md` in your project
2. Copy ALL the SQL code (starts at line 12, inside ```sql block)
3. Paste into Supabase SQL Editor
4. Click **"Run"** button
5. Wait for ✅ Success message

## Step 3: Enable Email Auth (30 sec)
1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled (toggle green)
3. Click **Save**

## Step 4: Verify Environment Variables (30 sec)
Check your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ghnxqbhjpkaszvtxbsdk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
✅ **Your .env.local is already configured!**

## Step 5: Test It! (1 min)
```bash
npm run dev
```

Then:
1. Open http://localhost:3000/register
2. Fill the form:
   - Name: Test User
   - Username: testuser123
   - Email: test@example.com
   - Password: password123
   - Select "Find Work" (freelancer)
3. Click "Create account"
4. ✅ Success! You're registered

## ✅ Done!

Your database is now working! You can:
- ✅ Register users
- ✅ Login/Logout
- ✅ Create jobs (as client)
- ✅ Submit proposals (as freelancer)

## Verify It Worked

**Check in Supabase:**
1. Go to **Table Editor** → **profiles**
2. You should see your test user
3. Go to **freelancers** table
4. You should see the freelancer record

**Check in Your App:**
1. Login at http://localhost:3000/login
2. Your name should appear in navbar
3. Click your name to see user menu
4. Click "Browse Jobs" to see jobs page

## 🐛 If Something's Wrong

**"Database error saving new user"**
→ Go back to Step 2, make sure SQL ran successfully

**"Invalid credentials"**
→ Double-check your .env.local file

**"Tables don't exist"**
→ Check Supabase **Table Editor** - should have 6 tables

## 📚 Full Documentation

- **SETUP_GUIDE.md** - Complete detailed guide
- **DATABASE_READY.md** - What was updated and why
- **DATABASE_SETUP.md** - SQL schema and structure

---

**That's it!** You're now ready to build your freelancing platform! 🎉
