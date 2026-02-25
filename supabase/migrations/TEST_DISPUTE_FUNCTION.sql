-- =====================================================
-- TEST DISPUTE RLS FUNCTION
-- Run this to see what's happening
-- =====================================================

-- Test 1: Check if the function exists and what it returns
SELECT can_file_dispute(
  'e80da86a-b8d2-4c5c-ad40-7645b67853ca'::UUID,
  '0f44b303-7b02-4a4c-a957-104663f9b387'::UUID
) AS can_file;

-- Test 2: Check the contract and related profile IDs
SELECT 
  c.id as contract_id,
  c.client_id,
  c.freelancer_id,
  cl.profile_id as client_profile_id,
  fl.profile_id as freelancer_profile_id
FROM contracts c
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN freelancers fl ON c.freelancer_id = fl.id
WHERE c.id = '0f44b303-7b02-4a4c-a957-104663f9b387';

-- Test 3: Check the user's profile
SELECT id, email, account_status
FROM profiles
WHERE id = 'e80da86a-b8d2-4c5c-ad40-7645b67853ca';

-- Test 4: Manual check if user is part of contract
SELECT 
  CASE 
    WHEN cl.profile_id = 'e80da86a-b8d2-4c5c-ad40-7645b67853ca' THEN 'User is CLIENT'
    WHEN fl.profile_id = 'e80da86a-b8d2-4c5c-ad40-7645b67853ca' THEN 'User is FREELANCER'
    ELSE 'User is NOT part of contract'
  END as user_role
FROM contracts c
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN freelancers fl ON c.freelancer_id = fl.id
WHERE c.id = '0f44b303-7b02-4a4c-a957-104663f9b387';
