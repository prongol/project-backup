# 🔧 Contract Trigger Fix

## Problem
When trying to sign a contract, you're getting this error:
```
record "old" has no field "deadline"
```

## Cause
The database trigger `record_contract_change()` was trying to access a column called `deadline`, but the contracts table actually uses `end_date` instead.

## Solution
The fix updates the trigger to use the correct field names:
- Changed `deadline` → `end_date`
- Changed `payment_type` → `contract_type`

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query" button

3. **Run the Fix**
   - Open the file: `FIX_CONTRACT_TRIGGER.sql`
   - Copy ALL the SQL code
   - Paste into the Supabase SQL Editor
   - Click "Run" button (or press `Ctrl/Cmd + Enter`)
   - Wait for "Success" message

4. **Verify**
   - You should see: "Contract trigger has been fixed successfully!"
   - Try signing a contract again - the error should be gone

### Option 2: Using the Script

```bash
node fix-contract-trigger.js
```

This will show you instructions to manually apply the fix.

## What Was Fixed

The SQL file `FIX_CONTRACT_TRIGGER.sql` contains:

```sql
-- Drops the old trigger with wrong field names
DROP TRIGGER IF EXISTS contract_change_trigger ON contracts;
DROP FUNCTION IF EXISTS record_contract_change();

-- Creates new trigger with correct field names
CREATE OR REPLACE FUNCTION record_contract_change() ...
-- Now uses: end_date instead of deadline
-- Now uses: contract_type instead of payment_type
```

## After the Fix

Once applied, you'll be able to:
- ✅ Sign contracts without errors
- ✅ Edit contract details
- ✅ Track contract history properly

## Files Modified

1. `ADD_CONTRACT_HISTORY_SYSTEM.sql` - Source file updated
2. `FIX_CONTRACT_TRIGGER.sql` - Migration script created
3. `fix-contract-trigger.js` - Helper script created

## Need Help?

If the error persists after applying the fix:
1. Check that the SQL executed successfully in Supabase
2. Refresh your application
3. Try signing the contract again
4. Check browser console for any new errors

---

**Status**: Ready to apply
**Difficulty**: Easy (copy-paste SQL)
**Time**: 2 minutes
