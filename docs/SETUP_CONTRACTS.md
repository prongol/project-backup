# Quick Setup Guide - Contract & Notification System

## 🚀 Step 1: Run Database Migration

Copy and run `DATABASE_CONTRACTS.sql` in your Supabase SQL Editor:

```bash
# File location: DATABASE_CONTRACTS.sql
```

This creates:
- ✅ `contracts` table
- ✅ `contract_milestones` table  
- ✅ RLS policies
- ✅ Indexes for performance
- ✅ Auto-update triggers

---

## 🎯 Step 2: Test the Flow

### Test Proposal Submission & Notification

1. **As Freelancer** - Submit a proposal:
   ```
   Navigate to: /freelancer/browse-jobs
   Find a job → Click "Apply"
   Fill proposal form → Submit
   ```

2. **As Client** - Check notification:
   ```
   Look at notification bell (top-right)
   Should show red badge with count
   Click bell → See "FreelancerName sent proposal"
   Click notification → Go to proposals page
   ```

### Test Proposal Acceptance

3. **As Client** - Accept proposal:
   ```
   Go to proposals page
   Click "Accept" on a proposal
   → Should redirect to: /client/contracts/create?proposal={id}
   ```

4. **As Freelancer** - Check notification:
   ```
   Notification bell updates
   See "Proposal Accepted! 🎉"
   ```

### Test Contract Creation

5. **As Client** - Create contract:
   ```javascript
   // Make API call:
   POST /api/contracts
   {
     "job_id": "xxx",
     "freelancer_id": "xxx",
     "title": "Website Development",
     "description": "Build a professional website",
     "contract_type": "fixed_price",
     "total_amount": 50000,
     "terms": "Payment upon completion",
     "deliverables": "Fully functional website",
     "payment_terms": "100% on completion"
   }
   ```

6. **As Freelancer** - Receive contract:
   ```
   ✅ Notification: "New Contract Received! 📝"
   ✅ Message in chat with contract details
   ✅ Link to view full contract
   ```

### Test Contract Signing

7. **As Freelancer** - Sign contract:
   ```javascript
   PATCH /api/contracts/{id}
   {
     "action": "sign",
     "signature": "I agree to the terms"
   }
   ```

8. **Both Parties** - Contract activated:
   ```
   ✅ Client notification: "Contract Activated! ✅"
   ✅ Freelancer notification: "Contract Activated! ✅"
   ✅ Contract status → "active"
   ✅ Work can begin!
   ```

---

## 📋 API Endpoints Summary

### Proposals
- `POST /api/proposals` - Submit proposal (sends notification to client)
- `GET /api/proposals?freelancerId={id}` - Get freelancer's proposals
- `GET /api/proposals?jobId={id}` - Get job's proposals
- `PATCH /api/proposals/{id}` - Accept/reject (sends notification to freelancer)

### Contracts
- `POST /api/contracts` - Create contract (sends message + notification)
- `GET /api/contracts` - Get user's contracts
- `GET /api/contracts/{id}` - Get single contract
- `PATCH /api/contracts/{id}` - Sign or update status

---

## 🔔 Notification Types

All these work with real-time updates:

| Type | Trigger | Recipient | Icon |
|------|---------|-----------|------|
| `new_proposal` | Proposal submitted | Client | 📬 |
| `proposal_accepted` | Proposal accepted | Freelancer | 🎉 |
| `proposal_rejected` | Proposal rejected | Freelancer | ℹ️ |
| `contract_received` | Contract created | Freelancer | 📝 |
| `contract_signed` | Contract signed | Other party | 📝 |
| `contract_active` | Both signed | Both parties | ✅ |
| `contract_completed` | Contract done | Other party | ✅ |
| `contract_cancelled` | Contract cancelled | Other party | ⚠️ |

---

## 💬 Message Integration

When a contract is created, this message is automatically sent:

```
📄 **Contract Received**

**Website Development**

Build a professional website with modern design

**Type:** FIXED PRICE
**Amount:** NPR 50,000

**Terms:** Payment upon completion

Please review and sign the contract to proceed.
View Contract: /contracts/abc-123
```

---

## 🎨 Frontend Pages to Create

### Priority 1 (Essential):
1. **`/client/contracts/create`** - Contract creation form
2. **`/contracts/{id}`** - View and sign contract
3. **`/contracts`** - List all contracts

### Priority 2 (Nice to have):
4. **`/client/proposals`** - View and manage proposals
5. **`/freelancer/my-proposals`** - View submitted proposals

---

## ✅ What's Already Working

- ✅ Notification bell with real-time updates
- ✅ Message system with real-time chat
- ✅ Online/offline status
- ✅ Unread counts
- ✅ Toast notifications
- ✅ Conversation creation
- ✅ All backend APIs ready

---

## 🔍 Verify Everything Works

Run these checks:

```bash
# 1. Check database tables exist
SELECT COUNT(*) FROM contracts;
SELECT COUNT(*) FROM contract_milestones;

# 2. Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'contracts';

# 3. Test proposal notification
# Submit a proposal and check client's notification bell

# 4. Test contract creation
# Create contract and check freelancer receives message + notification

# 5. Test contract signing
# Sign contract and verify both parties get notifications
```

---

## 🐛 Troubleshooting

**Notifications not appearing?**
- Check notification bell component is rendered
- Verify Supabase real-time is enabled
- Check browser console for errors

**Contract not creating?**
- Run DATABASE_CONTRACTS.sql
- Check all required fields provided
- Verify user authentication

**Message not sent?**
- Check conversation exists
- Verify participant IDs are correct
- Check messages table permissions

---

## 📞 Support

For issues:
1. Check `CONTRACT_NOTIFICATION_SYSTEM.md` for detailed documentation
2. Verify database schema is up to date
3. Check API responses in Network tab
4. Review server logs for errors

---

**System is ready! 🚀**
All backend APIs are implemented and tested. Just need to create the frontend UI pages.
