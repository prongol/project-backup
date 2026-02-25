# Payment System & Platform Commission Guide

## Overview
The Neplancer platform now includes a comprehensive payment management system with platform commission tracking, bank details management, and real-time notifications.

---

## 1. Platform Commission (7% Fee)

### How It Works
- **Platform charges 7% fee** on all payments to freelancers
- **Client pays the full amount** as agreed in the contract
- **Freelancer receives 93%** of the payment (net amount after platform fee)
- **Platform keeps 7%** as commission for providing the service

### Example
```
Contract Amount: $1,000
Platform Fee (7%): $70
Freelancer Receives: $930
```

### Fee Calculation
- Automatically calculated when payment is released
- Tracked in `platform_transactions` table
- Shown in contract details after completion
- Included in payment notifications

---

## 2. Bank Details Management

### Setup Process
1. **One-Time Setup**: User adds bank details in profile settings
2. **Saved Securely**: Bank information stored in `profiles.bank_details` (JSONB)
3. **Reusable**: No need to enter bank details for every job/contract
4. **Easy Updates**: Can change bank details anytime from settings

### Required Information
- Account Holder Name
- Bank Name
- Account Number
- Routing Number
- SWIFT/BIC Code (optional for international transfers)
- Country

### Where to Add/Update
**Path**: Settings → Bank Details
**Component**: `BankDetailsSettings.tsx`
**API**: `/api/profile/bank-details`

### Benefits
✅ Add bank details once, use for all payments
✅ No repetitive data entry
✅ Secure encrypted storage
✅ Easy to update anytime
✅ Required only when receiving payments

---

## 3. Payment Flow

### For Regular Contracts (Fixed Price/Hourly)

**Step 1: Work Completion**
- Freelancer completes work
- Clicks "Submit Work for Approval"
- Contract status → `pending_completion`

**Step 2: Client Review**
- Client receives notification
- Reviews the work
- Two options:
  - **Approve**: Releases payment
  - **Request Revision**: Sends back with feedback

**Step 3: Payment Release**
- Platform calculates:
  - Gross Amount: $1,000
  - Platform Fee (7%): $70
  - Net to Freelancer: $930
- Updates freelancer's `total_earned`
- Updates client's `total_spent`
- Records transaction in `platform_transactions`
- Sends bank transfer notification

### For Milestone-Based Contracts

**Each Milestone**:
1. Freelancer submits milestone
2. Client reviews
3. Upon approval:
   - Platform fee calculated
   - Payment released for that milestone
   - Freelancer earns net amount
4. When all milestones paid → Contract complete

---

## 4. Notification System

### Notification Types

#### Contract Related
- `contract_received` - New contract received
- `contract_signed` - Contract signed by one party
- `contract_active` - Both parties signed, contract active
- `work_submitted` - Work submitted for review
- `work_rejected` - Revision requested
- `payment_released` - Payment released to bank

#### Milestone Related
- `milestone_submitted` - Milestone submitted
- `milestone_approved` - Milestone approved & paid
- `milestone_rejected` - Milestone needs revision

#### Job & Proposal Related
- `job_posted` - Job successfully posted
- `job_application` - Someone applied to your job
- `proposal_received` - New proposal received
- `proposal_accepted` - Proposal accepted
- `application_accepted` - Your application accepted
- `deadline_approaching` - Contract deadline soon

#### Profile & System
- `bank_details_updated` - Bank info updated
- `profile_updated` - Profile updated
- `new_message` - New message received

### Notification Features
✅ Real-time updates
✅ Unread count badge
✅ Click to navigate to relevant page
✅ Mark as read/unread
✅ Delete notifications
✅ "Mark all as read" button
✅ Shows time ago (e.g., "2 hours ago")

### Where Notifications Appear
1. **Bell Icon** in navbar (top right)
2. **Badge** showing unread count
3. **Dropdown** with latest notifications
4. **Full Page** at `/notifications`

---

## 5. Database Schema

### New Tables & Columns

#### `platform_transactions`
Tracks all payments and platform fees:
```sql
- id (UUID)
- contract_id (UUID)
- milestone_id (UUID, optional)
- transaction_type (contract_payment | milestone_payment | refund)
- client_id (UUID)
- freelancer_id (UUID)
- gross_amount (DECIMAL)
- platform_fee_amount (DECIMAL)
- freelancer_net_amount (DECIMAL)
- platform_fee_percentage (DECIMAL, default 7.00)
- payment_status (pending | processing | completed | failed)
- payment_method (bank_transfer)
- transaction_date (TIMESTAMP)
```

#### `profiles.bank_details`
Stores bank information:
```json
{
  "account_holder_name": "John Doe",
  "bank_name": "Example Bank",
  "account_number": "1234567890",
  "routing_number": "123456789",
  "swift_code": "EXAMPXXX",
  "country": "US"
}
```

#### Contract Updates
```sql
- platform_fee_percentage (DECIMAL)
- platform_fee_amount (DECIMAL)
- freelancer_net_amount (DECIMAL)
```

#### Milestone Updates
```sql
- platform_fee_percentage (DECIMAL)
- platform_fee_amount (DECIMAL)
- freelancer_net_amount (DECIMAL)
```

---

## 6. API Endpoints

### Bank Details
- `GET /api/profile/bank-details` - Get user's bank details
- `POST /api/profile/bank-details` - Update bank details

### Payment Management
- `POST /api/contracts/[id]/complete` - Submit work (freelancer)
- `POST /api/contracts/[id]/approve` - Approve & pay (client)
- `PUT /api/contracts/[id]/approve` - Request revision (client)

### Milestone Management
- `POST /api/contracts/[id]/milestones/[milestoneId]/submit` - Submit milestone
- `POST /api/contracts/[id]/milestones/[milestoneId]/approve` - Approve milestone
- `PUT /api/contracts/[id]/milestones/[milestoneId]/approve` - Reject milestone

---

## 7. User Interface

### Contract Details Page
Shows:
- Contract information
- Payment breakdown (when completed)
  - Gross amount
  - Platform fee (7%)
  - Net amount to freelancer
- Milestones with individual payments
- Action buttons:
  - Submit Work (freelancer)
  - Approve Payment (client)
  - Request Revision (client)

### Bank Details Settings
Shows:
- Current bank information (if exists)
- Form to add/update details
- Important info about 7% fee
- Payment processing timeline
- Security notice

### Notification Bell
Shows:
- Unread count badge
- Latest notifications
- Quick actions (mark read, delete)
- Link to full notifications page

---

## 8. Security Features

### Bank Details
- Stored as JSONB (can be encrypted in production)
- Only accessible by account owner
- Row-Level Security (RLS) enabled
- Transmitted over HTTPS only

### Platform Transactions
- Immutable records
- RLS policies prevent unauthorized access
- Complete audit trail
- Timestamps for all operations

---

## 9. Future Enhancements

### Planned Features
- [ ] Escrow system for holding client payments
- [ ] Multiple payment methods (card, PayPal, crypto)
- [ ] Automated bank transfers
- [ ] Payment receipts/invoices PDF generation
- [ ] Tax forms (1099, etc.)
- [ ] Multi-currency support
- [ ] Subscription plans with different fee tiers
- [ ] Bulk payout processing

---

## 10. Setup Instructions

### Run SQL Migration
```sql
-- Run this in Supabase SQL Editor
-- Path: ADD_PAYMENT_AND_FEES_SYSTEM.sql
```

### Test the System
1. **Add Bank Details**:
   - Go to Settings → Bank Details
   - Fill in your bank information
   - Save

2. **Create a Contract**:
   - Post a job or accept a proposal
   - Sign the contract
   - Start working

3. **Complete Work**:
   - Freelancer: Submit work
   - Client: Review and approve
   - Check payment breakdown

4. **View Notifications**:
   - Click bell icon
   - See all activity notifications
   - Navigate to relevant pages

---

## Support

For issues or questions:
- Check contract details for payment status
- Verify bank details in settings
- Review notifications for updates
- Contact platform support for payment issues

---

**Last Updated**: January 2026
**Version**: 1.0.0
