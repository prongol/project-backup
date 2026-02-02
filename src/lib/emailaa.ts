import { Resend } from 'resend';

// Allow development without Resend API key
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_demo_key';

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY not set - emails will be logged to console only');
}

export const resend = new Resend(RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@neplancer.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Email templates
export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

// Email verification template
export function getEmailVerificationEmail(name: string, email: string, verificationUrl: string): EmailTemplate {
  return {
    to: email,
    subject: 'Verify Your Email - Neplancer',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0CF574 0%, #00D9A3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #0CF574; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for signing up for Neplancer! To complete your registration and ensure the security of your account, please verify your email address.</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 14px;">${verificationUrl}</p>
              <div class="warning">
                <strong>Security Notice:</strong> This verification link expires in 24 hours. If you didn't create an account with Neplancer, please ignore this email.
              </div>
              <p>After verification, you'll be able to access all features of Neplancer.</p>
              <p>Best regards,<br>The Neplancer Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Neplancer. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Profile completion notification email
export function getProfileCompletionEmail(name: string, email: string, role: 'client' | 'freelancer'): EmailTemplate {
  const roleSpecificContent = role === 'freelancer' 
    ? `
      <ul>
        <li>✨ Your freelancer profile is live and visible to clients</li>
        <li>🔍 Browse and apply to available job postings</li>
        <li>💼 Showcase your skills and build your portfolio</li>
        <li>💰 Start earning by completing projects</li>
      </ul>
    `
    : `
      <ul>
        <li>📝 Post your first job and find talented freelancers</li>
        <li>🔍 Search through our pool of verified professionals</li>
        <li>💬 Connect and communicate with freelancers</li>
        <li>📊 Manage projects and track progress</li>
      </ul>
    `;

  return {
    to: email,
    subject: '🎉 Profile Complete - Welcome to Neplancer!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0CF574 0%, #00D9A3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #0CF574; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .success-banner { background: #d4edda; border: 2px solid #0CF574; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 You're All Set!</h1>
            </div>
            <div class="content">
              <div class="success-banner">
                <h2 style="color: #0CF574; margin: 0;">Profile Successfully Completed!</h2>
              </div>
              <p>Hi ${name},</p>
              <p>Congratulations! Your ${role} profile on Neplancer is now complete and active. You're ready to start your journey with us!</p>
              <div class="features">
                <h3>What's Next?</h3>
                ${roleSpecificContent}
              </div>
              <a href="${APP_URL}/dashboard" class="button">Go to Dashboard</a>
              <p><strong>Need help getting started?</strong></p>
              <p>Check out our <a href="${APP_URL}/help">Help Center</a> or contact our support team at support@neplancer.com</p>
              <p>We're excited to have you on board!</p>
              <p>Best regards,<br>The Neplancer Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Neplancer. All rights reserved.</p>
              <p><a href="${APP_URL}/settings">Manage Email Preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Welcome email for new users
export function getWelcomeEmail(name: string, email: string): EmailTemplate {
  return {
    to: email,
    subject: 'Welcome to Neplancer! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0CF574 0%, #00D9A3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #0CF574; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Neplancer!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for joining Neplancer - the premier freelancing platform connecting talented professionals with exciting opportunities.</p>
              <p>Here's what you can do next:</p>
              <ul>
                <li>Complete your profile to stand out</li>
                <li>Browse available projects</li>
                <li>Connect with clients or freelancers</li>
                <li>Start building your reputation</li>
              </ul>
              <a href="${APP_URL}/dashboard" class="button">Go to Dashboard</a>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br>The Neplancer Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Neplancer. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Proposal received email for clients
export function getProposalReceivedEmail(
  clientName: string,
  clientEmail: string,
  jobTitle: string,
  freelancerName: string,
  proposalId: string
): EmailTemplate {
  return {
    to: clientEmail,
    subject: `New Proposal for "${jobTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0CF574; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #0CF574; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .highlight { background: #fff; padding: 15px; border-left: 4px solid #0CF574; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📨 New Proposal Received!</h2>
            </div>
            <div class="content">
              <p>Hi ${clientName},</p>
              <p>Good news! <strong>${freelancerName}</strong> has submitted a proposal for your job posting.</p>
              <div class="highlight">
                <strong>Job:</strong> ${jobTitle}
              </div>
              <p>Review their proposal to see if they're the right fit for your project.</p>
              <a href="${APP_URL}/jobs/proposals/${proposalId}" class="button">View Proposal</a>
              <p>Best regards,<br>The Neplancer Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Proposal accepted email for freelancers
export function getProposalAcceptedEmail(
  freelancerName: string,
  freelancerEmail: string,
  jobTitle: string,
  contractId: string
): EmailTemplate {
  return {
    to: freelancerEmail,
    subject: `🎉 Your Proposal Was Accepted!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0CF574 0%, #00D9A3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #0CF574; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .success { background: #e8f8f0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
            </div>
            <div class="content">
              <p>Hi ${freelancerName},</p>
              <div class="success">
                <h2 style="color: #0CF574; margin: 0;">Your proposal was accepted!</h2>
              </div>
              <p>The client has accepted your proposal for <strong>"${jobTitle}"</strong>.</p>
              <p>Next steps:</p>
              <ul>
                <li>Review the contract details</li>
                <li>Set up milestones with the client</li>
                <li>Start working on the project</li>
                <li>Communicate regularly with your client</li>
              </ul>
              <a href="${APP_URL}/contracts/${contractId}" class="button">View Contract</a>
              <p>Good luck with your project!</p>
              <p>Best regards,<br>The Neplancer Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Milestone approved email
export function getMilestoneApprovedEmail(
  freelancerName: string,
  freelancerEmail: string,
  milestoneTitle: string,
  amount: number,
  milestoneId: string
): EmailTemplate {
  return {
    to: freelancerEmail,
    subject: `💰 Milestone Approved: ${milestoneTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0CF574; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .amount { font-size: 36px; color: #0CF574; font-weight: bold; text-align: center; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #0CF574; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>💰 Milestone Approved!</h2>
            </div>
            <div class="content">
              <p>Hi ${freelancerName},</p>
              <p>Great work! Your milestone <strong>"${milestoneTitle}"</strong> has been approved.</p>
              <div class="amount">$${amount.toFixed(2)}</div>
              <p style="text-align: center; color: #666;">Payment will be released to your account within 2-3 business days.</p>
              <a href="${APP_URL}/milestones/${milestoneId}" class="button">View Milestone</a>
              <p>Keep up the excellent work!</p>
              <p>Best regards,<br>The Neplancer Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Password reset email
export function getPasswordResetEmail(
  email: string,
  resetToken: string
): EmailTemplate {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`;

  return {
    to: email,
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #333; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #0CF574; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔐 Password Reset Request</h2>
            </div>
            <div class="content">
              <p>You requested to reset your password for your Neplancer account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <div class="warning">
                <strong>Security Notice:</strong> This link expires in 1 hour. If you didn't request this reset, please ignore this email.
              </div>
              <p>For security reasons, never share this link with anyone.</p>
              <p>Best regards,<br>The Neplancer Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Send email function
export async function sendEmail(template: EmailTemplate) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      ...template,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send exception:', error);
    return { success: false, error };
  }
}

// Batch send emails
export async function sendBulkEmails(templates: EmailTemplate[]) {
  try {
    const results = await Promise.allSettled(
      templates.map(template => sendEmail(template))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      total: templates.length,
      successful,
      failed,
      results,
    };
  } catch (error) {
    console.error('Bulk email send error:', error);
    return { success: false, error };
  }
}

// Contract warning email for admins
export function getContractWarningEmail(
  userName: string,
  userEmail: string,
  subject: string,
  message: string,
  contractId: string
): EmailTemplate {
  return {
    to: userEmail,
    subject: `⚠️ ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>⚠️ Contract Attention Required</h2>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <div class="warning">
                <strong>Action Required:</strong> Your immediate attention is needed regarding your contract.
              </div>
              <p>${message}</p>
              <a href="${APP_URL}/contracts/${contractId}" class="button">View Contract</a>
              <p>If you have any questions or concerns, please respond immediately or contact our support team.</p>
              <p><strong>This is an official notice from the Neplancer Admin Team.</strong></p>
              <p>Best regards,<br>The Neplancer Admin Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Inactivity warning email
export function getInactivityWarningEmail(
  userName: string,
  userEmail: string,
  contractTitle: string,
  contractId: string,
  daysInactive: number
): EmailTemplate {
  return {
    to: userEmail,
    subject: `⚠️ Contract Inactivity Warning - Action Required`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .critical { background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; }
            .deadline { font-size: 24px; color: #ef4444; font-weight: bold; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🚨 Urgent: Contract Inactivity Detected</h2>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <div class="critical">
                <strong>Critical Notice:</strong> Your contract has been inactive for ${daysInactive} days.
              </div>
              <p><strong>Contract:</strong> ${contractTitle}</p>
              <p>We've noticed that there has been no activity on this contract for an extended period. This may indicate an issue that requires your immediate attention.</p>
              <div class="deadline">
                ⏰ Please respond within 24 hours
              </div>
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Log into your account and review the contract status</li>
                <li>Communicate with the other party if needed</li>
                <li>Update the project progress or milestone status</li>
                <li>Contact support if you're experiencing issues</li>
              </ul>
              <a href="${APP_URL}/contracts/${contractId}" class="button">View Contract Now</a>
              <p><strong>Important:</strong> Failure to respond may result in contract cancellation and impact on your account standing.</p>
              <p>If you need assistance, please contact our support team immediately.</p>
              <p>Best regards,<br>The Neplancer Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Payment delay reminder email
export function getPaymentDelayEmail(
  clientName: string,
  clientEmail: string,
  contractTitle: string,
  freelancerName: string,
  amount: number,
  daysPending: number,
  contractId: string,
  milestoneId: string
): EmailTemplate {
  return {
    to: clientEmail,
    subject: `⚠️ Payment Reminder: ${daysPending} Days Overdue`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0CF574; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #0CF574; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .amount { font-size: 36px; color: #0CF574; font-weight: bold; text-align: center; margin: 20px 0; }
            .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>💰 Payment Approval Required</h2>
            </div>
            <div class="content">
              <p>Hi ${clientName},</p>
              <p>This is a reminder that a milestone has been delivered and is awaiting your review and payment approval.</p>
              <p><strong>Contract:</strong> ${contractTitle}</p>
              <p><strong>Freelancer:</strong> ${freelancerName}</p>
              <div class="amount">$${amount.toFixed(2)}</div>
              <div class="warning">
                <strong>Payment Pending:</strong> ${daysPending} days since delivery
              </div>
              <p>Please review the delivered work and either:</p>
              <ul>
                <li><strong>Approve Payment</strong> - If the work meets your requirements</li>
                <li><strong>Request Revisions</strong> - If changes are needed</li>
                <li><strong>Open a Dispute</strong> - If there are serious issues</li>
              </ul>
              <a href="${APP_URL}/contracts/${contractId}/milestones/${milestoneId}" class="button">Review & Approve</a>
              <p><strong>Note:</strong> Per our Terms of Service, if no action is taken within ${14 - daysPending} days, payment may be automatically released to the freelancer.</p>
              <p>Thank you for being a valued client on Neplancer.</p>
              <p>Best regards,<br>The Neplancer Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
