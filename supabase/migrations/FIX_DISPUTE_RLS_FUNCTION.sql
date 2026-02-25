-- =====================================================
-- FIX DISPUTE RLS FUNCTION
-- Update can_file_dispute to use correct schema
-- =====================================================

-- Drop and recreate the function with correct logic
CREATE OR REPLACE FUNCTION can_file_dispute(
  p_user_id UUID,
  p_contract_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_account_status VARCHAR(20);
  v_is_party BOOLEAN;
  v_client_profile_id UUID;
  v_freelancer_profile_id UUID;
BEGIN
  -- Check if user is suspended
  SELECT account_status INTO v_account_status
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_account_status = 'suspended' OR v_account_status = 'banned' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is part of the contract (client or freelancer)
  -- Get profile_ids from clients and freelancers tables
  SELECT 
    cl.profile_id,
    fl.profile_id
  INTO 
    v_client_profile_id,
    v_freelancer_profile_id
  FROM contracts c
  LEFT JOIN clients cl ON c.client_id = cl.id
  LEFT JOIN freelancers fl ON c.freelancer_id = fl.id
  WHERE c.id = p_contract_id;
  
  -- If contract not found, return FALSE
  IF v_client_profile_id IS NULL AND v_freelancer_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user's profile_id matches either client or freelancer
  -- Use COALESCE to handle NULL comparisons
  v_is_party := (
    COALESCE(v_client_profile_id = p_user_id, FALSE) OR 
    COALESCE(v_freelancer_profile_id = p_user_id, FALSE)
  );
  
  RETURN v_is_party;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION can_file_dispute TO authenticated;

-- Test the function (optional - remove if not needed)
-- SELECT can_file_dispute('e80da86a-b8d2-4c5c-ad40-7645b67853ca', '0f44b303-7b02-4a4c-a957-104663f9b387');
