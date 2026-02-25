-- Fix contracts table schema
-- Run this in Supabase SQL Editor if you're getting column not found errors

-- Check if proposal_id column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'proposal_id'
  ) THEN
    ALTER TABLE contracts ADD COLUMN proposal_id UUID;
    RAISE NOTICE 'Added proposal_id column to contracts table';
  ELSE
    RAISE NOTICE 'proposal_id column already exists';
  END IF;
END $$;

-- Check if job_id column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'job_id'
  ) THEN
    ALTER TABLE contracts ADD COLUMN job_id UUID;
    RAISE NOTICE 'Added job_id column to contracts table';
  ELSE
    RAISE NOTICE 'job_id column already exists';
  END IF;
END $$;

-- Check if description column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE contracts ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column to contracts table';
  ELSE
    RAISE NOTICE 'Description column already exists';
  END IF;
END $$;

-- Check if contract_type column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'contract_type'
  ) THEN
    ALTER TABLE contracts ADD COLUMN contract_type VARCHAR(50);
    RAISE NOTICE 'Added contract_type column to contracts table';
  ELSE
    RAISE NOTICE 'Contract_type column already exists';
  END IF;
  
  -- Drop existing CHECK constraint if it exists
  ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_contract_type_check;
  
  -- Add updated CHECK constraint
  ALTER TABLE contracts ADD CONSTRAINT contracts_contract_type_check 
    CHECK (contract_type IS NULL OR contract_type IN ('fixed_price', 'hourly', 'milestone'));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not modify contract_type constraints: %', SQLERRM;
END $$;

-- Check if hourly_rate column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE contracts ADD COLUMN hourly_rate DECIMAL(10, 2);
    RAISE NOTICE 'Added hourly_rate column to contracts table';
  ELSE
    RAISE NOTICE 'Hourly_rate column already exists';
  END IF;
END $$;

-- Check if start_date column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE contracts ADD COLUMN start_date TIMESTAMP;
    RAISE NOTICE 'Added start_date column to contracts table';
  ELSE
    RAISE NOTICE 'Start_date column already exists';
  END IF;
END $$;

-- Check if end_date column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'end_date'
  ) THEN
    ALTER TABLE contracts ADD COLUMN end_date TIMESTAMP;
    RAISE NOTICE 'Added end_date column to contracts table';
  ELSE
    RAISE NOTICE 'End_date column already exists';
  END IF;
END $$;

-- Check if estimated_hours column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'estimated_hours'
  ) THEN
    ALTER TABLE contracts ADD COLUMN estimated_hours INTEGER;
    RAISE NOTICE 'Added estimated_hours column to contracts table';
  ELSE
    RAISE NOTICE 'Estimated_hours column already exists';
  END IF;
END $$;

-- Check if terms column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'terms'
  ) THEN
    ALTER TABLE contracts ADD COLUMN terms TEXT;
    RAISE NOTICE 'Added terms column to contracts table';
  ELSE
    RAISE NOTICE 'Terms column already exists';
  END IF;
END $$;

-- Check if deliverables column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'deliverables'
  ) THEN
    ALTER TABLE contracts ADD COLUMN deliverables TEXT;
    RAISE NOTICE 'Added deliverables column to contracts table';
  ELSE
    RAISE NOTICE 'Deliverables column already exists';
  END IF;
END $$;

-- Check if payment_terms column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'payment_terms'
  ) THEN
    ALTER TABLE contracts ADD COLUMN payment_terms TEXT;
    RAISE NOTICE 'Added payment_terms column to contracts table';
  ELSE
    RAISE NOTICE 'Payment_terms column already exists';
  END IF;
END $$;

-- Check if custom_fields column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE contracts ADD COLUMN custom_fields JSONB DEFAULT '{}';
    RAISE NOTICE 'Added custom_fields column to contracts table';
  ELSE
    RAISE NOTICE 'Custom_fields column already exists';
  END IF;
END $$;

-- Check if currency column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE contracts ADD COLUMN currency VARCHAR(10) DEFAULT 'NPR';
    RAISE NOTICE 'Added currency column to contracts table';
  ELSE
    RAISE NOTICE 'Currency column already exists';
  END IF;
END $$;

-- Check if title column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE contracts ADD COLUMN title VARCHAR(255);
    RAISE NOTICE 'Added title column to contracts table';
  ELSE
    RAISE NOTICE 'Title column already exists';
  END IF;
  
  -- Remove NOT NULL constraint if it exists (we'll handle it in the application)
  ALTER TABLE contracts ALTER COLUMN title DROP NOT NULL;
  ALTER TABLE contracts ALTER COLUMN title SET DEFAULT 'Untitled Contract';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not modify title constraints: %', SQLERRM;
END $$;

-- Check if client_id column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE contracts ADD COLUMN client_id UUID;
    RAISE NOTICE 'Added client_id column to contracts table';
  ELSE
    RAISE NOTICE 'Client_id column already exists';
  END IF;
  
  -- Remove NOT NULL constraint to prevent insertion errors
  ALTER TABLE contracts ALTER COLUMN client_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not modify client_id constraints: %', SQLERRM;
END $$;

-- Check if freelancer_id column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'freelancer_id'
  ) THEN
    ALTER TABLE contracts ADD COLUMN freelancer_id UUID;
    RAISE NOTICE 'Added freelancer_id column to contracts table';
  ELSE
    RAISE NOTICE 'Freelancer_id column already exists';
  END IF;
  
  -- Remove NOT NULL constraint to prevent insertion errors
  ALTER TABLE contracts ALTER COLUMN freelancer_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not modify freelancer_id constraints: %', SQLERRM;
END $$;

-- Check if total_amount column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE contracts ADD COLUMN total_amount DECIMAL(12, 2) DEFAULT 0;
    RAISE NOTICE 'Added total_amount column to contracts table';
  ELSE
    RAISE NOTICE 'Total_amount column already exists';
  END IF;
  
  -- Remove NOT NULL constraint and set default to handle null values
  ALTER TABLE contracts ALTER COLUMN total_amount DROP NOT NULL;
  ALTER TABLE contracts ALTER COLUMN total_amount SET DEFAULT 0;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not modify total_amount constraints: %', SQLERRM;
END $$;

-- Check if budget column exists (some schemas might have this instead of total_amount)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'budget'
  ) THEN
    -- Add budget column as alias/alternative to total_amount
    ALTER TABLE contracts ADD COLUMN budget DECIMAL(12, 2);
    RAISE NOTICE 'Added budget column to contracts table';
  ELSE
    RAISE NOTICE 'Budget column already exists';
  END IF;
  
  -- Remove NOT NULL constraint if it exists
  ALTER TABLE contracts ALTER COLUMN budget DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not modify budget constraints: %', SQLERRM;
END $$;

-- Check if status column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE contracts ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    RAISE NOTICE 'Added status column to contracts table';
  ELSE
    RAISE NOTICE 'Status column already exists';
  END IF;
  
  -- Drop existing CHECK constraint if it exists
  ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
  
  -- Add updated CHECK constraint that allows NULL
  ALTER TABLE contracts ADD CONSTRAINT contracts_status_check 
    CHECK (status IS NULL OR status IN ('pending', 'active', 'completed', 'cancelled', 'disputed'));
    
  -- Set default value
  ALTER TABLE contracts ALTER COLUMN status SET DEFAULT 'pending';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not modify status constraints: %', SQLERRM;
END $$;

-- Check if created_at column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE contracts ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    RAISE NOTICE 'Added created_at column to contracts table';
  ELSE
    RAISE NOTICE 'Created_at column already exists';
  END IF;
END $$;

-- Check if updated_at column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE contracts ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to contracts table';
  ELSE
    RAISE NOTICE 'Updated_at column already exists';
  END IF;
END $$;

-- Check if client_signed_at column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'client_signed_at'
  ) THEN
    ALTER TABLE contracts ADD COLUMN client_signed_at TIMESTAMP;
    RAISE NOTICE 'Added client_signed_at column to contracts table';
  ELSE
    RAISE NOTICE 'Client_signed_at column already exists';
  END IF;
END $$;

-- Check if freelancer_signed_at column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'freelancer_signed_at'
  ) THEN
    ALTER TABLE contracts ADD COLUMN freelancer_signed_at TIMESTAMP;
    RAISE NOTICE 'Added freelancer_signed_at column to contracts table';
  ELSE
    RAISE NOTICE 'Freelancer_signed_at column already exists';
  END IF;
END $$;

-- Check if client_signature column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'client_signature'
  ) THEN
    ALTER TABLE contracts ADD COLUMN client_signature TEXT;
    RAISE NOTICE 'Added client_signature column to contracts table';
  ELSE
    RAISE NOTICE 'Client_signature column already exists';
  END IF;
END $$;

-- Check if freelancer_signature column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'freelancer_signature'
  ) THEN
    ALTER TABLE contracts ADD COLUMN freelancer_signature TEXT;
    RAISE NOTICE 'Added freelancer_signature column to contracts table';
  ELSE
    RAISE NOTICE 'Freelancer_signature column already exists';
  END IF;
END $$;

-- Check if completed_at column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE contracts ADD COLUMN completed_at TIMESTAMP;
    RAISE NOTICE 'Added completed_at column to contracts table';
  ELSE
    RAISE NOTICE 'Completed_at column already exists';
  END IF;
END $$;

-- Check if cancelled_at column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE contracts ADD COLUMN cancelled_at TIMESTAMP;
    RAISE NOTICE 'Added cancelled_at column to contracts table';
  ELSE
    RAISE NOTICE 'Cancelled_at column already exists';
  END IF;
END $$;

-- Check if cancellation_reason column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE contracts ADD COLUMN cancellation_reason TEXT;
    RAISE NOTICE 'Added cancellation_reason column to contracts table';
  ELSE
    RAISE NOTICE 'Cancellation_reason column already exists';
  END IF;
END $$;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'contracts'
ORDER BY ordinal_position;

-- ============================================================
-- FINAL CLEANUP: Remove problematic NOT NULL constraints
-- ============================================================

-- This section removes NOT NULL constraints that commonly cause insertion errors
DO $$ 
DECLARE
  col RECORD;
BEGIN
  RAISE NOTICE 'Removing NOT NULL constraints from optional columns...';
  
  -- List of columns that should allow NULL values
  FOR col IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name IN (
      'proposal_id', 'job_id', 'description', 'contract_type', 'hourly_rate',
      'start_date', 'end_date', 'estimated_hours', 'terms', 'deliverables',
      'payment_terms', 'custom_fields', 'client_signed_at', 'freelancer_signed_at',
      'client_signature', 'freelancer_signature', 'completed_at', 'cancelled_at',
      'cancellation_reason', 'budget', 'currency'
    )
    AND is_nullable = 'NO'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE contracts ALTER COLUMN %I DROP NOT NULL', col.column_name);
      RAISE NOTICE 'Removed NOT NULL from column: %', col.column_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not remove NOT NULL from %: %', col.column_name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Cleanup complete!';
END $$;

-- ============================================================
-- Add missing defaults to prevent NULL errors
-- ============================================================

DO $$ 
BEGIN
  -- Ensure status has default
  ALTER TABLE contracts ALTER COLUMN status SET DEFAULT 'pending';
  
  -- Ensure created_at has default
  ALTER TABLE contracts ALTER COLUMN created_at SET DEFAULT NOW();
  
  -- Ensure updated_at has default
  ALTER TABLE contracts ALTER COLUMN updated_at SET DEFAULT NOW();
  
  -- Ensure title has default
  ALTER TABLE contracts ALTER COLUMN title SET DEFAULT 'Untitled Contract';
  
  -- Ensure total_amount has default
  ALTER TABLE contracts ALTER COLUMN total_amount SET DEFAULT 0;
  
  RAISE NOTICE 'Added default values to key columns';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not set defaults: %', SQLERRM;
END $$;

-- ============================================================
-- Final verification
-- ============================================================

SELECT 
  'Contracts table structure:' as info;

SELECT 
  column_name, 
  data_type,
  character_maximum_length,
  is_nullable,
  column_default,
  CASE 
    WHEN is_nullable = 'YES' THEN '✓ Nullable'
    ELSE '✗ NOT NULL'
  END as nullable_status
FROM information_schema.columns 
WHERE table_name = 'contracts'
ORDER BY ordinal_position;
