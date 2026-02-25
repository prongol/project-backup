# 🚀 Complete Stripe Integration Setup Guide

## ✅ What's Been Implemented

Your platform now has a **REAL, production-ready Stripe integration** (not mock data):

### Features Working:
- ✅ **Stripe Connect** for freelancer bank accounts
- ✅ **Real payment processing** with 7% platform fee
- ✅ **Escrow system** with manual capture
- ✅ **Withdrawal/Payout system** to bank accounts
- ✅ **Transaction history** from Stripe API
- ✅ **Balance tracking** (available & pending)
- ✅ **Client payment intents**
- ✅ **Test mode ready** (works with Stripe test cards)
- ✅ **Easy switch to live mode** (just change API keys)

---

## 🔧 Setup Instructions

### Step 1: Get Your Stripe Keys

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Create a Stripe account (if you don't have one)
3. Get your **Test API keys**:
   - Dashboard → Developers → API keys
   - Copy the **Publishable key** (starts with `pk_test_`)
   - Copy the **Secret key** (starts with `sk_test_`)

4. Enable **Stripe Connect**:
   - Dashboard → Settings → Connect settings
   - Create a Connect platform
   - Copy your **Connect client ID** (starts with `ca_`)

### Step 2: Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Stripe API Keys (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

# Stripe Connect
NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID=ca_your_connect_client_id

# Webhook Secret (for production)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Platform Fee
STRIPE_PLATFORM_FEE_PERCENTAGE=7

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_RETURN_URL=http://localhost:3000/settings?tab=payment&setup=complete

# Your Supabase credentials (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_existing_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_existing_key
SUPABASE_SERVICE_ROLE_KEY=your_existing_service_key
```

### Step 3: Update Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Add Stripe Connect account ID to freelancers table
ALTER TABLE freelancers 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_freelancers_stripe_account 
ON freelancers(stripe_account_id);

-- Add Stripe customer ID to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer 
ON clients(stripe_customer_id);
```

### Step 4: Test With Stripe Test Cards

Use these test cards (they work in test mode):

#### Successful Payment:
- **Card**: `4242 4242 4242 4242`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits

#### Test 3D Secure:
- **Card**: `4000 0027 6000 3184`
- Requires authentication flow

#### Declined Card:
- **Card**: `4000 0000 0000 0002`
- Will be declined

Full list: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## 🧪 Testing the Integration

### Test as Freelancer:

1. **Register as freelancer**
2. **Connect Stripe account**:
   - Go to Settings → Payment Information
   - Click "Connect with Stripe"
   - Complete Stripe Connect onboarding (use test data)
3. **Get hired and paid** (client pays with test card)
4. **View balance** in Settings → Payment
5. **Withdraw funds**:
   - Enter amount (min $50)
   - Click "Withdraw to Bank"
   - Check transaction appears in history

### Test as Client:

1. **Register as client**
2. **Post a job**
3. **Hire freelancer**
4. **Make payment** with test card `4242 4242 4242 4242`
5. **Release payment** after work delivery

---

## 🚀 Going Live (Production)

When ready for real payments:

### Step 1: Activate Live Mode in Stripe

1. Go to Stripe Dashboard
2. Complete business verification
3. Add bank account for payouts
4. Get **Live API keys** (starts with `pk_live_` and `sk_live_`)

### Step 2: Update Environment Variables

Replace test keys with live keys in `.env.local`:

```bash
# Replace these with live keys:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# Update app URL to production domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_STRIPE_RETURN_URL=https://yourdomain.com/settings?tab=payment&setup=complete
```

### Step 3: Set Up Webhooks (Required for Production)

1. Go to: Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `payout.paid`
   - `payout.failed`
4. Copy the webhook secret
5. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Step 4: Deploy

```bash
npm run build
# Deploy to Vercel/your hosting
```

---

## 📋 API Endpoints Created

All these are real Stripe API calls (no mock data):

- **`POST /api/stripe/connect`** - Create/connect Stripe account
- **`GET /api/stripe/connect`** - Get account status & balance
- **`POST /api/stripe/payout`** - Withdraw funds to bank
- **`GET /api/stripe/transactions`** - Get transaction history
- **`POST /api/stripe/create-payment-intent`** - Create payment (existing)
- **`POST /api/stripe/webhook`** - Handle Stripe events (existing)

---

## 🔒 Security Features

✅ Server-side Stripe API calls only
✅ Webhook signature verification
✅ User authentication required for all endpoints
✅ Amount validation and limits
✅ Secure environment variable storage

---

## 💡 Key Features

### 7% Platform Fee
Automatically deducted from freelancer payments via Stripe Connect application fees.

### Escrow System
- Client pays → Funds held in escrow
- Freelancer delivers → Client approves
- Payment released → Funds transferred to freelancer

### Instant Withdrawals (for eligible accounts)
Freelancers can withdraw available balance anytime (min $50).

### Real-Time Balance
Shows available and pending balances from Stripe API.

### Transaction History
Real transactions from Stripe, including:
- Payments received
- Withdrawals/payouts
- Platform fees
- Transfer details

---

## 🆘 Troubleshooting

### "Stripe account not connected"
- Make sure freelancer completed Stripe Connect onboarding
- Check `stripe_account_id` is saved in database

### "Insufficient balance"
- Check available balance (not pending)
- Wait for pending funds to clear (usually 2-3 days)

### Webhook not working
- Verify webhook secret matches Stripe dashboard
- Check webhook endpoint is publicly accessible
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Payment failing
- Test with valid test card: `4242 4242 4242 4242`
- Check Stripe dashboard logs for error details
- Verify API keys are correct

---

## 📚 Documentation

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Payouts](https://stripe.com/docs/payouts)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

## ✨ What's Different from Mock

### Before (Mock):
- ❌ Hardcoded balances
- ❌ Fake transaction data
- ❌ No real money movement
- ❌ Can't test with real cards

### Now (Real Stripe):
- ✅ Real Stripe Connect accounts
- ✅ Actual transaction data from Stripe API
- ✅ Test with Stripe test cards
- ✅ Ready for production with real money
- ✅ Just swap API keys to go live

---

## 🎯 Next Steps

1. **Get Stripe API keys** (5 minutes)
2. **Add to `.env.local`** (2 minutes)
3. **Run database migration** (1 minute)
4. **Test with test cards** (10 minutes)
5. **Deploy & go live!** 🚀

You're now running a **real payment platform** powered by Stripe!