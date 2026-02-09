import { createClient } from '@/lib/supabase/server';

// Notification types and their icons/colors
export const NOTIFICATION_TYPES = {
  // Contract related
  contract_received: { icon: '📄', color: 'blue' },
  contract_signed: { icon: '✍️', color: 'green' },
  contract_active: { icon: '🎉', color: 'green' },
  contract_edited: { icon: '📝', color: 'amber' },
  work_submitted: { icon: '📋', color: 'blue' },
  work_rejected: { icon: '🔄', color: 'yellow' },
  payment_released: { icon: '💰', color: 'green' },
  
  // Milestone related
  milestone_submitted: { icon: '📋', color: 'blue' },
  milestone_approved: { icon: '💰', color: 'green' },
  milestone_rejected: { icon: '🔄', color: 'yellow' },
  
  // Job related
  job_posted: { icon: '📢', color: 'blue' },
  job_application: { icon: '👤', color: 'green' },
  application_accepted: { icon: '✅', color: 'green' },
  application_rejected: { icon: '❌', color: 'red' },
  deadline_approaching: { icon: '⏰', color: 'yellow' },
  
  // Proposal related
  proposal_received: { icon: '📝', color: 'blue' },
  proposal_accepted: { icon: '🎉', color: 'green' },
  proposal_rejected: { icon: '❌', color: 'red' },
  
  // Profile & Settings
  bank_details_updated: { icon: '✅', color: 'green' },
  profile_updated: { icon: '✅', color: 'green' },
  
  // Communication
  new_message: { icon: '💬', color: 'blue' },
  
  // System
  system_alert: { icon: '⚠️', color: 'red' },
};

/**
 * Send a notification to a user
 */
export async function sendNotification(params: {
  user_id: string;
  type: keyof typeof NOTIFICATION_TYPES;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: params.user_id,
      p_type: params.type,
      p_title: params.title,
      p_message: params.message,
      p_link: params.link || null
    });

    if (error) {
      console.error('Error sending notification via RPC:', error);
      
      // Fallback to direct insert if RPC fails (though RPC is preferred for RLS)
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: params.user_id,
          type: params.type,
          title: params.title,
          message: params.message,
          link: params.link || null,
          read: false,
          created_at: new Date().toISOString(),
        });
      
      if (insertError) {
        console.error('Error sending notification via direct insert:', insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Send notification when a job is posted
 */
export async function notifyJobPosted(jobId: string, jobTitle: string, clientId: string, clientProfileId: string) {
  // This could be sent to all freelancers in the future
  // For now, just notify the client
  return sendNotification({
    user_id: clientProfileId,
    type: 'job_posted',
    title: 'Job Posted Successfully! 📢',
    message: `Your job "${jobTitle}" has been posted and is now visible to freelancers.`,
    link: `/client/jobs/${jobId}`
  });
}

/**
 * Send notification when someone applies to a job
 */
export async function notifyJobApplication(params: {
  clientProfileId: string;
  freelancerName: string;
  jobTitle: string;
  jobId: string;
  proposalId: string;
}) {
  return sendNotification({
    user_id: params.clientProfileId,
    type: 'job_application',
    title: 'New Application Received! 👤',
    message: `${params.freelancerName} has applied to your job "${params.jobTitle}".`,
    link: `/client/jobs/${params.jobId}/proposals`
  });
}

/**
 * Send notification when application is accepted
 */
export async function notifyApplicationAccepted(params: {
  freelancerProfileId: string;
  jobTitle: string;
  jobId: string;
}) {
  return sendNotification({
    user_id: params.freelancerProfileId,
    type: 'application_accepted',
    title: 'Application Accepted! 🎉',
    message: `Congratulations! Your application for "${params.jobTitle}" has been accepted.`,
    link: `/freelancer/proposals`
  });
}

/**
 * Send notification when application is rejected
 */
export async function notifyApplicationRejected(params: {
  freelancerProfileId: string;
  jobTitle: string;
}) {
  return sendNotification({
    user_id: params.freelancerProfileId,
    type: 'application_rejected',
    title: 'Application Update',
    message: `Your application for "${params.jobTitle}" was not selected this time.`,
  });
}

/**
 * Send notification for approaching deadline
 */
export async function notifyDeadlineApproaching(params: {
  userProfileId: string;
  contractTitle: string;
  contractId: string;
  daysLeft: number;
}) {
  return sendNotification({
    user_id: params.userProfileId,
    type: 'deadline_approaching',
    title: `Deadline Approaching! ⏰`,
    message: `Contract "${params.contractTitle}" is due in ${params.daysLeft} day${params.daysLeft > 1 ? 's' : ''}.`,
    link: `/contracts/${params.contractId}`
  });
}

/**
 * Send notification when proposal is received
 */
export async function notifyProposalReceived(params: {
  clientProfileId: string;
  freelancerName: string;
  jobTitle: string;
  proposalAmount: number;
  jobId: string;
}) {
  return sendNotification({
    user_id: params.clientProfileId,
    type: 'proposal_received',
    title: 'New Proposal Received! 📝',
    message: `${params.freelancerName} sent a proposal for "${params.jobTitle}" ($${params.proposalAmount}).`,
    link: `/client/jobs/${params.jobId}/proposals`
  });
}

/**
 * Send notification when proposal is accepted
 */
export async function notifyProposalAccepted(params: {
  freelancerProfileId: string;
  jobTitle: string;
  contractId: string;
}) {
  return sendNotification({
    user_id: params.freelancerProfileId,
    type: 'proposal_accepted',
    title: 'Proposal Accepted! 🎉',
    message: `Your proposal for "${params.jobTitle}" has been accepted! A contract has been created.`,
    link: `/contracts/${params.contractId}`
  });
}

/**
 * Send notification when proposal is rejected
 */
export async function notifyProposalRejected(params: {
  freelancerProfileId: string;
  jobTitle: string;
}) {
  return sendNotification({
    user_id: params.freelancerProfileId,
    type: 'proposal_rejected',
    title: 'Proposal Update',
    message: `Your proposal for "${params.jobTitle}" was not selected.`,
  });
}

/**
 * Send notification when contract is received/created
 */
export async function notifyContractReceived(params: {
  freelancerProfileId: string;
  contractTitle: string;
  contractId: string;
  clientName: string;
}) {
  return sendNotification({
    user_id: params.freelancerProfileId,
    type: 'contract_received',
    title: 'New Contract Received! 📄',
    message: `${params.clientName} sent you a contract for "${params.contractTitle}". Please review and sign.`,
    link: `/contracts/${params.contractId}`
  });
}

/**
 * Send notification when contract is signed
 */
export async function notifyContractSigned(params: {
  recipientProfileId: string;
  contractTitle: string;
  contractId: string;
  signerRole: 'client' | 'freelancer';
  bothSigned: boolean;
}) {
  const title = params.bothSigned ? 'Contract Active! 🎉' : 'Contract Signed ✍️';
  const message = params.bothSigned
    ? `The contract "${params.contractTitle}" has been signed by both parties and is now active!`
    : `${params.signerRole === 'client' ? 'Client' : 'Freelancer'} has signed the contract "${params.contractTitle}". Waiting for your signature.`;
  
  return sendNotification({
    user_id: params.recipientProfileId,
    type: params.bothSigned ? 'contract_active' : 'contract_signed',
    title,
    message,
    link: `/contracts/${params.contractId}`
  });
}

/**
 * Send notification when work is submitted
 */
export async function notifyWorkSubmitted(params: {
  clientProfileId: string;
  contractTitle: string;
  contractId: string;
  freelancerName: string;
}) {
  return sendNotification({
    user_id: params.clientProfileId,
    type: 'work_submitted',
    title: 'Work Submitted for Review! 📋',
    message: `${params.freelancerName} has submitted work for "${params.contractTitle}". Please review.`,
    link: `/contracts/${params.contractId}`
  });
}

/**
 * Send notification when work is approved
 */
export async function notifyWorkApproved(params: {
  freelancerProfileId: string;
  contractTitle: string;
  contractId: string;
  autoReleaseMinutes: number;
}) {
  return sendNotification({
    user_id: params.freelancerProfileId,
    type: 'work_approved',
    title: 'Work Approved! ✅',
    message: `Your work on "${params.contractTitle}" has been approved! Payment will auto-release in ${params.autoReleaseMinutes} ${params.autoReleaseMinutes === 1 ? 'minute' : 'minutes'}.`,
    link: `/contracts/${params.contractId}`
  });
}

/**
 * Send notification when work is rejected
 */
export async function notifyWorkRejected(params: {
  freelancerProfileId: string;
  contractTitle: string;
  contractId: string;
  rejectionReason: string;
}) {
  return sendNotification({
    user_id: params.freelancerProfileId,
    type: 'work_rejected',
    title: 'Work Revision Requested 🔄',
    message: `Client requested changes to "${params.contractTitle}": ${params.rejectionReason}`,
    link: `/contracts/${params.contractId}`
  });
}

/**
 * Send notification when payment is released
 */
export async function notifyPaymentReleased(params: {
  freelancerProfileId: string;
  contractTitle: string;
  amount: number;
  contractId: string;
}) {
  return sendNotification({
    user_id: params.freelancerProfileId,
    type: 'payment_released',
    title: 'Payment Released! 💰',
    message: `You received $${params.amount.toLocaleString()} for "${params.contractTitle}".`,
    link: `/contracts/${params.contractId}`
  });
}

/**
 * Send notification for new message
 */
export async function notifyNewMessage(params: {
  recipientProfileId: string;
  senderName: string;
  preview: string;
  conversationId: string;
}) {
  return sendNotification({
    user_id: params.recipientProfileId,
    type: 'new_message',
    title: `New message from ${params.senderName} 💬`,
    message: params.preview.substring(0, 100),
    link: `/communication?conversationId=${params.conversationId}`
  });
}

/**
 * Send notification when milestone is submitted
 */
export async function notifyMilestoneSubmitted(params: {
  clientProfileId: string;
  milestoneTitle: string;
  contractTitle: string;
  contractId: string;
  freelancerName: string;
}) {
  return sendNotification({
    user_id: params.clientProfileId,
    type: 'milestone_submitted',
    title: 'Milestone Submitted! 📋',
    message: `${params.freelancerName} submitted milestone "${params.milestoneTitle}" for "${params.contractTitle}".`,
    link: `/contracts/${params.contractId}`
  });
}

/**
 * Send notification when milestone is approved
 */
export async function notifyMilestoneApproved(params: {
  freelancerProfileId: string;
  milestoneTitle: string;
  amount: number;
  contractId: string;
}) {
  return sendNotification({
    user_id: params.freelancerProfileId,
    type: 'milestone_approved',
    title: 'Milestone Approved! 💰',
    message: `Milestone "${params.milestoneTitle}" approved. $${params.amount.toLocaleString()} payment released.`,
    link: `/contracts/${params.contractId}`
  });
}

/**
 * Send notification when milestone is rejected
 */
export async function notifyMilestoneRejected(params: {
  freelancerProfileId: string;
  milestoneTitle: string;
  rejectionReason: string;
  contractId: string;
}) {
  return sendNotification({
    user_id: params.freelancerProfileId,
    type: 'milestone_rejected',
    title: 'Milestone Revision Requested 🔄',
    message: `Milestone "${params.milestoneTitle}" needs revision: ${params.rejectionReason}`,
    link: `/contracts/${params.contractId}`
  });
}

/**
 * Send notification when a dispute is filed
 */
export async function notifyDisputeFiled(params: {
  recipientProfileId: string;
  contractTitle: string;
  contractId: string;
  disputeId: string;
  filerRole: 'client' | 'freelancer';
}) {
  return sendNotification({
    user_id: params.recipientProfileId,
    type: 'system_alert',
    title: '⚠️ Dispute Filed',
    message: `The ${params.filerRole} has filed a dispute on "${params.contractTitle}". An admin will review this case.`,
    link: `/contracts/${params.contractId}/dispute/${params.disputeId}`
  });
}
