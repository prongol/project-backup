// Email template layouts and components

export const emailLayout = (content: string, preheader?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Neplancer</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #ffffff;
      text-decoration: none;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #3b82f6;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      margin: 0 10px;
      color: #6b7280;
      text-decoration: none;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      margin: 0 0 20px 0;
    }
    p {
      color: #4b5563;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }
    .preheader {
      display: none;
      font-size: 1px;
      color: #ffffff;
      line-height: 1px;
      max-height: 0px;
      max-width: 0px;
      opacity: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0">
          <!-- Header -->
          <tr>
            <td class="header">
              <a href="https://neplancer.com" class="logo">Neplancer</a>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer">
              <div class="social-links">
                <a href="https://twitter.com/neplancer">Twitter</a>
                <a href="https://linkedin.com/company/neplancer">LinkedIn</a>
                <a href="https://facebook.com/neplancer">Facebook</a>
              </div>
              <p>© ${new Date().getFullYear()} Neplancer. All rights reserved.</p>
              <p>
                <a href="https://neplancer.com/preferences" style="color: #6b7280;">Email Preferences</a> | 
                <a href="https://neplancer.com/unsubscribe" style="color: #6b7280;">Unsubscribe</a>
              </p>
              <p style="margin-top: 20px; font-size: 12px;">
                Neplancer Inc.<br>
                123 Freelance Street, Remote City, RC 12345
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Button component
export const button = (text: string, url: string, color = '#3b82f6') => `
  <a href="${url}" class="button" style="background-color: ${color};">${text}</a>
`;

// Info box component
export const infoBox = (content: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const colors = {
    info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
    success: { bg: '#f0fdf4', border: '#10b981', text: '#166534' },
    warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
    error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  };

  const color = colors[type];

  return `
    <div style="background-color: ${color.bg}; border-left: 4px solid ${color.border}; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="color: ${color.text}; margin: 0;">${content}</p>
    </div>
  `;
};

// Stats component
export const stats = (items: Array<{label: string; value: string}>) => `
  <table width="100%" cellpadding="10" cellspacing="0" style="margin: 20px 0;">
    <tr>
      ${items.map(item => `
        <td align="center" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
          <div style="font-size: 28px; font-weight: bold; color: #111827;">${item.value}</div>
          <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">${item.label}</div>
        </td>
      `).join('')}
    </tr>
  </table>
`;

// ===== AUTHENTICATION TEMPLATES =====

export const WelcomeEmail = (name: string, verificationUrl: string) => emailLayout(`
  <h1>Welcome to Neplancer! 🎉</h1>
  <p>Hi ${name},</p>
  <p>Welcome aboard! We're thrilled to have you join the Neplancer community. Whether you're here to find talented freelancers or showcase your skills to clients, you're in the right place.</p>
  
  ${infoBox('Please verify your email address to unlock all features and start connecting with opportunities.', 'info')}
  
  <center>
    ${button('Verify Email Address', verificationUrl)}
  </center>
  
  <p>Once verified, you can:</p>
  <ul>
    <li>Complete your profile</li>
    <li>Browse thousands of opportunities</li>
    <li>Connect with clients and freelancers</li>
    <li>Start building your reputation</li>
  </ul>
  
  <p>If you have any questions, our support team is here to help!</p>
  <p>Best regards,<br><strong>The Neplancer Team</strong></p>
`, 'Welcome to Neplancer - Verify your email');

export const emailVerificationEmail = (name: string, verificationCode: string, verificationUrl: string) => emailLayout(`
  <h1>Verify Your Email Address</h1>
  <p>Hi ${name},</p>
  <p>Thank you for signing up! Please verify your email address to activate your account.</p>
  
  <center>
    <div style="background-color: #f9fafb; border: 2px dashed #3b82f6; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; margin: 20px 0;">
      ${verificationCode}
    </div>
  </center>
  
  <p>Or click the button below:</p>
  
  <center>
    ${button('Verify Email', verificationUrl)}
  </center>
  
  <p style="color: #6b7280; font-size: 14px;">This code will expire in 24 hours. If you didn't create an account, please ignore this email.</p>
`, 'Verify your email address');

export const passwordResetEmail = (name: string, resetUrl: string) => emailLayout(`
  <h1>Reset Your Password</h1>
  <p>Hi ${name},</p>
  <p>We received a request to reset your password. Click the button below to create a new password:</p>
  
  <center>
    ${button('Reset Password', resetUrl)}
  </center>
  
  ${infoBox('This link will expire in 1 hour for security reasons.', 'warning')}
  
  <p>If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.</p>
  <p>Best regards,<br><strong>The Neplancer Team</strong></p>
`, 'Reset your password');

export const passwordChangedEmail = (name: string) => emailLayout(`
  <h1>Password Changed Successfully</h1>
  <p>Hi ${name},</p>
  <p>This is a confirmation that your password was successfully changed.</p>
  
  ${infoBox('If you didn\'t make this change, please contact our support team immediately.', 'warning')}
  
  <center>
    ${button('Contact Support', 'https://neplancer.com/support', '#ef4444')}
  </center>
  
  <p>Best regards,<br><strong>The Neplancer Team</strong></p>
`, 'Your password has been changed');

export const twoFactorCode = (name: string, code: string) => emailLayout(`
  <h1>Two-Factor Authentication Code</h1>
  <p>Hi ${name},</p>
  <p>Your two-factor authentication code is:</p>
  
  <center>
    <div style="background-color: #f9fafb; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #3b82f6; margin: 20px 0;">
      ${code}
    </div>
  </center>
  
  <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. If you didn't attempt to log in, please secure your account immediately.</p>
`, 'Your 2FA code');

export const newDeviceLogin = (name: string, device: string, location: string, time: string) => emailLayout(`
  <h1>New Device Login Detected</h1>
  <p>Hi ${name},</p>
  <p>We detected a login to your account from a new device:</p>
  
  <table style="background-color: #f9fafb; width: 100%; border-radius: 8px; margin: 20px 0;" cellpadding="15">
    <tr>
      <td style="color: #6b7280; width: 120px;"><strong>Device:</strong></td>
      <td style="color: #111827;">${device}</td>
    </tr>
    <tr>
      <td style="color: #6b7280;"><strong>Location:</strong></td>
      <td style="color: #111827;">${location}</td>
    </tr>
    <tr>
      <td style="color: #6b7280;"><strong>Time:</strong></td>
      <td style="color: #111827;">${time}</td>
    </tr>
  </table>
  
  ${infoBox('If this was you, you can safely ignore this email. If not, please secure your account immediately.', 'warning')}
  
  <center>
    ${button('Secure My Account', 'https://neplancer.com/security', '#ef4444')}
  </center>
`, 'New device login detected');

// ===== JOB-RELATED TEMPLATES =====

export const newJobMatchEmail = (freelancerName: string, jobTitle: string, jobUrl: string, client: string, budget: string) => emailLayout(`
  <h1>🎯 New Job Match!</h1>
  <p>Hi ${freelancerName},</p>
  <p>We found a job that matches your skills and preferences:</p>
  
  <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
    <h2 style="color: #111827; margin: 0 0 10px 0; font-size: 20px;">${jobTitle}</h2>
    <p style="color: #6b7280; margin: 5px 0;">Posted by: <strong>${client}</strong></p>
    <p style="color: #10b981; margin: 5px 0; font-size: 18px; font-weight: 600;">Budget: ${budget}</p>
  </div>
  
  <center>
    ${button('View Job & Apply', jobUrl)}
  </center>
  
  <p style="color: #6b7280; font-size: 14px;">💡 Tip: Early applicants often have higher success rates!</p>
`, `New job match: ${jobTitle}`);

export const applicationAcceptedEmail = (freelancerName: string, jobTitle: string, client: string, jobUrl: string) => emailLayout(`
  <h1>🎉 Congratulations! Application Accepted</h1>
  <p>Hi ${freelancerName},</p>
  <p>Great news! Your application for "${jobTitle}" has been accepted by ${client}.</p>
  
  ${stats([
    { label: 'Job Title', value: jobTitle },
    { label: 'Client', value: client },
  ])}
  
  ${infoBox('The client will contact you soon to discuss project details.', 'success')}
  
  <center>
    ${button('View Job Details', jobUrl)}
  </center>
  
  <p>Best of luck with your project!</p>
`, `Application accepted: ${jobTitle}`);

export const applicationRejectedEmail = (freelancerName: string, jobTitle: string) => emailLayout(`
  <h1>Application Update</h1>
  <p>Hi ${freelancerName},</p>
  <p>Thank you for your interest in "${jobTitle}". Unfortunately, the client has decided to move forward with other candidates.</p>
  
  ${infoBox('Don\'t be discouraged! Keep applying and refining your proposals.', 'info')}
  
  <center>
    ${button('Browse More Jobs', 'https://neplancer.com/freelancer/browse-jobs')}
  </center>
  
  <p>💡 <strong>Pro Tips:</strong></p>
  <ul>
    <li>Customize each proposal to the specific job</li>
    <li>Highlight relevant experience and skills</li>
    <li>Keep proposals concise and professional</li>
  </ul>
`, `Application update for: ${jobTitle}`);

export const newApplicationEmail = (clientName: string, freelancerName: string, jobTitle: string, proposalUrl: string) => emailLayout(`
  <h1>📬 New Application Received</h1>
  <p>Hi ${clientName},</p>
  <p>You've received a new application for "${jobTitle}" from ${freelancerName}.</p>
  
  <center>
    ${button('Review Application', proposalUrl)}
  </center>
  
  <p style="color: #6b7280; font-size: 14px;">💡 Tip: Responding quickly helps you secure top talent!</p>
`, `New application: ${jobTitle}`);

export const milestoneCompletedEmail = (name: string, role: 'freelancer' | 'client', jobTitle: string, milestoneTitle: string, amount: string, jobUrl: string) => emailLayout(`
  <h1>✅ Milestone Completed</h1>
  <p>Hi ${name},</p>
  <p>A milestone has been marked as completed for "${jobTitle}":</p>
  
  <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
    <h3 style="color: #166534; margin: 0 0 10px 0;">${milestoneTitle}</h3>
    <p style="color: #166534; margin: 0; font-size: 18px; font-weight: 600;">${amount}</p>
  </div>
  
  <center>
    ${button(role === 'freelancer' ? 'View Project' : 'Approve & Release Payment', jobUrl)}
  </center>
`, `Milestone completed: ${milestoneTitle}`);

export const paymentReceivedEmail = (freelancerName: string, amount: string, jobTitle: string, client: string) => emailLayout(`
  <h1>💰 Payment Received</h1>
  <p>Hi ${freelancerName},</p>
  <p>You've received a payment of <strong style="color: #10b981; font-size: 24px;">${amount}</strong> from ${client} for "${jobTitle}".</p>
  
  ${stats([
    { label: 'Amount', value: amount },
    { label: 'From', value: client },
    { label: 'Job', value: jobTitle },
  ])}
  
  <center>
    ${button('View Transaction', 'https://neplancer.com/payments')}
  </center>
  
  ${infoBox('The payment will be available for withdrawal after the security hold period.', 'info')}
`, `Payment received: ${amount}`);

export const reviewRequestEmail = (name: string, role: 'freelancer' | 'client', jobTitle: string, reviewUrl: string) => emailLayout(`
  <h1>⭐ Please Leave a Review</h1>
  <p>Hi ${name},</p>
  <p>Your ${role === 'freelancer' ? 'work with the client' : 'project with the freelancer'} on "${jobTitle}" is complete. We'd love to hear about your experience!</p>
  
  ${infoBox('Reviews help build trust in our community and improve the experience for everyone.', 'info')}
  
  <center>
    ${button('Leave a Review', reviewUrl)}
  </center>
  
  <p>Thank you for being part of the Neplancer community!</p>
`, `Review request: ${jobTitle}`);

// ===== MESSAGING TEMPLATES =====

export const newMessageEmail = (recipientName: string, senderName: string, messagePreview: string, messageUrl: string) => emailLayout(`
  <h1>💬 New Message</h1>
  <p>Hi ${recipientName},</p>
  <p>You have a new message from <strong>${senderName}</strong>:</p>
  
  <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; font-style: italic;">
    "${messagePreview}"
  </div>
  
  <center>
    ${button('View & Reply', messageUrl)}
  </center>
`, `New message from ${senderName}`);

export const messageDigestEmail = (recipientName: string, unreadCount: number, messages: Array<{sender: string; preview: string}>) => emailLayout(`
  <h1>📬 Unread Messages Digest</h1>
  <p>Hi ${recipientName},</p>
  <p>You have <strong>${unreadCount} unread message${unreadCount === 1 ? '' : 's'}</strong>:</p>
  
  ${messages.map(msg => `
    <div style="background-color: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #3b82f6;">
      <p style="margin: 0 0 5px 0; font-weight: 600; color: #111827;">${msg.sender}</p>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">${msg.preview}</p>
    </div>
  `).join('')}
  
  <center>
    ${button('View All Messages', 'https://neplancer.com/messages')}
  </center>
`, `You have ${unreadCount} unread messages`);

// ===== ACCOUNT MANAGEMENT TEMPLATES =====

export const profileUpdatedEmail = (name: string) => emailLayout(`
  <h1>Profile Updated</h1>
  <p>Hi ${name},</p>
  <p>Your profile has been successfully updated.</p>
  
  ${infoBox('A complete and up-to-date profile helps you stand out!', 'success')}
  
  <center>
    ${button('View Profile', 'https://neplancer.com/profile')}
  </center>
`, 'Your profile has been updated');

export const verificationCompletedEmail = (name: string, verificationType: string) => emailLayout(`
  <h1>✅ Verification Complete</h1>
  <p>Hi ${name},</p>
  <p>Congratulations! Your ${verificationType} verification has been approved.</p>
  
  ${stats([
    { label: 'Status', value: '✓ Verified' },
    { label: 'Type', value: verificationType },
  ])}
  
  ${infoBox('Verified users are more trusted and have higher success rates!', 'success')}
  
  <center>
    ${button('View Profile', 'https://neplancer.com/profile')}
  </center>
`, `${verificationType} verification complete`);

export const accountSuspensionWarning = (name: string, reason: string) => emailLayout(`
  <h1>⚠️ Account Suspension Warning</h1>
  <p>Hi ${name},</p>
  <p>We've detected activity on your account that violates our Terms of Service:</p>
  
  ${infoBox(reason, 'error')}
  
  <p>Please review our Terms of Service and adjust your account accordingly. Failure to comply may result in account suspension.</p>
  
  <center>
    ${button('Contact Support', 'https://neplancer.com/support', '#ef4444')}
  </center>
`, 'Account suspension warning');

// Export all templates
export const emailTemplates = {
  // Authentication
  WelcomeEmail,
  emailVerificationEmail,
  passwordResetEmail,
  passwordChangedEmail,
  twoFactorCode,
  newDeviceLogin,
  
  // Jobs
  newJobMatchEmail,
  applicationAcceptedEmail,
  applicationRejectedEmail,
  newApplicationEmail,
  milestoneCompletedEmail,
  paymentReceivedEmail,
  reviewRequestEmail,
  
  // Messaging
  newMessageEmail,
  messageDigestEmail,
  
  // Account
  profileUpdatedEmail,
  verificationCompletedEmail,
  accountSuspensionWarning,
};

export default emailTemplates;
