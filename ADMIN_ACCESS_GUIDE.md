# Admin Dashboard Access Guide

## Overview
Your Neplancer platform has a fully functional admin dashboard at `/admin/dashboard` with comprehensive monitoring and management capabilities.

## 🔐 How to Access Admin Dashboard

### Step 1: Register/Login as a Regular User
1. Go to `/register` and create an account (or login if you already have one)
2. Complete the registration process
3. Verify your email (check Supabase Auth dashboard if needed)

### Step 2: Make Yourself Admin

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Click on "Table Editor" in the left sidebar
3. Select the `profiles` table
4. Find your profile row by email
5. Edit the row and set:
   - `is_admin` = `true`
   - `admin_level` = `super_admin`
6. Save the changes

**Option B: Using SQL Editor**

1. Go to Supabase → SQL Editor
2. Run this query (replace with your email):

```sql
UPDATE profiles
SET is_admin = TRUE, 
    admin_level = 'super_admin'
WHERE email = 'your-email@example.com';
```

### Step 3: Logout and Login Again
1. Logout from your account
2. Login again with the same credentials
3. Your admin status will now be loaded

### Step 4: Access Admin Dashboard
1. Click on your avatar in the top-right navbar
2. You'll see a purple **"Admin Dashboard"** link at the top (with shield icon)
3. Click it to access the admin dashboard at `/admin/dashboard`

---

## 🎯 Admin Dashboard Features

### Overview Tab
- **User Statistics**: Total users, active users, new signups
- **Contract Statistics**: Active, completed, at-risk contracts
- **Payment Statistics**: Total volume, pending payments, escrow balance
- **Dispute Management**: Open, pending, resolved disputes
- **Real-time Activity**: Today's active users, contracts created, payments processed

### Users Management
- View all users (clients and freelancers)
- User details: email, role, join date, status, trust score
- **Actions**:
  - View user profile
  - Suspend user account
  - Activate suspended account
  - Search and filter users

### Contracts Management
- View all contracts across the platform
- Contract details: title, status, amount, parties, health status
- **Actions**:
  - View contract details
  - Cancel problematic contracts
  - Monitor at-risk contracts
  - Search and filter contracts

### Payments Management
- View all payment transactions
- Payment details: amount, status, contract, parties
- **Actions**:
  - Approve pending payments
  - Issue refunds
  - Monitor escrow balance
  - Search and filter payments

### Activity Monitoring
- Real-time platform activity logs
- User actions, system events, timestamps
- Filter by type and time period

---

## 🔒 Security Features

### Access Control
```typescript
// Automatically enforced in the admin dashboard component
useEffect(() => {
  if (!user) {
    router.push('/login');
    return;
  }

  if (!user.is_admin) {
    toast.error('Admin access required');
    router.push('/dashboard');
    return;
  }
}, [user]);
```

### Database-Level Security
All admin API endpoints check for admin status:

```typescript
// Example from /api/admin/users/route.ts
const { data: adminProfile } = await supabase
  .from('profiles')
  .select('is_admin')
  .eq('id', user.id)
  .single();

if (!adminProfile?.is_admin) {
  return NextResponse.json(
    { error: 'Unauthorized - Admin access required' },
    { status: 403 }
  );
}
```

---

## 📊 Admin API Endpoints

All admin endpoints are at `/api/admin/*`:

### Dashboard Stats
- `GET /api/admin/dashboard` - Get overview statistics

### User Management
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/[id]` - Get user details
- `POST /api/admin/users/[id]/suspend` - Suspend user
- `POST /api/admin/users/[id]/activate` - Activate user

### Contract Management
- `GET /api/admin/contracts` - List all contracts
- `POST /api/admin/contracts/[id]/cancel` - Cancel contract

### Payment Management
- `GET /api/admin/payments` - List all payments
- `POST /api/admin/payments/[id]/approve` - Approve payment
- `POST /api/admin/payments/[id]/refund` - Refund payment

### Activity Monitoring
- `GET /api/admin/activities` - Get activity logs
- `GET /api/admin/monitoring` - Get system monitoring data
- `GET /api/admin/monitoring/[id]` - Get specific monitor details

---

## 🎨 UI Components in Admin Dashboard

### Navigation Sections
```tsx
const sections = [
  'overview',    // Default view with all stats
  'users',       // User management
  'contracts',   // Contract management
  'payments',    // Payment management
  'activity'     // Activity logs
];
```

### Stats Cards
- Total Users (with breakdown: clients/freelancers)
- Active Contracts
- Total Payment Volume
- Open Disputes
- Daily Active Users

### Data Tables
- Search and filter functionality
- Sortable columns
- Action buttons per row
- Pagination support

### Real-time Updates
- Stats refresh every 30 seconds
- Activity logs update in real-time
- Toast notifications for actions

---

## 🚀 Quick Start Checklist

- [ ] Register an account on the platform
- [ ] Verify email
- [ ] Make yourself admin using Supabase dashboard or SQL
- [ ] Logout and login again
- [ ] Click avatar → Look for purple "Admin Dashboard" link
- [ ] Access admin dashboard
- [ ] Explore Overview tab
- [ ] Try user management features
- [ ] Check contracts and payments
- [ ] Review activity logs

---

## 🐛 Troubleshooting

### "Admin access required" Error
- **Cause**: `is_admin` is not set to `true` in your profile
- **Solution**: Run the UPDATE query in Supabase SQL Editor

### Admin Dashboard Link Not Showing
- **Cause**: Need to logout and login after setting admin status
- **Solution**: Logout, login again to refresh user data

### "Unauthorized" on API Calls
- **Cause**: Session doesn't have admin flag
- **Solution**: Clear browser cache, logout, login again

### Database Connection Issues
- **Cause**: Missing environment variables
- **Solution**: Check `.env.local` has correct Supabase credentials

---

## 📝 Admin User Schema

```typescript
interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'client' | 'freelancer';
  is_admin: boolean;           // Must be true
  admin_level: string;          // 'super_admin' or 'admin'
  created_at: string;
  account_status: string;
  trust_score: number;
}
```

---

## 🎯 Admin Capabilities

### User Management
- ✅ View all user profiles
- ✅ Suspend suspicious accounts
- ✅ Activate suspended accounts
- ✅ Monitor user trust scores
- ✅ Track user activity

### Contract Management
- ✅ View all platform contracts
- ✅ Monitor contract health
- ✅ Cancel problematic contracts
- ✅ Track contract completion rates
- ✅ Identify at-risk contracts

### Payment Management
- ✅ Monitor all transactions
- ✅ Approve pending payments
- ✅ Issue refunds
- ✅ Track escrow balances
- ✅ Manage platform fees

### Platform Monitoring
- ✅ Real-time activity tracking
- ✅ User engagement metrics
- ✅ System health monitoring
- ✅ Performance analytics
- ✅ Dispute resolution

---

## 📚 Related Documentation

- [ADMIN_DASHBOARD_GUIDE.md](./ADMIN_DASHBOARD_GUIDE.md) - Detailed feature guide
- [ENHANCED_ADMIN_DASHBOARD.md](./ENHANCED_ADMIN_DASHBOARD.md) - Technical implementation
- [DATABASE_ADMIN_MONITORING.sql](./DATABASE_ADMIN_MONITORING.sql) - Database schema
- [QUICK_LOGIN_FIX.md](./QUICK_LOGIN_FIX.md) - Login troubleshooting

---

## 🔥 Pro Tips

1. **Bookmark the Admin Dashboard**: `/admin/dashboard` for quick access
2. **Use Search**: All data tables have built-in search functionality
3. **Monitor Activity**: Check activity logs regularly for suspicious behavior
4. **Trust Scores**: Pay attention to users with low trust scores
5. **At-Risk Contracts**: Proactively manage contracts flagged as "at risk"
6. **Escrow Balance**: Monitor escrow to ensure platform liquidity

---

## 🎨 Admin Dashboard Visual Indicators

### Status Colors
- 🟢 **Green**: Active, Completed, Approved
- 🟡 **Yellow**: Pending, In Review
- 🔴 **Red**: Suspended, Cancelled, Failed
- 🟠 **Orange**: At Risk, Warning

### Badge Indicators
- **Purple Badge**: Admin status (in navbar)
- **Shield Icon**: Admin-only features
- **Trust Score**: Color-coded by value (0-100)

---

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Verify your `is_admin` status in Supabase
3. Review browser console for errors
4. Check Supabase logs for API errors
5. Ensure all environment variables are set

**Admin Dashboard Path**: `/admin/dashboard`
**Admin Status Check**: Click your avatar → Look for purple "Admin Dashboard" link

Your admin dashboard is fully functional and ready to use! 🎉
