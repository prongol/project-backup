-- =====================================================
-- FIX CONTRACT TRIGGER - Replace deadline with end_date
-- This fixes the error: record "old" has no field "deadline"
-- =====================================================

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS contract_change_trigger ON contracts;
DROP FUNCTION IF EXISTS record_contract_change();

-- Recreate the function with the correct field names
CREATE OR REPLACE FUNCTION record_contract_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Record edit in history when contract is modified (excluding status-only changes)
  IF (TG_OP = 'UPDATE' AND (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.total_amount IS DISTINCT FROM NEW.total_amount OR
    OLD.end_date IS DISTINCT FROM NEW.end_date OR
    OLD.contract_type IS DISTINCT FROM NEW.contract_type
  )) THEN
    INSERT INTO contract_history (
      contract_id,
      edited_by,
      change_type,
      previous_data,
      new_data,
      change_summary
    ) VALUES (
      NEW.id,
      NEW.edited_by,
      'edited',
      jsonb_build_object(
        'title', OLD.title,
        'description', OLD.description,
        'total_amount', OLD.total_amount,
        'end_date', OLD.end_date,
        'contract_type', OLD.contract_type
      ),
      jsonb_build_object(
        'title', NEW.title,
        'description', NEW.description,
        'total_amount', NEW.total_amount,
        'end_date', NEW.end_date,
        'contract_type', NEW.contract_type
      ),
      'Contract details updated'
    );
    
    -- Update last_edited_at
    NEW.last_edited_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER contract_change_trigger
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION record_contract_change();

-- Verify the fix
SELECT 'Contract trigger has been fixed successfully!' AS status;
