-- ==========================================
-- NEPLANCER DATABASE PERFORMANCE INDEXES
-- ==========================================
-- Run this SQL in your Supabase SQL Editor to add performance indexes
-- These indexes will significantly speed up common queries
-- ==========================================

-- JOBS TABLE INDEXES
-- ==========================================

-- Index for fetching jobs by status (most common query)
CREATE INDEX IF NOT EXISTS idx_jobs_status 
ON jobs(status);

-- Index for fetching jobs by category
CREATE INDEX IF NOT EXISTS idx_jobs_category 
ON jobs(category);

-- Index for fetching jobs by client_id (client's jobs list)
CREATE INDEX IF NOT EXISTS idx_jobs_client_id 
ON jobs(client_id);

-- Composite index for filtering by status and created_at (browse jobs page)
CREATE INDEX IF NOT EXISTS idx_jobs_status_created 
ON jobs(status, created_at DESC);

-- Composite index for filtering by category and status
CREATE INDEX IF NOT EXISTS idx_jobs_category_status 
ON jobs(category, status);

-- Index for budget range filtering
CREATE INDEX IF NOT EXISTS idx_jobs_budget 
ON jobs(budget);

-- Full-text search index for job title and description
CREATE INDEX IF NOT EXISTS idx_jobs_search 
ON jobs USING gin(to_tsvector('english', title || ' ' || description));

-- ==========================================
-- PROPOSALS TABLE INDEXES
-- ==========================================

-- Index for fetching proposals by job_id
CREATE INDEX IF NOT EXISTS idx_proposals_job_id 
ON proposals(job_id);

-- Index for fetching proposals by freelancer_id
CREATE INDEX IF NOT EXISTS idx_proposals_freelancer_id 
ON proposals(freelancer_id);

-- Index for fetching proposals by status
CREATE INDEX IF NOT EXISTS idx_proposals_status 
ON proposals(status);

-- Composite index for freelancer's proposals with status
CREATE INDEX IF NOT EXISTS idx_proposals_freelancer_status 
ON proposals(freelancer_id, status);

-- Composite index for job's proposals with status and created_at
CREATE INDEX IF NOT EXISTS idx_proposals_job_status_created 
ON proposals(job_id, status, created_at DESC);

-- ==========================================
-- FREELANCERS TABLE INDEXES
-- ==========================================

-- Index for fetching by profile_id
CREATE INDEX IF NOT EXISTS idx_freelancers_profile_id 
ON freelancers(profile_id);

-- Index for fetching by username (unique constraint already acts as index)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_freelancers_username 
-- ON freelancers(username);

-- Index for filtering by rating
CREATE INDEX IF NOT EXISTS idx_freelancers_rating 
ON freelancers(rating DESC);

-- Index for filtering by hourly_rate
CREATE INDEX IF NOT EXISTS idx_freelancers_hourly_rate 
ON freelancers(hourly_rate);

-- Index for filtering by status (available/busy/unavailable)
CREATE INDEX IF NOT EXISTS idx_freelancers_status 
ON freelancers(status);

-- GIN index for skills array searching
CREATE INDEX IF NOT EXISTS idx_freelancers_skills 
ON freelancers USING gin(skills);

-- Composite index for filtering by rating and completed_jobs
CREATE INDEX IF NOT EXISTS idx_freelancers_rating_jobs 
ON freelancers(rating DESC, completed_jobs DESC);

-- ==========================================
-- CLIENTS TABLE INDEXES
-- ==========================================

-- Index for fetching by profile_id
CREATE INDEX IF NOT EXISTS idx_clients_profile_id 
ON clients(profile_id);

-- Index for sorting by jobs_posted
CREATE INDEX IF NOT EXISTS idx_clients_jobs_posted 
ON clients(jobs_posted DESC);

-- Index for location-based filtering
CREATE INDEX IF NOT EXISTS idx_clients_location 
ON clients(location);

-- ==========================================
-- CONTRACTS TABLE INDEXES
-- ==========================================

-- Index for fetching contracts by client_id
CREATE INDEX IF NOT EXISTS idx_contracts_client_id 
ON contracts(client_id);

-- Index for fetching contracts by freelancer_id
CREATE INDEX IF NOT EXISTS idx_contracts_freelancer_id 
ON contracts(freelancer_id);

-- Index for fetching contracts by job_id
CREATE INDEX IF NOT EXISTS idx_contracts_job_id 
ON contracts(job_id);

-- Index for fetching contracts by status
CREATE INDEX IF NOT EXISTS idx_contracts_status 
ON contracts(status);

-- Composite index for freelancer's contracts with status
CREATE INDEX IF NOT EXISTS idx_contracts_freelancer_status 
ON contracts(freelancer_id, status);

-- Composite index for client's contracts with status
CREATE INDEX IF NOT EXISTS idx_contracts_client_status 
ON contracts(client_id, status);

-- ==========================================
-- PROFILES TABLE INDEXES
-- ==========================================

-- Index for fetching by email
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- Index for fetching by role
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role);

-- Composite index for role-based queries with created_at
CREATE INDEX IF NOT EXISTS idx_profiles_role_created 
ON profiles(role, created_at DESC);

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Run this query to verify all indexes were created successfully
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM 
  pg_indexes
WHERE 
  schemaname = 'public'
  AND tablename IN ('jobs', 'proposals', 'freelancers', 'clients', 'contracts', 'profiles')
ORDER BY 
  tablename, indexname;

-- ==========================================
-- PERFORMANCE TIPS
-- ==========================================

/*
1. These indexes will automatically be used by PostgreSQL query optimizer
2. Monitor query performance using EXPLAIN ANALYZE
3. Consider adding more indexes based on your specific query patterns
4. Regularly run VACUUM ANALYZE to keep statistics up to date
5. For very large tables (>1M rows), consider partitioning

Example of checking if an index is being used:
EXPLAIN ANALYZE
SELECT * FROM jobs WHERE status = 'open' ORDER BY created_at DESC LIMIT 20;
*/

-- ==========================================
-- OPTIONAL: COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ==========================================

-- If you have queries that filter by multiple columns frequently, add these:

-- Jobs filtered by client, status, and sorted by date
CREATE INDEX IF NOT EXISTS idx_jobs_client_status_created 
ON jobs(client_id, status, created_at DESC);

-- Freelancers filtered by skills and sorted by rating
-- Already covered by GIN index on skills and separate rating index

-- ==========================================
-- NOTES
-- ==========================================

/*
✅ All indexes are created with IF NOT EXISTS to prevent errors on re-run
✅ Indexes are designed for the most common query patterns
✅ GIN indexes are used for array and full-text search
✅ Composite indexes are ordered for optimal query performance
✅ DESC is used where sorting in descending order is common

⚠️ Remember:
- Indexes speed up reads but slightly slow down writes
- Each index takes up storage space
- Too many indexes can hurt performance
- Monitor and adjust based on actual usage patterns
*/
