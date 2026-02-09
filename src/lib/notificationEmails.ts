/**
 * Notification Email Templates for Neplancer Platform
 * Complete email system for client and freelancer notifications
 */

import { resend } from './emailaa';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@neplancer.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

// =============================================================================
// CLIENT EMAIL NOTIFICATIONS
// =============================================================================

/**
 * 1. CLIENT: Job Posted Confirmation
 * Sent when a client successfully posts a new job
 */
export function getJobPostedEmail(
  clientName: string,
  clientEmail: string,
  jobTitle: string,
  jobId: string,
  budget: number,
  category: string
): EmailTemplate {
  return {
    to: clientEmail,
    subject: `✅ Job Posted Successfully: ${jobTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f7f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #0CF574 0%, #00D9A3 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .job-card { background: #f8fafb; border-left: 4px solid #0CF574; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .job-card h3 { margin: 0 0 10px 0; color: #0CF574; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .button { display: inline-block; padding: 14px 32px; background: #0CF574; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 25px 0; transition: background 0.3s; }
            .button:hover { background: #0BE566; }
            .tips { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px; }
            .tips h4 { margin: 0 0 10px 0; color: #f59e0b; }
            .footer { background: #f8fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
            .footer a { color: #0CF574; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Job Posted Successfully!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your job is now live and visible to freelancers</p>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hi <strong>${clientName}</strong>,</p>
              <p>Great news! Your job has been successfully posted on Neplancer and is now visible to thousands of talented freelancers.</p>
              
              <div class="job-card">
                <h3>📋 Job Details</h3>
                <div class="detail-row">
                  <span><strong>Title:</strong></span>
                  <span>${jobTitle}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Budget:</strong></span>
                  <span>$${budget.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Category:</strong></span>
                  <span>${category}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Status:</strong></span>
                  <span style="color: #0CF574; font-weight: bold;">✓ Live & Accepting Proposals</span>
                </div>
              </div>

              <div class="tips">
                <h4>💡 Pro Tips to Attract Top Freelancers:</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Respond quickly to proposals (within 24 hours)</li>
                  <li>Be clear about project requirements and expectations</li>
                  <li>Review freelancer profiles and portfolios carefully</li>
                  <li>Ask questions to ensure they understand your needs</li>
                </ul>
              </div>

              <center>
                <a href="${APP_URL}/client/jobs/${jobId}" class="button">View Job Posting</a>
              </center>

              <p><strong>What happens next?</strong></p>
              <ul style="line-height: 2;">
                <li>✉️ You'll receive email notifications when freelancers submit proposals</li>
                <li>📊 You can view and compare all proposals in your dashboard</li>
                <li>💬 You can message freelancers to discuss project details</li>
                <li>✅ When you find the right fit, accept their proposal to begin</li>
              </ul>

              <p style="margin-top: 30px;">We're here to help you find the perfect freelancer for your project!</p>
              
              <p>Best regards,<br><strong>The Neplancer Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Neplancer. All rights reserved.</p>
              <p><a href="${APP_URL}/client/jobs">Manage Jobs</a> | <a href="${APP_URL}/settings">Email Preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * 2. CLIENT: New Proposal Received
 * Sent when a freelancer submits a proposal to client's job
 */
export function getProposalReceivedEmail(
  clientName: string,
  clientEmail: string,
  freelancerName: string,
  jobTitle: string,
  jobId: string,
  proposalId: string,
  proposedBudget: number,
  coverLetterPreview: string
): EmailTemplate {
  const preview = coverLetterPreview.substring(0, 150) + (coverLetterPreview.length > 150 ? '...' : '');
  
  return {
    to: clientEmail,
    subject: `🎯 New Proposal: ${freelancerName} applied to "${jobTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f7f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #0CF574 0%, #00D9A3 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .proposal-card { background: #f0fdf4; border-left: 4px solid #0CF574; padding: 25px; margin: 20px 0; border-radius: 8px; }
            .freelancer-info { display: flex; align-items: center; margin-bottom: 15px; }
            .avatar { width: 50px; height: 50px; background: #0CF574; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; margin-right: 15px; }
            .budget-highlight { font-size: 32px; color: #0CF574; font-weight: bold; text-align: center; margin: 20px 0; }
            .button { display: inline-block; padding: 14px 32px; background: #0CF574; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
            .button-secondary { background: #6b7280; }
            .alert { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .footer { background: #f8fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📬 New Proposal Received!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">A freelancer has applied to your job</p>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hi <strong>${clientName}</strong>,</p>
              <p>Exciting news! You've received a new proposal for your job posting.</p>
              
              <div class="proposal-card">
                <div class="freelancer-info">
                  <div class="avatar">${freelancerName.charAt(0).toUpperCase()}</div>
                  <div>
                    <h3 style="margin: 0; color: #111;">${freelancerName}</h3>
                    <p style="margin: 5px 0; color: #6b7280;">Applied for: ${jobTitle}</p>
                  </div>
                </div>
                
                <div class="budget-highlight">
                  $${proposedBudget.toLocaleString()}
                </div>
                <p style="text-align: center; color: #6b7280; margin: 0;">Proposed Budget</p>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                  <p style="margin: 0 0 10px 0;"><strong>Cover Letter Preview:</strong></p>
                  <p style="color: #4b5563; font-style: italic; line-height: 1.8;">"${preview}"</p>
                </div>
              </div>

              <div class="alert">
                <strong>⏰ Quick Response = Better Results</strong><br>
                Freelancers appreciate fast responses. Review this proposal while they're still available!
              </div>

              <center>
                <a href="${APP_URL}/client/proposals?job=${jobId}&proposal=${proposalId}" class="button">View Full Proposal</a>
                <a href="${APP_URL}/client/jobs/${jobId}" class="button button-secondary">View All Proposals</a>
              </center>

              <p style="margin-top: 30px;"><strong>Next Steps:</strong></p>
              <ul style="line-height: 2;">
                <li>Review the freelancer's profile and portfolio</li>
                <li>Check their ratings and previous work</li>
                <li>Ask questions via messaging if needed</li>
                <li>Accept the proposal if they're the right fit</li>
              </ul>
              
              <p>Best regards,<br><strong>The Neplancer Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Neplancer. All rights reserved.</p>
              <p><a href="${APP_URL}/client/proposals">View All Proposals</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * 3. CLIENT: Freelancer Signed Contract
 * Sent when freelancer signs the contract and it becomes active
 */
export function getFreelancerSignedContractEmail(
  clientName: string,
  clientEmail: string,
  freelancerName: string,
  contractTitle: string,
  contractId: string,
  totalAmount: number,
  startDate: string
): EmailTemplate {
  return {
    to: clientEmail,
    subject: `✅ Contract Signed: ${contractTitle} - Work Begins!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f7f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .success-banner { background: #d1fae5; border: 3px solid #10b981; padding: 25px; text-align: center; border-radius: 12px; margin: 25px 0; }
            .success-banner h2 { margin: 0; color: #10b981; font-size: 24px; }
            .contract-details { background: #f8fafb; padding: 25px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .button { display: inline-block; padding: 14px 32px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
            .timeline { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px; }
            .footer { background: #f8fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Contract Is Now Active!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Work begins on your project</p>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hi <strong>${clientName}</strong>,</p>
              
              <div class="success-banner">
                <h2>✅ ${freelancerName} has signed the contract!</h2>
                <p style="margin: 10px 0 0 0;">Your project is now officially underway</p>
              </div>
              
              <p>Great news! The contract for your project has been fully signed and activated. Work can now begin.</p>
              
              <div class="contract-details">
                <h3 style="margin-top: 0; color: #111;">📄 Contract Summary</h3>
                <div class="detail-row">
                  <span><strong>Project:</strong></span>
                  <span>${contractTitle}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Freelancer:</strong></span>
                  <span>${freelancerName}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Total Amount:</strong></span>
                  <span style="color: #10b981; font-weight: bold; font-size: 18px;">$${totalAmount.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Start Date:</strong></span>
                  <span>${startDate}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Status:</strong></span>
                  <span style="color: #10b981; font-weight: bold;">● ACTIVE</span>
                </div>
              </div>

              <div class="timeline">
                <h4 style="margin: 0 0 15px 0; color: #f59e0b;">📅 What Happens Next:</h4>
                <ol style="margin: 0; padding-left: 20px; line-height: 2;">
                  <li>The freelancer begins work on your project</li>
                  <li>You can track progress through milestones/updates</li>
                  <li>Communicate via messaging for any questions</li>
                  <li>Review and approve completed milestones</li>
                  <li>Release payments as work is completed</li>
                </ol>
              </div>

              <center>
                <a href="${APP_URL}/contracts/${contractId}" class="button">View Contract</a>
                <a href="${APP_URL}/communication" class="button" style="background: #6b7280;">Message Freelancer</a>
              </center>

              <p style="margin-top: 30px;"><strong>💡 Tips for Success:</strong></p>
              <ul style="line-height: 2;">
                <li>Stay in regular communication with your freelancer</li>
                <li>Provide clear feedback on delivered work</li>
                <li>Approve milestones promptly when work meets requirements</li>
                <li>Address any concerns early through messaging or support</li>
              </ul>

              <p>We're excited to see your project come to life!</p>
              
              <p>Best regards,<br><strong>The Neplancer Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Neplancer. All rights reserved.</p>
              <p><a href="${APP_URL}/contracts">View All Contracts</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * 4. CLIENT: Work Completed Notification
 * Sent when freelancer marks work as completed
 */
export function getWorkCompletedEmail(
  clientName: string,
  clientEmail: string,
  freelancerName: string,
  contractTitle: string,
  contractId: string,
  deliverableDescription: string
): EmailTemplate {
  return {
    to: clientEmail,
    subject: `✅ Work Completed: ${contractTitle} - Review Required`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f7f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .completion-banner { background: #f3e8ff; border: 3px solid #8b5cf6; padding: 25px; text-align: center; border-radius: 12px; margin: 25px 0; }
            .completion-banner h2 { margin: 0; color: #8b5cf6; font-size: 24px; }
            .deliverable-box { background: #f8fafb; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; padding: 14px 32px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
            .action-reminder { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px; }
            .footer { background: #f8fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Work Delivered!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your project is ready for review</p>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hi <strong>${clientName}</strong>,</p>
              
              <div class="completion-banner">
                <h2>🎉 ${freelancerName} has completed the work!</h2>
                <p style="margin: 10px 0 0 0;">Please review the deliverables</p>
              </div>
              
              <p>Great news! <strong>${freelancerName}</strong> has marked the project as completed and submitted the final deliverables for your review.</p>
              
              <div class="deliverable-box">
                <h3 style="margin-top: 0; color: #8b5cf6;">📦 Project Details</h3>
                <p><strong>Project:</strong> ${contractTitle}</p>
                <p><strong>Submitted by:</strong> ${freelancerName}</p>
                <p style="margin-top: 15px;"><strong>Deliverable Notes:</strong></p>
                <p style="color: #4b5563; background: white; padding: 15px; border-radius: 6px;">${deliverableDescription}</p>
              </div>

              <div class="action-reminder">
                <h4 style="margin: 0 0 10px 0; color: #f59e0b;">⚠️ Action Required Within 7 Days</h4>
                <p style="margin: 0;">Please review the work and take one of the following actions:</p>
                <ul style="margin: 10px 0; padding-left: 20px; line-height: 2;">
                  <li><strong>Accept & Release Payment</strong> - If work meets requirements</li>
                  <li><strong>Request Revisions</strong> - If changes are needed</li>
                  <li><strong>Open a Dispute</strong> - If there are serious issues</li>
                </ul>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #92400e;"><em>Note: If no action is taken within 7 days, the work will be auto-approved and payment released.</em></p>
              </div>

              <center>
                <a href="${APP_URL}/contracts/${contractId}" class="button">Review Work</a>
                <a href="${APP_URL}/communication" class="button" style="background: #6b7280;">Message Freelancer</a>
              </center>

              <p style="margin-top: 30px;"><strong>Review Checklist:</strong></p>
              <ul style="line-height: 2;">
                <li>✓ Does the work meet all project requirements?</li>
                <li>✓ Are all deliverables provided as agreed?</li>
                <li>✓ Is the quality up to your standards?</li>
                <li>✓ Have all milestones been completed?</li>
              </ul>

              <p>We're here to help ensure a smooth completion process!</p>
              
              <p>Best regards,<br><strong>The Neplancer Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Neplancer. All rights reserved.</p>
              <p><a href="${APP_URL}/contracts">View All Contracts</a> | <a href="${APP_URL}/help/reviews">Help Center</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// =============================================================================
// FREELANCER EMAIL NOTIFICATIONS
// =============================================================================

/**
 * 5. FREELANCER: Contract Arrives (Created by Client)
 * Sent when client creates a contract and invites freelancer to sign
 */
export function getContractArrivedEmail(
  freelancerName: string,
  freelancerEmail: string,
  clientName: string,
  contractTitle: string,
  contractId: string,
  totalAmount: number,
  projectDuration: string
): EmailTemplate {
  return {
    to: freelancerEmail,
    subject: `🎉 New Contract: ${contractTitle} - Signature Required`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f7f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .contract-banner { background: #dbeafe; border: 3px solid #3b82f6; padding: 25px; text-align: center; border-radius: 12px; margin: 25px 0; }
            .contract-banner h2 { margin: 0; color: #3b82f6; font-size: 24px; }
            .amount-highlight { font-size: 36px; color: #3b82f6; font-weight: bold; text-align: center; margin: 20px 0; }
            .contract-details { background: #f8fafb; padding: 25px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .button { display: inline-block; padding: 16px 40px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 15px 5px; font-size: 16px; }
            .important { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 8px; }
            .footer { background: #f8fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 New Contract Arrived!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">A client wants to work with you</p>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hi <strong>${freelancerName}</strong>,</p>
              
              <div class="contract-banner">
                <h2>🎉 Congratulations!</h2>
                <p style="margin: 10px 0 0 0;">${clientName} has sent you a contract</p>
              </div>
              
              <p>Excellent news! <strong>${clientName}</strong> has reviewed your proposal and created a contract for the project. They're ready to work with you!</p>
              
              <div class="amount-highlight">
                $${totalAmount.toLocaleString()}
              </div>
              <p style="text-align: center; color: #6b7280; margin-top: 0;">Project Value</p>
              
              <div class="contract-details">
                <h3 style="margin-top: 0; color: #111;">📄 Contract Overview</h3>
                <div class="detail-row">
                  <span><strong>Project:</strong></span>
                  <span>${contractTitle}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Client:</strong></span>
                  <span>${clientName}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Duration:</strong></span>
                  <span>${projectDuration}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Total Payment:</strong></span>
                  <span style="color: #3b82f6; font-weight: bold; font-size: 18px;">$${totalAmount.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Status:</strong></span>
                  <span style="color: #f59e0b; font-weight: bold;">⏳ AWAITING YOUR SIGNATURE</span>
                </div>
              </div>

              <div class="important">
                <h4 style="margin: 0 0 10px 0; color: #ef4444;">⚠️ Important: Review Before Signing</h4>
                <p style="margin: 0;">Please carefully review all contract terms, deliverables, milestones, and payment schedule before signing. Once signed, the contract becomes legally binding.</p>
              </div>

              <center>
                <a href="${APP_URL}/contracts/${contractId}" class="button">Review & Sign Contract</a>
              </center>

              <p style="margin-top: 30px;"><strong>📋 Before You Sign:</strong></p>
              <ul style="line-height: 2;">
                <li>Read all contract terms and conditions carefully</li>
                <li>Verify the project scope, deliverables, and timeline</li>
                <li>Check the payment terms and milestone structure</li>
                <li>Message the client if you have any questions</li>
                <li>Ensure you can commit to the project requirements</li>
              </ul>

              <p><strong>Once you sign:</strong> The contract becomes active, and you can start working on the project immediately. Payment will be secured in escrow for your protection.</p>

              <p>This is an exciting opportunity! We're here to support you throughout the project.</p>
              
              <p>Best regards,<br><strong>The Neplancer Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Neplancer. All rights reserved.</p>
              <p><a href="${APP_URL}/contracts">View All Contracts</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * 6. FREELANCER: Payment Received
 * Sent when payment is released to freelancer (with 24hr review notice)
 */
export function getPaymentReceivedEmail(
  freelancerName: string,
  freelancerEmail: string,
  amount: number,
  projectTitle: string,
  clientName: string,
  contractId: string,
  paymentType: 'milestone' | 'full' | 'partial'
): EmailTemplate {
  const typeText = paymentType === 'milestone' ? 'Milestone Payment' : paymentType === 'full' ? 'Full Project Payment' : 'Payment';
  
  return {
    to: freelancerEmail,
    subject: `💰 Payment Received: $${amount.toLocaleString()} - ${projectTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f7f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .payment-banner { background: #d1fae5; border: 3px solid #10b981; padding: 30px; text-align: center; border-radius: 12px; margin: 25px 0; }
            .amount-display { font-size: 48px; color: #10b981; font-weight: bold; margin: 20px 0; }
            .payment-details { background: #f8fafb; padding: 25px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .button { display: inline-block; padding: 14px 32px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
            .info-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px; }
            .timeline { background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #f8fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Payment Received!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Great work! You've been paid</p>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hi <strong>${freelancerName}</strong>,</p>
              
              <div class="payment-banner">
                <h2 style="margin: 0; color: #10b981;">🎉 Congratulations!</h2>
                <div class="amount-display">$${amount.toLocaleString()}</div>
                <p style="margin: 0; color: #047857; font-size: 18px; font-weight: bold;">${typeText} Approved</p>
              </div>
              
              <p>Excellent work! The client <strong>${clientName}</strong> has approved your work and released the payment.</p>
              
              <div class="payment-details">
                <h3 style="margin-top: 0; color: #111;">📊 Payment Details</h3>
                <div class="detail-row">
                  <span><strong>Project:</strong></span>
                  <span>${projectTitle}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Client:</strong></span>
                  <span>${clientName}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Payment Type:</strong></span>
                  <span>${typeText}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Amount:</strong></span>
                  <span style="color: #10b981; font-weight: bold; font-size: 20px;">$${amount.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Status:</strong></span>
                  <span style="color: #10b981; font-weight: bold;">✓ APPROVED</span>
                </div>
              </div>

              <div class="info-box">
                <h4 style="margin: 0 0 10px 0; color: #f59e0b;">⏰ Payment Processing Timeline</h4>
                <p style="margin: 0;"><strong>Payment is currently under review and will be available in your account within 24 hours.</strong></p>
              </div>

              <div class="timeline">
                <h4 style="margin: 0 0 15px 0; color: #1e40af;">📅 What Happens Next:</h4>
                <ol style="margin: 0; padding-left: 20px; line-height: 2;">
                  <li><strong>Security Review</strong> - Payment undergoes standard security checks (24 hrs)</li>
                  <li><strong>Account Credit</strong> - Funds will be added to your Neplancer balance</li>
                  <li><strong>Withdrawal Available</strong> - You can withdraw to your bank account anytime</li>
                </ol>
              </div>

              <center>
                <a href="${APP_URL}/freelancer/payments" class="button">View Payment History</a>
                <a href="${APP_URL}/contracts/${contractId}" class="button" style="background: #6b7280;">View Contract</a>
              </center>

              <p style="margin-top: 30px;"><strong>💡 Quick Tips:</strong></p>
              <ul style="line-height: 2;">
                <li>Once credited, you can withdraw funds to your verified bank account</li>
                <li>Processing fees may apply depending on withdrawal method</li>
                <li>Keep detailed records for your taxes and accounting</li>
                <li>You can track all payments in your dashboard</li>
              </ul>

              <p>Keep up the excellent work! Your professionalism helps make Neplancer a trusted platform.</p>
              
              <p>Best regards,<br><strong>The Neplancer Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Neplancer. All rights reserved.</p>
              <p><a href="${APP_URL}/freelancer/payments">Payment History</a> | <a href="${APP_URL}/help/payments">Payment FAQ</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * 7. FREELANCER: Project Cancelled by Client
 * Sent when client cancels/dumps the project
 */
export function getProjectCancelledEmail(
  freelancerName: string,
  freelancerEmail: string,
  clientName: string,
  projectTitle: string,
  contractId: string,
  cancellationReason: string,
  wasPaymentMade: boolean,
  paidAmount?: number
): EmailTemplate {
  return {
    to: freelancerEmail,
    subject: `⚠️ Project Cancelled: ${projectTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f7f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .cancel-banner { background: #fee2e2; border: 3px solid #ef4444; padding: 25px; text-align: center; border-radius: 12px; margin: 25px 0; }
            .cancel-banner h2 { margin: 0; color: #ef4444; font-size: 24px; }
            .cancel-details { background: #f8fafb; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
            .payment-box { background: ${wasPaymentMade ? '#d1fae5' : '#fef3c7'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${wasPaymentMade ? '#10b981' : '#f59e0b'}; }
            .button { display: inline-block; padding: 14px 32px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
            .support-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px; }
            .footer { background: #f8fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Project Cancelled</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">A contract has been terminated</p>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hi <strong>${freelancerName}</strong>,</p>
              
              <div class="cancel-banner">
                <h2>Project Cancellation Notice</h2>
                <p style="margin: 10px 0 0 0;">Client: ${clientName}</p>
              </div>
              
              <p>We're sorry to inform you that the following project has been cancelled by the client:</p>
              
              <div class="cancel-details">
                <h3 style="margin-top: 0; color: #111;">📋 Cancellation Details</h3>
                <p><strong>Project:</strong> ${projectTitle}</p>
                <p><strong>Client:</strong> ${clientName}</p>
                <p><strong>Cancelled On:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                ${cancellationReason ? `
                  <p style="margin-top: 15px;"><strong>Reason Provided:</strong></p>
                  <p style="background: white; padding: 15px; border-radius: 6px; color: #4b5563;">${cancellationReason}</p>
                ` : ''}
              </div>

              ${wasPaymentMade && paidAmount ? `
                <div class="payment-box">
                  <h4 style="margin: 0 0 10px 0; color: #10b981;">💰 Payment Status: Completed</h4>
                  <p style="margin: 0;">You were paid <strong>$${paidAmount.toLocaleString()}</strong> for work completed before cancellation. This payment has been processed and is secure in your account.</p>
                </div>
              ` : `
                <div class="payment-box">
                  <h4 style="margin: 0 0 10px 0; color: #f59e0b;">⚠️ Payment Status</h4>
                  <p style="margin: 0;">If you had completed any milestones before cancellation, you are entitled to payment for that work. Please review the contract and contact support if needed.</p>
                </div>
              `}

              <center>
                <a href="${APP_URL}/contracts/${contractId}" class="button">View Contract</a>
                <a href="${APP_URL}/support" class="button" style="background: #3b82f6;">Contact Support</a>
              </center>

              <div class="support-box">
                <h4 style="margin: 0 0 10px 0; color: #1e40af;">🛡️ Your Protection</h4>
                <p style="margin: 0;"><strong>If you believe this cancellation is unfair or you haven't been paid for completed work:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px; line-height: 2;">
                  <li>Review the contract terms and cancellation policy</li>
                  <li>Document all work completed with screenshots/files</li>
                  <li>Open a dispute within 14 days if needed</li>
                  <li>Contact our support team for assistance</li>
                </ul>
                <p style="margin: 10px 0 0 0;"><strong>We're here to ensure fair treatment for all freelancers.</strong></p>
              </div>

              <p style="margin-top: 30px;"><strong>🎯 Moving Forward:</strong></p>
              <ul style="line-height: 2;">
                <li>This cancellation will not negatively impact your profile or ratings</li>
                <li>You can browse new job opportunities immediately</li>
                <li>Review your dashboard for other active projects</li>
                <li>Consider this learning experience for future projects</li>
              </ul>

              <p>We understand this is disappointing. Please don't hesitate to reach out if you need any assistance or have questions about this cancellation.</p>
              
              <p>Best regards,<br><strong>The Neplancer Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Neplancer. All rights reserved.</p>
              <p><a href="${APP_URL}/freelancer/browse-jobs">Browse New Jobs</a> | <a href="${APP_URL}/support">Get Help</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * 8. Work Submitted for Review
 * Sent to client when freelancer submits work
 */
export function getWorkSubmittedEmail(
  clientName: string,
  clientEmail: string,
  freelancerName: string,
  contractTitle: string,
  contractId: string,
  deliverables: string
): EmailTemplate {
  return {
    to: clientEmail,
    subject: `📋 Work Submitted: ${contractTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f7f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .work-card { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 25px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; padding: 14px 32px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 25px 0; }
            .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .footer { background: #f8fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Work Submitted for Review</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hi <strong>${clientName}</strong>,</p>
              <p><strong>${freelancerName}</strong> has submitted their work for the project "<strong>${contractTitle}</strong>" and it's ready for your review.</p>
              
              <div class="work-card">
                <h3 style="margin: 0 0 15px 0; color: #3b82f6;">📦 Deliverables</h3>
                <p style="white-space: pre-wrap;">${deliverables}</p>
              </div>

              <div class="alert">
                <strong>⏰ Please Review Within 3 Days</strong><br>
                You have 3 days to review the work and either approve or request revisions.
              </div>

              <center>
                <a href="${APP_URL}/contracts/${contractId}" class="button">Review Work</a>
              </center>

              <p style="margin-top: 30px;"><strong>Your Options:</strong></p>
              <ul style="line-height: 2;">
                <li><strong>Approve:</strong> If satisfied, approve to release payment</li>
                <li><strong>Request Revision:</strong> Ask for changes if needed</li>
                <li><strong>Contact Freelancer:</strong> Discuss any concerns</li>
              </ul>
              
              <p>Best regards,<br><strong>The Neplancer Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Neplancer. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * 9. Dispute Created
 * Sent to both parties when a dispute is filed
 */
export function getDisputeCreatedEmail(
  recipientName: string,
  recipientEmail: string,
  contractTitle: string,
  disputeId: string,
  disputeReason: string,
  isInitiator: boolean
): EmailTemplate {
  return {
    to: recipientEmail,
    subject: `⚠️ Dispute Filed: ${contractTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f7f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .dispute-card { background: #fee2e2; border-left: 4px solid #dc2626; padding: 25px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; padding: 14px 32px; background: #dc2626; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 25px 0; }
            .info { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .footer { background: #f8fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Dispute Filed</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hi <strong>${recipientName}</strong>,</p>
              <p>${isInitiator ? 'Your dispute has been filed' : 'A dispute has been filed'} for the project "<strong>${contractTitle}</strong>".</p>
              
              <div class="dispute-card">
                <h3 style="margin: 0 0 15px 0; color: #dc2626;">Dispute Reason</h3>
                <p style="white-space: pre-wrap;">${disputeReason}</p>
              </div>

              <div class="info">
                <strong>📋 What Happens Next?</strong><br>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Our admin team will review the dispute</li>
                  <li>Both parties can provide evidence</li>
                  <li>A fair resolution will be determined</li>
                  <li>Payment will be held in escrow during review</li>
                </ul>
              </div>

              <center>
                <a href="${APP_URL}/disputes/${disputeId}" class="button">View Dispute Details</a>
              </center>

              <p style="margin-top: 30px;"><strong>How to Resolve:</strong></p>
              <ul style="line-height: 2;">
                <li>Communicate clearly with the other party</li>
                <li>Provide evidence (screenshots, files, messages)</li>
                <li>Be professional and factual</li>
                <li>Respond to admin requests promptly</li>
              </ul>
              
              <p>Best regards,<br><strong>The Neplancer Support Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Neplancer. All rights reserved.</p>
              <p>Need help? Contact us at support@neplancer.com</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * 10. Contract Completed
 * Sent to both parties when contract is successfully closed
 */
export function getContractCompletedEmail(
  recipientName: string,
  recipientEmail: string,
  contractTitle: string,
  contractId: string,
  amount: number,
  otherPartyName: string,
  isFreelancer: boolean
): EmailTemplate {
  return {
    to: recipientEmail,
    subject: `✅ Contract Completed: ${contractTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f7f9; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #0CF574 0%, #00D9A3 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .success-card { background: #f0fdf4; border-left: 4px solid #0CF574; padding: 25px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .amount { font-size: 42px; color: #0CF574; font-weight: bold; margin: 15px 0; }
            .button { display: inline-block; padding: 14px 32px; background: #0CF574; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 25px 0; }
            .rating { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .footer { background: #f8fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Contract Completed!</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hi <strong>${recipientName}</strong>,</p>
              <p>Congratulations! The project "<strong>${contractTitle}</strong>" has been successfully completed.</p>
              
              <div class="success-card">
                <h3 style="margin: 0 0 10px 0; color: #0CF574;">✅ Project Completed</h3>
                <p style="color: #6b7280; margin: 5px 0;">Contract with ${otherPartyName}</p>
                <div class="amount">$${amount.toLocaleString()}</div>
                <p style="color: #6b7280; margin: 0;">${isFreelancer ? 'Earnings' : 'Project Cost'}</p>
              </div>

              ${isFreelancer ? `
              <div class="rating">
                <strong>⭐ Please Rate Your Experience</strong><br>
                Help other freelancers by rating your client. Your feedback improves the platform for everyone!
              </div>
              ` : `
              <div class="rating">
                <strong>⭐ Please Rate Your Experience</strong><br>
                Help other clients by rating your freelancer. Your feedback helps build a trusted community!
              </div>
              `}

              <center>
                <a href="${APP_URL}/contracts/${contractId}" class="button">${isFreelancer ? 'Rate Client & View Details' : 'Rate Freelancer & View Details'}</a>
              </center>

              <p style="margin-top: 30px;"><strong>What's Next?</strong></p>
              <ul style="line-height: 2;">
                ${isFreelancer ? `
                <li>Payment has been released to your account</li>
                <li>Update your portfolio with this project</li>
                <li>Browse new opportunities</li>
                ` : `
                <li>Hire ${otherPartyName} again for future projects</li>
                <li>Post a new job if you need more work done</li>
                <li>Leave a public review to help others</li>
                `}
              </ul>
              
              <p>Thank you for using Neplancer!<br><strong>The Neplancer Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Neplancer. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// =============================================================================
// EMAIL SENDING FUNCTION
// =============================================================================

/**
 * Universal email sending function
 * Handles all email sending with proper error handling
 */
export async function sendNotificationEmail(template: EmailTemplate): Promise<{success: boolean; error?: any}> {
  try {
    // Check if emails are disabled in development
    if (process.env.DISABLE_EMAILS === 'true') {
      console.log('📧 [DEV MODE - EMAILS DISABLED] Email would be sent to:', template.to);
      console.log('📋 Subject:', template.subject);
      console.log('---');
      return { success: true };
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.log('📧 [DEV MODE - NO API KEY] Email would be sent to:', template.to);
      console.log('📋 Subject:', template.subject);
      return { success: true };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      ...template,
    });

    if (error) {
      console.error('❌ Email send error:', error);
      return { success: false, error };
    }

    console.log('✅ Email sent successfully to:', template.to);
    return { success: true };
  } catch (error) {
    console.error('❌ Email send exception:', error);
    return { success: false, error };
  }
}

// Export all email templates
export const EmailNotifications = {
  // Client emails
  jobPosted: getJobPostedEmail,
  proposalReceived: getProposalReceivedEmail,
  freelancerSignedContract: getFreelancerSignedContractEmail,
  workCompleted: getWorkCompletedEmail,
  workSubmitted: getWorkSubmittedEmail,
  
  // Freelancer emails
  contractArrived: getContractArrivedEmail,
  paymentReceived: getPaymentReceivedEmail,
  projectCancelled: getProjectCancelledEmail,
  
  // Both parties
  disputeCreated: getDisputeCreatedEmail,
  contractCompleted: getContractCompletedEmail,
  
  // Send function
  send: sendNotificationEmail,
};
