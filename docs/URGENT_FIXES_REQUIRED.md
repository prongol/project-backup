# 🚨 Urgent Fixes Required

## Issues Reported
1. ❌ Rating system not working
2. ❌ Stripe payment system not working
3. ❌ Payment information showing error: `withdrawalAmount is not defined`
4. ❌ Stripe connection UI might be hidden

## Status: Fixed ✅

### 1. withdrawalAmount Error - FIXED ✅
**Issue**: Missing state variable for withdrawal amount
**Fix Applied**: Added `const [withdrawalAmount, setWithdrawalAmount] = useState('');` to PaymentInformation.tsx
**Status**: ✅ Fixed in code

### 2. Rating System - REQUIRES DATABASE SETUP ⚠️
**Issue**: Rating/review system can't work without required database tables
**Root Cause**: Missing 3 critical tables:
- `contract_submissions` - For submitting work
- `work_reviews` - For ratings and reviews
- `activities` - For activity tracking

**Solution**: You MUST run the SQL script to create these tables

#### How to Fix (2 minutes):
1. Go to https://supabase.com/dashboard
2. Select your neplancer project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open `MINIMAL_REVIEW_SYSTEM.sql` in your project root
6. Copy the entire file contents
7. Paste into SQL Editor
8. Click **RUN** or press Ctrl+Enter
9. Wait for "Success" message

After this:
- ✅ Rating system will work
- ✅ Work submission will work
- ✅ Review workflow will work
- ✅ Dashboard activities will show

### 3. Stripe Payment System - CHECK CONFIGURATION ⚠️

#### Freelancer Stripe Connection
The UI is **already there** and will show when:
- User is a freelancer
- Stripe account is not connected

**Flow**:
1. Freelancer goes to Settings → Payment Information
2. Sees "Connect Your Bank Account" card
3. Clicks "Connect with Stripe" button
4. Gets redirected to Stripe onboarding

**If not showing**, check:
- Is user role actually 'freelancer'?
- Check API route: `/api/stripe/connect` (GET)
- Check browser console for errors

#### Required Environment Variables
Verify these exist in `.env.local`:
```env
# Stripe Keys (REQUIRED)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# Stripe Connect (for freelancer payouts)
STRIPE_CONNECT_CLIENT_ID=ca_xxxxx

# App URL (for Stripe redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email notifications
RESEND_API_KEY=re_xxxxx
DISABLE_EMAILS=false
```

#### Verify Stripe APIs Exist
Check these files exist:
- ✅ `/api/stripe/connect` - Freelancer Stripe Connect
- ✅ `/api/stripe/payment-method` - Client payment methods
- ✅ `/api/stripe/customer-portal` - Manage cards
- ✅ `/api/stripe/transactions` - Transaction history

## Testing Checklist

### After Running SQL:
```bash
# Verify tables created
node -r dotenv/config check-all-tables.js dotenv_config_path=.env.local
```

Should show:
```
✅ contract_submissions
✅ work_reviews
✅ activities
```

### Test Rating System:
1. As freelancer: Submit work on active contract
2. As client: Approve or request revision
3. After approval: Both parties can rate each other

### Test Stripe (Freelancer):
1. Go to Settings → Payment Information
2. Click "Connect with Stripe"
3. Complete Stripe onboarding
4. Should see: Account Status, Balance, Withdrawal options

### Test Stripe (Client):
1. Go to Settings → Payment Information
2. Should see payment methods or add payment method
3. Click "Manage with Stripe" to open portal

## Quick Diagnosis Commands

### Check if tables exist:
```bash
node -r dotenv/config check-all-tables.js dotenv_config_path=.env.local
```

### Check Stripe configuration:
```bash
# Check if Stripe keys are loaded
grep STRIPE .env.local
```

### Check API routes:
```bash
# List Stripe API files
ls -la src/app/api/stripe/
```

## Common Issues & Solutions

### "Could not find table 'work_reviews'"
- **Cause**: SQL script not run
- **Fix**: Run `MINIMAL_REVIEW_SYSTEM.sql` in Supabase SQL Editor

### "Stripe Connect not showing"
- **Cause**: User might not be freelancer OR API returning error
- **Fix**: 
  1. Check user role in database
  2. Check browser console for API errors
  3. Verify `/api/stripe/connect` returns data

### "withdrawalAmount is not defined"
- **Status**: ✅ Already fixed in code
- **Action**: Just rebuild/refresh

### "Payment methods not loading"
- **Cause**: Stripe API key missing or invalid
- **Fix**: 
  1. Check `STRIPE_SECRET_KEY` in `.env.local`
  2. Verify Stripe account is in test mode
  3. Check `/api/stripe/payment-method` endpoint

## Files Modified

### Fixed in This Session:
1. ✅ `src/components/settings/PaymentInformation.tsx` - Added withdrawalAmount state

### Files You Need to Review:
1. ⚠️ `.env.local` - Verify all Stripe keys present
2. ⚠️ Database - Run MINIMAL_REVIEW_SYSTEM.sql

## Next Steps

1. **IMMEDIATE**: Run `MINIMAL_REVIEW_SYSTEM.sql` in Supabase
2. **VERIFY**: Check all Stripe keys in `.env.local`
3. **TEST**: Try rating system after SQL runs
4. **TEST**: Try Stripe connection as freelancer
5. **TEST**: Try payment methods as client

---

**Need Help?**
- Check browser console (F12) for errors
- Check server logs: `npm run dev` output
- Check Supabase logs in dashboard
- Look for error messages in red

**Status Summary**:
- ✅ Code fixes applied
- ⚠️ Database setup required (1 SQL file)
- ⚠️ Environment variables need verification
