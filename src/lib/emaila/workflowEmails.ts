import {
  WelcomeEmail,
  applicationAcceptedEmail,
  newApplicationEmail,
  milestoneCompletedEmail,
  paymentReceivedEmail,
  reviewRequestEmail,
  newMessageEmail,
} from './templates';
import { queueEmail } from './emailQueue';

/**
 * Workflow Email Notifications
 * 
 * These functions are called at specific points in the user journey
 * to send contextual emails based on workflow events.
 */

// ==================== FREELANCER JOURNEY EMAILS ====================

/**
 * Stage 1: Registration & Setup
 * Sent when freelancer completes registration
 */
export async function sendFreelancerWelcomeEmail(
  userEmail: string,
  userName: string,
  userId: string
) {
  const emailHtml = welcomeEmail(
    userName,
    `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${userId}`
  );
  
  await queueEmail(
    {
      to: userEmail,
      subject: 'Welcome to Neplancer - Start Your Freelance Journey! 🚀',
      html: emailHtml,
    },
    'high'
  );
}

/**
 * Stage 2: Profile Setup Reminder
 * Sent when freelancer hasn't completed profile after 24 hours
 */
export async function sendProfileSetupReminder(
  userEmail: string,
  userName: string,
  _userId: string
) {
  const emailHtml = `
    <h2>Complete Your Profile to Start Applying 📝</h2>
    <p>Hi ${userName},</p>
    <p>We noticed you haven't completed your profile yet. A complete profile helps you stand out and increases your chances of getting hired!</p>
    <p><strong>What to add:</strong></p>
    <ul>
      <li>Professional title and bio</li>
      <li>Skills and expertise</li>
      <li>Work experience</li>
      <li>Portfolio items</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/create" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Complete Your Profile</a>
    <p>Need help? Check out our <a href="${process.env.NEXT_PUBLIC_APP_URL}/help/profile-tips">profile tips guide</a>.</p>
  `;
  
  await queueEmail(
    {
      to: userEmail,
      subject: 'Complete Your Profile to Unlock Job Applications',
      html: emailHtml,
    },
    'medium'
  );
}

/**
 * Stage 3: Job Match Notification
 * Sent when new jobs match freelancer's skills
 */
export async function sendJobMatchNotification(
  userEmail: string,
  userName: string,
  jobs: Array<{
    id: string;
    title: string;
    budget: string;
    category: string;
    skills: string[];
  }>
) {
  // For multiple jobs, create custom HTML
  const jobsList = jobs.map(j => `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 12px 0;">
      <h3 style="margin: 0 0 8px 0;">${j.title}</h3>
      <p style="margin: 4px 0;"><strong>Budget:</strong> ${j.budget}</p>
      <p style="margin: 4px 0;"><strong>Category:</strong> ${j.category}</p>
      <p style="margin: 4px 0;"><strong>Skills:</strong> ${j.skills.join(', ')}</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${j.id}" style="display: inline-block; padding: 8px 16px; background: #3B82F6; color: white; text-decoration: none; border-radius: 4px; margin-top: 8px;">View Job</a>
    </div>
  `).join('');

  const emailHtml = `
    <h2>New Job Matches for You! 🎯</h2>
    <p>Hi ${userName},</p>
    <p>We found ${jobs.length} new job${jobs.length > 1 ? 's' : ''} that match your skills and interests!</p>
    ${jobsList}
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/browse" style="display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Browse More Jobs</a>
  `;
  
  await queueEmail(
    {
      to: userEmail,
      subject: `${jobs.length} New Job${jobs.length > 1 ? 's' : ''} Match Your Skills! 💼`,
      html: emailHtml,
    },
    'medium'
  );
}

/**
 * Stage 4: Application Confirmation
 * Sent when freelancer submits a proposal
 */
export async function sendApplicationConfirmation(
  userEmail: string,
  userName: string,
  jobTitle: string,
  jobId: string,
  clientName: string
) {
  const emailHtml = `
    <h2>Application Submitted Successfully! ✓</h2>
    <p>Hi ${userName},</p>
    <p>Your proposal for "<strong>${jobTitle}</strong>" has been submitted to ${clientName}.</p>
    <p><strong>What happens next?</strong></p>
    <ul>
      <li>The client will review your proposal</li>
      <li>You'll be notified if they're interested</li>
      <li>Keep your messages open for questions</li>
    </ul>
    <p><strong>Pro Tips:</strong></p>
    <ul>
      <li>Respond quickly if the client messages you</li>
      <li>Be ready to clarify your proposal</li>
      <li>Stay professional and courteous</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Application</a>
  `;
  
  await queueEmail(
    {
      to: userEmail,
      subject: `Your Proposal for "${jobTitle}" Has Been Submitted`,
      html: emailHtml,
    },
    'high'
  );
}

/**
 * Stage 5: Acceptance Notification
 * Sent when client accepts freelancer's proposal
 */
export async function sendProposalAcceptedEmail(
  userEmail: string,
  userName: string,
  jobTitle: string,
  jobId: string,
  clientName: string,
  _projectBudget: string,
  _startDate: string
) {
  const emailHtml = applicationAcceptedEmail(
    userName,
    jobTitle,
    `${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}`,
    `Congratulations! Your proposal has been accepted by ${clientName}.`
  );
  
  await queueEmail(
    {
      to: userEmail,
      subject: `🎉 Congratulations! Your Proposal Was Accepted`,
      html: emailHtml,
    },
    'high'
  );
}

/**
 * Stage 6: Milestone & Payment Notifications
 */
export async function sendMilestoneApprovedEmail(
  userEmail: string,
  userName: string,
  jobTitle: string,
  milestoneName: string,
  amount: string
) {
  const emailHtml = milestoneCompletedEmail(
    userName,
    'freelancer',
    jobTitle,
    milestoneName,
    amount,
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  );
  
  await queueEmail(
    {
      to: userEmail,
      subject: `Milestone Approved: ${milestoneName} ✓`,
      html: emailHtml,
    },
    'high'
  );
}

export async function sendPaymentReceivedNotification(
  userEmail: string,
  userName: string,
  amount: string,
  _jobTitle: string,
  transactionId: string,
  _availableBalance: string
) {
  const emailHtml = paymentReceivedEmail(
    userName,
    amount,
    transactionId,
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments`
  );
  
  await queueEmail(
    {
      to: userEmail,
      subject: `Payment Received: ${amount} 💰`,
      html: emailHtml,
    },
    'high'
  );
}

// ==================== CLIENT JOURNEY EMAILS ====================

/**
 * Stage 1: Client Welcome
 * Sent when client completes registration
 */
export async function sendClientWelcomeEmail(
  userEmail: string,
  userName: string,
  _userId: string
) {
  const emailHtml = `
    <h2>Welcome to Neplancer! 🎉</h2>
    <p>Hi ${userName},</p>
    <p>Thanks for joining Neplancer! You're now ready to connect with talented freelancers for your projects.</p>
    <p><strong>Getting Started:</strong></p>
    <ul>
      <li>✓ Post your first job (it's free!)</li>
      <li>✓ Review freelancer proposals</li>
      <li>✓ Hire the best talent</li>
      <li>✓ Manage projects easily</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/post" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Post Your First Job</a>
    <p><strong>Tips for success:</strong></p>
    <ul>
      <li>Write clear, detailed job descriptions</li>
      <li>Set realistic budgets and timelines</li>
      <li>Review freelancer portfolios carefully</li>
      <li>Communicate expectations upfront</li>
    </ul>
  `;
  
  await queueEmail(
    {
      to: userEmail,
      subject: 'Welcome to Neplancer - Find Top Talent! 🎯',
      html: emailHtml,
    },
    'high'
  );
}

/**
 * Stage 2: Job Posted Confirmation
 * Sent when client successfully posts a job
 */
export async function sendJobPostedConfirmation(
  userEmail: string,
  userName: string,
  jobTitle: string,
  jobId: string
) {
  const emailHtml = `
    <h2>Job Posted Successfully! ✓</h2>
    <p>Hi ${userName},</p>
    <p>Your job "<strong>${jobTitle}</strong>" is now live and visible to thousands of freelancers!</p>
    <p><strong>What happens next?</strong></p>
    <ul>
      <li>Freelancers will start applying</li>
      <li>You'll receive email notifications for each application</li>
      <li>Review proposals and shortlist candidates</li>
      <li>Message freelancers to ask questions</li>
      <li>Accept the best proposal to start the project</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Your Job</a>
    <p><strong>Pro tip:</strong> Jobs with detailed descriptions and competitive budgets typically receive more quality applications!</p>
  `;
  
  await queueEmail(
    {
      to: userEmail,
      subject: `Your Job "${jobTitle}" is Now Live! 📢`,
      html: emailHtml,
    },
    'high'
  );
}

/**
 * Stage 3: New Application Notification
 * Sent when a freelancer applies to client's job
 */
export async function sendNewApplicationNotification(
  userEmail: string,
  userName: string,
  jobTitle: string,
  jobId: string,
  freelancerName: string,
  _freelancerId: string,
  proposedAmount: string,
  _coverLetterPreview: string
) {
  const emailHtml = newApplicationEmail(
    userName,
    jobTitle,
    `${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}`,
    `${freelancerName} has applied for your job. Proposed: ${proposedAmount}`
  );
  
  await queueEmail(
    {
      to: userEmail,
      subject: `New Application for "${jobTitle}" from ${freelancerName}`,
      html: emailHtml,
    },
    'high'
  );
}

/**
 * Stage 4: Payment Hold Confirmation
 * Sent when client accepts a proposal and payment is held
 */
export async function sendPaymentHoldConfirmation(
  userEmail: string,
  userName: string,
  amount: string,
  jobTitle: string,
  freelancerName: string
) {
  const emailHtml = `
    <h2>Project Started - Payment Secured! 🔒</h2>
    <p>Hi ${userName},</p>
    <p>You've accepted ${freelancerName}'s proposal for "<strong>${jobTitle}</strong>".</p>
    <p><strong>Payment Details:</strong></p>
    <ul>
      <li>Amount held: <strong>${amount}</strong></li>
      <li>Status: Secured (will be released upon completion)</li>
      <li>Freelancer: ${freelancerName}</li>
    </ul>
    <p><strong>What happens next?</strong></p>
    <ul>
      <li>The freelancer will start working on your project</li>
      <li>You can track progress through milestones</li>
      <li>Communicate through our messaging system</li>
      <li>Review and approve deliverables</li>
      <li>Payment will be released upon your approval</li>
    </ul>
    <p><strong>Your payment is protected:</strong> Funds are only released when you approve the work.</p>
  `;
  
  await queueEmail(
    {
      to: userEmail,
      subject: `Payment Secured for "${jobTitle}"`,
      html: emailHtml,
    },
    'high'
  );
}

/**
 * Stage 5: Review Request
 * Sent when job is completed
 */
export async function sendReviewRequestToClient(
  userEmail: string,
  userName: string,
  jobTitle: string,
  jobId: string,
  freelancerName: string,
  _freelancerId: string
) {
  const emailHtml = reviewRequestEmail(
    userName,
    'client',
    jobTitle,
    `${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}/review`
  );
  
  await queueEmail(
    {
      to: userEmail,
      subject: `How was your experience with ${freelancerName}? ⭐`,
      html: emailHtml,
    },
    'medium'
  );
}

export async function sendReviewRequestToFreelancer(
  userEmail: string,
  userName: string,
  jobTitle: string,
  jobId: string,
  clientName: string
) {
  const emailHtml = reviewRequestEmail(
    userName,
    'freelancer',
    jobTitle,
    `${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}/review`
  );
  
  await queueEmail(
    {
      to: userEmail,
      subject: `Rate your experience with ${clientName} ⭐`,
      html: emailHtml,
    },
    'medium'
  );
}

// ==================== MESSAGING EMAILS ====================

export async function sendNewMessageNotification(
  userEmail: string,
  userName: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
) {
  const emailHtml = newMessageEmail(
    userName,
    senderName,
    `${process.env.NEXT_PUBLIC_APP_URL}/messages/${conversationId}`,
    messagePreview
  );
  
  await queueEmail(
    {
      to: userEmail,
      subject: `New message from ${senderName}`,
      html: emailHtml,
    },
    'medium'
  );
}

const workflowEmailsAPI = {
  // Freelancer emails
  sendFreelancerWelcomeEmail,
  sendProfileSetupReminder,
  sendJobMatchNotification,
  sendApplicationConfirmation,
  sendProposalAcceptedEmail,
  sendMilestoneApprovedEmail,
  sendPaymentReceivedNotification,
  
  // Client emails
  sendClientWelcomeEmail,
  sendJobPostedConfirmation,
  sendNewApplicationNotification,
  sendPaymentHoldConfirmation,
  sendReviewRequestToClient,
  sendReviewRequestToFreelancer,
  
  // Messaging
  sendNewMessageNotification,
};

export default workflowEmailsAPI;
