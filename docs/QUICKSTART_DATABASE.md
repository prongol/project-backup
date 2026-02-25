# Quick Start: Database Setup

## Step-by-Step Guide

### 1️⃣ Open Supabase SQL Editor

1. Go to: https://ghnxqbhjpkaszvtxbsdk.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### 2️⃣ Copy & Paste SQL

Open the file `DATABASE_SETUP.md` in this project and copy the ENTIRE SQL script (starts with `CREATE EXTENSION IF NOT EXISTS...`)

### 3️⃣ Run the Script

1. Paste the SQL into the editor
2. Click **Run** (or press Ctrl+Enter)
3. Wait for completion (should take 5-10 seconds)

### 4️⃣ Verify Tables Created

Click **Table Editor** in the left sidebar. You should see:
- ✅ profiles
- ✅ clients
- ✅ freelancers
- ✅ jobs
- ✅ proposals
- ✅ contracts

### 5️⃣ Enable Email Auth

1. Go to **Authentication** > **Providers**
2. Find **Email** 
3. Toggle it ON if not already enabled

### 6️⃣ Test Registration

1. Start your dev server: `npm run dev`
2. Go to: http://localhost:3000/register
3. Create a test account
4. Check Supabase **Authentication** tab to see the new user

### ✅ Done!

Your backend is ready. All API endpoints are working:
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in

### 🎯 Next: Update Frontend

Update your registration page to include the `username` field for freelancers:

```tsx
// In your register form, add:
{role === 'freelancer' && (
  <input
    type="text"
    name="username"
    placeholder="Username"
    required
  />
)}
```

### 🔍 Check Data

Go to **Table Editor** > **profiles** to see registered users!

---

**Need help?** Check `BACKEND_SETUP_COMPLETE.md` for detailed documentation.
