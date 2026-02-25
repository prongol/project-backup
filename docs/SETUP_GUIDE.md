# 🚀 Neplancer - Complete Setup Guide

This guide will walk you through setting up your Neplancer platform database and getting it ready for use.

## 📋 Prerequisites

- ✅ Supabase account (create at [supabase.com](https://supabase.com))
- ✅ Node.js installed (v18 or higher)
- ✅ Project cloned and dependencies installed

## 🗄️ Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Project Name**: `neplancer` (or your choice)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
4. Click **"Create new project"** and wait for setup to complete (~2 minutes)

### 1.2 Get Your API Credentials

1. In your Supabase project dashboard, click **⚙️ Settings** (bottom left)
2. Click **API** in the sidebar
3. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

### 1.3 Configure Environment Variables

1. In your project root, create/update `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual values from Step 1.2

## 🏗️ Step 2: Run Database Setup SQL

### 2.1 Open SQL Editor

1. In Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"** button

### 2.2 Execute Database Schema

1. Open the file `DATABASE_SETUP.md` in your project
2. Copy ALL the SQL code (from line 12 onwards - the part inside the ```sql code block)
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** button (or press `Ctrl/Cmd + Enter`)
5. Wait for completion - you should see ✅ **"Success. No rows returned"**

### 2.3 Verify Tables Created

1. Click **Table Editor** in the left sidebar
2. You should now see these 6 tables:
   - ✅ `profiles`
   - ✅ `clients`
   - ✅ `freelancers`
   - ✅ `jobs`
   - ✅ `proposals`
   - ✅ `contracts`

## 🔐 Step 3: Enable Email Authentication

### 3.1 Configure Auth Settings

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Find **Email** provider
3. Make sure it's **Enabled** (toggle should be green)
4. Scroll down and click **Save**

### 3.2 Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the templates if needed:
   - **Confirm signup**
   - **Magic Link**
   - **Change Email Address**
   - **Reset Password**

### 3.3 Update Auth Settings

1. Go to **Authentication** → **URL Configuration**
2. Add your site URL:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: `http://localhost:3000/**`
3. Click **Save**

## 📦 Step 4: Install Dependencies

Make sure all npm packages are installed:

```bash
npm install
```

Key packages:
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - Server-side rendering support
- `next` - Next.js framework
- `react` - React library

## 🧪 Step 5: Test Your Setup

### 5.1 Start Development Server

```bash
npm run dev
```

Your app should now be running at `http://localhost:3000`

### 5.2 Test Registration Flow

1. Open browser to `http://localhost:3000`
2. Click **"Sign up"** or go to `http://localhost:3000/register`
3. Try creating a freelancer account:
   - **Full name**: Test User
   - **Username**: testuser
   - **Email**: test@example.com
   - **Password**: password123
   - **Role**: Select "Find Work" (freelancer)
4. Click **"Create account"**

### 5.3 Check Database

1. Go back to Supabase dashboard
2. Click **Table Editor** → **profiles**
3. You should see your new user!
4. Check **freelancers** table - should have matching record

### 5.4 Test Login

1. Go to `http://localhost:3000/login`
2. Enter the email and password you just created
3. Click **"Sign in"**
4. You should be redirected to `/freelancer/browse-jobs`

## ✅ Verification Checklist

Go through this checklist to make sure everything is set up correctly:

- [ ] Supabase project created
- [ ] Environment variables configured in `.env.local`
- [ ] All 6 database tables created (profiles, clients, freelancers, jobs, proposals, contracts)
- [ ] Row Level Security enabled on all tables
- [ ] Authentication triggers working (profile auto-creation)
- [ ] Email authentication enabled
- [ ] Dependencies installed (`npm install` completed)
- [ ] Development server starts without errors (`npm run dev`)
- [ ] Can register a new user
- [ ] User appears in `profiles` table
- [ ] Role-specific record created (freelancers/clients table)
- [ ] Can log in with registered user
- [ ] Navbar shows user name and logout option when logged in

## 🐛 Troubleshooting

### "Database error saving new user"

**Cause**: Database tables not created yet

**Solution**: 
1. Make sure you ran ALL the SQL from `DATABASE_SETUP.md`
2. Check **Table Editor** in Supabase - all 6 tables should exist
3. Try running the SQL again (it's safe to run multiple times)

### "Invalid API key"

**Cause**: Environment variables not set correctly

**Solution**:
1. Check `.env.local` file exists in project root
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
3. Restart your development server (`npm run dev`)

### "Email not confirmed"

**Cause**: Supabase requires email confirmation by default

**Solution**:
1. Go to **Authentication** → **Providers** in Supabase
2. Scroll to **Email** provider settings
3. Disable **"Confirm email"** for testing (can re-enable later)
4. Click **Save**

### "Username already taken"

**Cause**: Username exists in database

**Solution**:
1. Choose a different username, OR
2. Delete the test user from Supabase:
   - Go to **Authentication** → **Users**
   - Find the user and click delete
   - Go to **Table Editor** → **profiles** and delete the corresponding row

### Tables not appearing in Supabase

**Cause**: SQL script didn't run successfully

**Solution**:
1. Check for error messages in SQL Editor
2. Make sure you're copying the SQL from INSIDE the ```sql code block in `DATABASE_SETUP.md`
3. Try running sections of SQL separately if needed

## 🎯 Next Steps

Once everything is working:

1. **Create more test data**:
   - Register multiple users (both clients and freelancers)
   - Test posting jobs as a client
   - Test submitting proposals as a freelancer

2. **Customize your profile**:
   - Add skills to freelancer profile
   - Update bio and hourly rate
   - Add portfolio links

3. **Start building features**:
   - Browse the existing pages
   - Create new pages as needed
   - Customize styling

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🆘 Need Help?

If you're stuck:
1. Check the error message carefully
2. Review this guide step by step
3. Check Supabase logs: **Logs** → **Postgres Logs** in dashboard
4. Review `DATABASE_SETUP.md` for database schema details

---

**🎉 Congratulations!** Once you complete this guide, your Neplancer platform will be fully operational with:
- ✅ Complete database schema
- ✅ User authentication
- ✅ Role-based access (clients & freelancers)
- ✅ Secure API routes
- ✅ Real-time session management

Happy coding! 🚀
