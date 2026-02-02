'use server';

/**
 * Server-only email actions
 * These functions can ONLY be called from the server or through API routes
 * They use nodemailer which contains Node.js-specific modules
 */

import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

// Email Service Configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 10,
};

let transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;

const getEmailTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig);
    transporter.verify((error) => {
      if (error) {
        console.error('❌ Email transporter verification failed:', error);
      } else {
        console.log('✅ Email server is ready to send messages');
      }
    });
  }
  return transporter;
};

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

const stripHtml = (html: string): string => {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

/**
 * Send a single email
 * This is a server action and can only be called from server-side code
 */
export async function sendEmailAction(
  options: EmailOptions,
  retries = 3
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = getEmailTransporter();

  const mailOptions = {
    from: options.from || process.env.SMTP_FROM || 'Neplancer <noreply@neplancer.com>',
    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || stripHtml(options.html),
    replyTo: options.replyTo,
    cc: options.cc,
    bcc: options.bcc,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${options.to}:`, info.messageId);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Email sending attempt ${attempt}/${retries} failed:`, error);

      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying in ${waitTime / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Unknown error',
  };
}

/**
 * Send batch emails
 * Server action for bulk email operations
 */
export async function sendBatchEmailsAction(
  emails: EmailOptions[],
  batchSize = 10
): Promise<{
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}> {
  const results = {
    total: emails.length,
    successful: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>,
  };

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(email => sendEmailAction(email))
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        results.successful++;
      } else {
        results.failed++;
        const email = batch[index];
        const error = result.status === 'fulfilled'
          ? result.value.error
          : (result as PromiseRejectedResult).reason;

        results.errors.push({
          email: Array.isArray(email.to) ? email.to.join(', ') : email.to,
          error: error || 'Unknown error',
        });
      }
    });

    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Test email configuration
 * Server action to verify SMTP connection
 */
export async function testEmailConfigAction(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const transporter = getEmailTransporter();
    await transporter.verify();
    return {
      success: true,
      message: 'Email configuration is valid and server is reachable',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
