# Database Setup Guide

This guide will help you set up your Supabase database for the Neplancer platform.

## Prerequisites
- Supabase account created
- Project created on Supabase
- Environment variables set in `.env.local`

## Database Schema

### 1. Create Tables

Go to your Supabase SQL Editor and run the following SQL commands:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('client', 'freelancer');
CREATE TYPE job_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE contract_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE freelancer_status AS ENUM ('online', 'connecting', 'offline');

-- =============================================
-- PROFILES TABLE (Main user table)
-- =============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- CLIENTS TABLE
-- =============================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT,
    company_description TEXT,
    website TEXT,
    location TEXT,
    jobs_posted INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(profile_id)
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients viewable by everyone" ON clients
    FOR SELECT USING (true);

CREATE POLICY "Clients can update own data" ON clients
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Clients can insert own data" ON clients
    FOR INSERT WITH CHECK (profile_id = auth.uid());

-- =============================================
-- FREELANCERS TABLE
-- =============================================
CREATE TABLE freelancers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    title TEXT,
    bio TEXT,
    skills TEXT[] DEFAULT '{}',
    hourly_rate DECIMAL(10, 2),
    total_earned DECIMAL(10, 2) DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    status freelancer_status DEFAULT 'offline',
    portfolio_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(profile_id)
);

ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Freelancers viewable by everyone" ON freelancers
    FOR SELECT USING (true);

CREATE POLICY "Freelancers can update own data" ON freelancers
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Freelancers can insert own data" ON freelancers
    FOR INSERT WITH CHECK (profile_id = auth.uid());

-- =============================================
-- JOBS TABLE
-- =============================================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    status job_status DEFAULT 'open',
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs viewable by everyone" ON jobs
    FOR SELECT USING (true);

CREATE POLICY "Clients can create jobs" ON jobs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients WHERE clients.id = jobs.client_id AND clients.profile_id = auth.uid()
        )
    );

CREATE POLICY "Clients can update own jobs" ON jobs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients WHERE clients.id = jobs.client_id AND clients.profile_id = auth.uid()
        )
    );

-- =============================================
-- PROPOSALS TABLE
-- =============================================
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    freelancer_id UUID REFERENCES freelancers(id) ON DELETE CASCADE NOT NULL,
    cover_letter TEXT NOT NULL,
    proposed_budget DECIMAL(10, 2) NOT NULL,
    estimated_duration TEXT NOT NULL,
    status proposal_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(job_id, freelancer_id)
);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proposals viewable by job owner and freelancer" ON proposals
    FOR SELECT USING (
        freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid())
        OR job_id IN (
            SELECT jobs.id FROM jobs 
            JOIN clients ON jobs.client_id = clients.id 
            WHERE clients.profile_id = auth.uid()
        )
    );

CREATE POLICY "Freelancers can create proposals" ON proposals
    FOR INSERT WITH CHECK (
        freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid())
    );

CREATE POLICY "Freelancers can update own proposals" ON proposals
    FOR UPDATE USING (
        freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid())
    );

-- =============================================
-- CONTRACTS TABLE
-- =============================================
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    freelancer_id UUID REFERENCES freelancers(id) ON DELETE CASCADE NOT NULL,
    budget DECIMAL(10, 2) NOT NULL,
    terms TEXT NOT NULL,
    status contract_status DEFAULT 'draft',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contracts viewable by client and freelancer" ON contracts
    FOR SELECT USING (
        client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
        OR freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid())
    );

CREATE POLICY "Clients can create contracts" ON contracts
    FOR INSERT WITH CHECK (
        client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
    );

CREATE POLICY "Clients and freelancers can update contracts" ON contracts
    FOR UPDATE USING (
        client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
        OR freelancer_id IN (SELECT id FROM freelancers WHERE profile_id = auth.uid())
    );

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_freelancers_updated_at BEFORE UPDATE ON freelancers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
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

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- INDEXES for Performance
-- =============================================
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_clients_profile_id ON clients(profile_id);
CREATE INDEX idx_freelancers_profile_id ON freelancers(profile_id);
CREATE INDEX idx_freelancers_username ON freelancers(username);
CREATE INDEX idx_freelancers_status ON freelancers(status);
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_proposals_job_id ON proposals(job_id);
CREATE INDEX idx_proposals_freelancer_id ON proposals(freelancer_id);
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_freelancer_id ON contracts(freelancer_id);
```

## 2. Enable Authentication

In your Supabase dashboard:

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email templates if needed
4. Optional: Enable social providers (Google, GitHub, etc.)

## 3. Storage (Optional - for avatars, portfolios)

```sql
-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 4. Test Data (Optional)

You can insert some test data to verify everything works:

```sql
-- This will be handled by your application after user registration
-- Just showing the structure here for reference
```

## Next Steps

1. Run all the SQL commands in your Supabase SQL Editor
2. Verify all tables are created successfully
3. Check Row Level Security policies are enabled
4. Install required npm packages (see below)
5. Test authentication flow

## Required NPM Packages

```bash
npm install @supabase/supabase-js
```

## Environment Variables

Ensure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Verification Checklist

- [ ] All tables created successfully
- [ ] Row Level Security enabled on all tables
- [ ] Triggers working (updated_at)
- [ ] Authentication enabled
- [ ] Storage bucket created (if using)
- [ ] Test user can register
- [ ] Test user can login
- [ ] Profile auto-created on signup
