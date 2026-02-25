-- =============================================
-- FIX PROFILE_COMPLETED FLAG FOR EXISTING USERS
-- Run this if users are stuck in profile creation loop
-- =============================================

-- 1. Check which users have incomplete profiles
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.profile_completed,
    CASE 
        WHEN p.role = 'freelancer' THEN (SELECT COUNT(*) FROM freelancers WHERE profile_id = p.id)
        WHEN p.role = 'client' THEN (SELECT COUNT(*) FROM clients WHERE profile_id = p.id)
    END as has_profile_data
FROM profiles p
WHERE p.profile_completed = false OR p.profile_completed IS NULL
ORDER BY p.created_at DESC;

-- 2. Fix freelancers who have profile data but profile_completed is false
UPDATE profiles
SET profile_completed = true
WHERE id IN (
    SELECT p.id 
    FROM profiles p
    INNER JOIN freelancers f ON p.id = f.profile_id
    WHERE (p.profile_completed = false OR p.profile_completed IS NULL)
    AND f.username IS NOT NULL
    AND f.title IS NOT NULL
);

-- 3. Fix clients who have profile data but profile_completed is false
UPDATE profiles
SET profile_completed = true
WHERE id IN (
    SELECT p.id 
    FROM profiles p
    INNER JOIN clients c ON p.id = c.profile_id
    WHERE (p.profile_completed = false OR p.profile_completed IS NULL)
    AND c.location IS NOT NULL
);

-- 4. Verify the fix
SELECT 
    p.id,
    p.email,
    p.role,
    p.profile_completed,
    CASE 
        WHEN p.role = 'freelancer' THEN f.username
        WHEN p.role = 'client' THEN c.company_name
    END as profile_identifier
FROM profiles p
LEFT JOIN freelancers f ON p.id = f.profile_id
LEFT JOIN clients c ON p.id = c.profile_id
WHERE p.role IN ('freelancer', 'client')
ORDER BY p.created_at DESC;

-- =============================================
-- MANUAL FIX FOR SPECIFIC USER (if needed)
-- =============================================

-- Replace 'your-user-id' with the actual user ID having issues
/*
UPDATE profiles
SET profile_completed = true
WHERE id = 'your-user-id';
*/
