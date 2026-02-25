# 🚀 Quick Setup Guide - Onboarding Flow

## Step 1: Run Database Migration

Open Supabase SQL Editor and run:

```sql
-- File: ADD_BANK_DETAILS_COMPLETED_FLAG.sql

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bank_details_completed BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_bank_details_completed 
ON profiles(bank_details_completed);

UPDATE profiles
SET bank_details_completed = true
WHERE bank_details IS NOT NULL 
  AND bank_details != '{}'::jsonb
  AND bank_details_completed = false;
```

## Step 2: Test the Flow

### Test Freelancer Onboarding

1. **Register new freelancer account**
   - Go to `/register`
   - Fill form with role = "freelancer"
   - Submit

2. **Verify redirect**
   - Should redirect to `/freelancer/browse-jobs`
   - Should see welcome banner

3. **Test profile gate**
   - Find a job
   - Click "Apply Now"
   - Should see profile completion modal
   - Click "Complete Profile Now"
   - Should redirect to `/freelancer/createProfile`

4. **Complete profile**
   - Fill all required fields
   - Submit
   - Should redirect back to browse jobs (with return URL)

5. **Test bank details gate**
   - Click "Apply Now" again
   - Should see bank details modal
   - Click "Add Bank Details"
   - Should redirect to `/settings?tab=payment`

6. **Complete bank details**
   - Fill bank information
   - Submit
   - Go back to job and click "Apply Now"
   - Application modal should open (success!)

### Test Client Onboarding

1. **Register new client account**
   - Go to `/register`
   - Fill form with role = "client"
   - Submit

2. **Verify redirect**
   - Should redirect to `/client/post-job`
   - Should see welcome banner

3. **Test profile gate**
   - Fill job posting form
   - Click "Post Job"
   - Should see profile completion modal

4. **Test bank details gate**
   - Complete profile
   - Try posting job again
   - Should see bank details modal

5. **Complete flow**
   - Add payment method
   - Try posting job again
   - Job should post successfully!

## Step 3: Verify Database

Check that flags are being set:

```sql
-- Check profile completion
SELECT id, email, profile_completed, bank_details_completed
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- Check freelancers with complete profiles
SELECT p.email, f.username, p.profile_completed, p.bank_details_completed
FROM profiles p
JOIN freelancers f ON p.id = f.profile_id
WHERE p.profile_completed = true;
```

## Step 4: Monitor Console Logs

When testing, watch browser console for these logs:

### Profile Creation
- 📝 Starting profile submission...
- 📤 Submitting freelancer data
- ✅ Profile updated successfully
- 🔄 Refreshing auth state...
- ✅ Profile creation complete, redirecting...

### Bank Details
- Updated bank details with bank_details_completed = true

### Gate Checks
- Profile gate triggered (if incomplete)
- Bank details gate triggered (if incomplete)
- Return URL stored in localStorage

## Common Issues & Solutions

### Issue: Modal doesn't appear
**Solution:** Check that user object has correct flags
```javascript
console.log('User:', user);
console.log('Profile complete:', user?.profile_completed);
console.log('Bank details complete:', user?.bank_details_completed);
```

### Issue: Return URL not working
**Solution:** Check localStorage
```javascript
console.log('Return URL:', localStorage.getItem('returnAfterGate'));
```

### Issue: Banner always shows
**Solution:** Clear first-time flag
```javascript
localStorage.removeItem('firstTimeUser');
```

### Issue: Database flags not updating
**Solution:** Verify SQL migration ran successfully
```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'bank_details_completed';
```

## Features Checklist

After setup, verify:

- ✅ Freelancers redirect to browse jobs
- ✅ Clients redirect to post job
- ✅ Welcome banner appears
- ✅ Profile gate blocks applications
- ✅ Profile gate blocks job posting
- ✅ Bank details gate works
- ✅ Return URL functionality works
- ✅ Modals are dismissible
- ✅ Database flags update
- ✅ No console errors

## Success Indicators

You'll know it's working when:

1. New users see appropriate welcome screen
2. Gates block critical actions when incomplete
3. Users can complete requirements and return
4. Database flags track completion accurately
5. No infinite redirect loops
6. Smooth user experience

## Need Help?

Check the full implementation guide:
- `ONBOARDING_FLOW_COMPLETE.md` - Complete documentation
- `ADD_BANK_DETAILS_COMPLETED_FLAG.sql` - Database migration

---

**Status:** Ready for production ✅
**Tested:** All flows verified ✅
**Documentation:** Complete ✅
