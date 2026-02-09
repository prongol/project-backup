# Notification System - Quick Reference Guide

## 🚀 Quick Start

### Adding a Notification in Your API Route

```typescript
// 1. Import the notification function
import { notifyWorkSubmitted } from '@/lib/notifications';

// 2. Call it when the event happens
await notifyWorkSubmitted({
  clientProfileId: clientProfile.id,
  contractTitle: 'Website Development',
  contractId: contractId,
  freelancerName: 'John Doe'
});
```

## 📚 Available Notification Functions

### Contract Notifications

```typescript
import { 
  notifyContractReceived,
  notifyContractSigned,
  notifyWorkSubmitted,
  notifyWorkApproved,
  notifyWorkRejected
} from '@/lib/notifications';

// New contract sent to freelancer
await notifyContractReceived({
  freelancerProfileId: string,
  contractTitle: string,
  contractId: string,
  clientName: string
});

// Contract signed by one party
await notifyContractSigned({
  recipientProfileId: string,
  contractTitle: string,
  contractId: string,
  signerRole: 'client' | 'freelancer',
  bothSigned: boolean
});

// Work submitted for review
await notifyWorkSubmitted({
  clientProfileId: string,
  contractTitle: string,
  contractId: string,
  freelancerName: string
});

// Work approved
await notifyWorkApproved({
  freelancerProfileId: string,
  contractTitle: string,
  contractId: string,
  autoReleaseMinutes: number
});

// Work rejected (revision requested)
await notifyWorkRejected({
  freelancerProfileId: string,
  contractTitle: string,
  contractId: string,
  rejectionReason: string
});
```

### Milestone Notifications

```typescript
import {
  notifyMilestoneSubmitted,
  notifyMilestoneApproved,
  notifyMilestoneRejected
} from '@/lib/notifications';

// Milestone submitted
await notifyMilestoneSubmitted({
  clientProfileId: string,
  milestoneTitle: string,
  contractTitle: string,
  contractId: string,
  freelancerName: string
});

// Milestone approved & paid
await notifyMilestoneApproved({
  freelancerProfileId: string,
  milestoneTitle: string,
  amount: number,
  contractId: string
});

// Milestone rejected
await notifyMilestoneRejected({
  freelancerProfileId: string,
  milestoneTitle: string,
  rejectionReason: string,
  contractId: string
});
```

### Payment Notifications

```typescript
import { notifyPaymentReleased } from '@/lib/notifications';

await notifyPaymentReleased({
  freelancerProfileId: string,
  contractTitle: string,
  amount: number,
  contractId: string
});
```

### Proposal Notifications

```typescript
import {
  notifyProposalReceived,
  notifyProposalAccepted,
  notifyProposalRejected
} from '@/lib/notifications';

// New proposal on job
await notifyProposalReceived({
  clientProfileId: string,
  freelancerName: string,
  jobTitle: string,
  proposalAmount: number,
  jobId: string
});

// Proposal accepted
await notifyProposalAccepted({
  freelancerProfileId: string,
  jobTitle: string,
  contractId: string
});

// Proposal rejected
await notifyProposalRejected({
  freelancerProfileId: string,
  jobTitle: string
});
```

### Message Notifications

```typescript
import { notifyNewMessage } from '@/lib/notifications';

await notifyNewMessage({
  recipientProfileId: string,
  senderName: string,
  preview: string,
  conversationId: string
});
```

## 🎨 Using Notifications in React Components

```typescript
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationsAsRead,
  useDeleteNotification,
  useRealtimeNotifications
} from '@/hooks/useNotifications';

function MyComponent() {
  const { user } = useAuth();
  
  // Get all notifications
  const { data: notifications = [], isLoading } = useNotifications(user?.id);
  
  // Get only unread notifications
  const { data: unreadNotifications } = useNotifications(user?.id, true);
  
  // Get unread count (for badge)
  const unreadCount = useUnreadNotificationsCount(user?.id);
  
  // Subscribe to real-time updates
  useRealtimeNotifications(user?.id);
  
  // Mark notifications as read
  const markAsRead = useMarkNotificationsAsRead();
  const handleMarkAsRead = async (notificationIds: string[]) => {
    await markAsRead.mutateAsync({ 
      userId: user!.id, 
      notificationIds 
    });
  };
  
  // Mark all as read
  const handleMarkAllAsRead = async () => {
    await markAsRead.mutateAsync({ 
      userId: user!.id, 
      markAllAsRead: true 
    });
  };
  
  // Delete notification
  const deleteNotification = useDeleteNotification();
  const handleDelete = async (notificationId: string) => {
    await deleteNotification.mutateAsync({ 
      userId: user!.id, 
      notificationId 
    });
  };
  
  return (
    <div>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={() => handleMarkAsRead([notification.id])}
          onDelete={() => handleDelete(notification.id)}
        />
      ))}
    </div>
  );
}
```

## 🔔 Notification Types Reference

| Type | User Receives | Trigger Action |
|------|--------------|----------------|
| `contract_received` | Freelancer | Client creates contract |
| `contract_signed` | Other party | One party signs |
| `contract_active` | Both parties | Both parties sign |
| `work_submitted` | Client | Freelancer submits deliverables |
| `work_approved` | Freelancer | Client approves work |
| `work_rejected` | Freelancer | Client requests revision |
| `milestone_submitted` | Client | Freelancer completes milestone |
| `milestone_approved` | Freelancer | Client approves + pays milestone |
| `milestone_rejected` | Freelancer | Client rejects milestone |
| `payment_released` | Freelancer | Payment transferred |
| `proposal_received` | Client | Freelancer submits proposal |
| `proposal_accepted` | Freelancer | Client accepts proposal |
| `proposal_rejected` | Freelancer | Client rejects proposal |
| `new_message` | Recipient | New message sent |
| `job_posted` | Client | Job successfully posted |
| `deadline_approaching` | Both | Deadline within 3 days |

## ⚡ Best Practices

### 1. Always Use Profile IDs
```typescript
// ✅ Correct - use profile_id from profiles table
user_id: freelancerProfile.id

// ❌ Wrong - don't use auth.uid() directly
user_id: authUser.id
```

### 2. Error Handling
```typescript
try {
  await notifyWorkSubmitted({
    clientProfileId,
    contractTitle,
    contractId,
    freelancerName
  });
} catch (error) {
  console.error('Failed to send notification:', error);
  // Don't fail the main operation if notification fails
}
```

### 3. Provide Meaningful Links
```typescript
// ✅ Good - direct link to relevant page
link: `/contracts/${contractId}`

// ❌ Bad - generic link
link: `/dashboard`
```

### 4. Keep Messages Concise
```typescript
// ✅ Good - clear and concise
message: `Your work on "${title}" has been approved!`

// ❌ Bad - too verbose
message: `We are pleased to inform you that your submitted work...`
```

### 5. Use Descriptive Titles with Emojis
```typescript
// ✅ Good - emoji + clear action
title: 'Work Approved! ✅'

// ❌ Bad - unclear
title: 'Update'
```

## 🔍 Debugging Notifications

### Check if notification was created
```sql
SELECT * FROM notifications 
WHERE user_id = 'profile-uuid-here' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check notification count
```sql
SELECT COUNT(*) FROM notifications 
WHERE user_id = 'profile-uuid-here' 
AND read = false;
```

### Check recent notifications
```typescript
// In React DevTools, inspect:
useNotifications(userId)
// Should show array of notification objects
```

### Check real-time subscription
```typescript
// Look for console logs from useRealtimeNotifications
// Should see: "New notification received" when one arrives
```

## 🎯 Common Use Cases

### After Creating a Contract
```typescript
const { data: contract } = await supabase
  .from('contracts')
  .insert({ ...contractData })
  .select()
  .single();

// Notify freelancer
await notifyContractReceived({
  freelancerProfileId: freelancer.profile_id,
  contractTitle: contract.title,
  contractId: contract.id,
  clientName: client.full_name
});
```

### After Payment Release
```typescript
// Update payment status
await supabase
  .from('contracts')
  .update({ payment_status: 'released' })
  .eq('id', contractId);

// Notify freelancer
await notifyPaymentReleased({
  freelancerProfileId: freelancer.profile_id,
  contractTitle: contract.title,
  amount: contract.total_amount,
  contractId: contract.id
});
```

### After Receiving Proposal
```typescript
// Create proposal
const { data: proposal } = await supabase
  .from('proposals')
  .insert({ ...proposalData })
  .select()
  .single();

// Notify client
await notifyProposalReceived({
  clientProfileId: job.client.profile_id,
  freelancerName: freelancer.full_name,
  jobTitle: job.title,
  proposalAmount: proposal.proposed_budget,
  jobId: job.id
});
```

## 📞 Support

For issues or questions about the notification system:
1. Check [NOTIFICATIONS_FIX_SUMMARY.md](./NOTIFICATIONS_FIX_SUMMARY.md) for detailed documentation
2. Review the notification library: `src/lib/notifications.ts`
3. Check the hooks: `src/hooks/useNotifications.ts`
4. Verify RLS policies in `DATABASE_NOTIFICATIONS.sql`
