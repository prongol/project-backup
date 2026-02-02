import { sendEmail, EmailOptions } from './emailService';

// Email queue types
export type EmailPriority = 'high' | 'medium' | 'low';
export type EmailStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'bounced';

export interface QueuedEmail {
  id: string;
  to: string | string[];
  subject: string;
  html: string;
  priority: EmailPriority;
  status: EmailStatus;
  attempts: number;
  maxAttempts: number;
  scheduledFor?: Date;
  createdAt: Date;
  sentAt?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
}

// In-memory queue (replace with Redis/database in production)
class EmailQueue {
  private queue: QueuedEmail[] = [];
  private processing = false;
  private processInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startProcessing();
  }

  // Add email to queue
  async add(
    emailOptions: EmailOptions,
    priority: EmailPriority = 'medium',
    scheduledFor?: Date,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const email: QueuedEmail = {
      id: this.generateId(),
      to: emailOptions.to,
      subject: emailOptions.subject,
      html: emailOptions.html,
      priority,
      status: 'queued',
      attempts: 0,
      maxAttempts: 3,
      scheduledFor,
      createdAt: new Date(),
      metadata,
    };

    this.queue.push(email);
    console.log(`📬 Email queued: ${email.id} (Priority: ${priority})`);

    return email.id;
  }

  // Process queue
  private async processQueue() {
    if (this.processing) return;

    this.processing = true;

    try {
      // Get next batch of emails to process
      const now = new Date();
      const emailsToProcess = this.queue
        .filter(email => 
          email.status === 'queued' && 
          (!email.scheduledFor || email.scheduledFor <= now)
        )
        .sort((a, b) => {
          // Sort by priority then by created date
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a.createdAt.getTime() - b.createdAt.getTime();
        })
        .slice(0, 10); // Process 10 emails at a time

      for (const email of emailsToProcess) {
        await this.processEmail(email);
      }

      // Clean up old processed emails (older than 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      this.queue = this.queue.filter(email => 
        email.status === 'queued' || email.createdAt > weekAgo
      );
    } catch (error) {
      console.error('❌ Error processing email queue:', error);
    } finally {
      this.processing = false;
    }
  }

  // Process individual email
  private async processEmail(email: QueuedEmail) {
    email.status = 'sending';
    email.attempts++;

    try {
      const result = await sendEmail({
        to: email.to,
        subject: email.subject,
        html: email.html,
      });

      if (result.success) {
        email.status = 'sent';
        email.sentAt = new Date();
        console.log(`✅ Email sent: ${email.id}`);

        // Track delivery
        await this.trackDelivery(email.id, 'sent', result.messageId);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      email.error = errorMessage;

      if (email.attempts >= email.maxAttempts) {
        email.status = 'failed';
        console.error(`❌ Email failed after ${email.attempts} attempts: ${email.id}`);
        
        // Track failure
        await this.trackDelivery(email.id, 'failed', undefined, errorMessage);
      } else {
        email.status = 'queued';
        console.warn(`⚠️ Email attempt ${email.attempts}/${email.maxAttempts} failed: ${email.id}`);
      }
    }
  }

  // Start processing queue
  private startProcessing() {
    if (this.processInterval) return;

    // Process queue every 30 seconds
    this.processInterval = setInterval(() => {
      this.processQueue();
    }, 30000);

    // Initial process
    this.processQueue();
  }

  // Stop processing queue
  stop() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  // Get queue status
  getStatus() {
    return {
      total: this.queue.length,
      queued: this.queue.filter(e => e.status === 'queued').length,
      sending: this.queue.filter(e => e.status === 'sending').length,
      sent: this.queue.filter(e => e.status === 'sent').length,
      failed: this.queue.filter(e => e.status === 'failed').length,
    };
  }

  // Get email by ID
  getEmail(id: string): QueuedEmail | undefined {
    return this.queue.find(email => email.id === id);
  }

  // Track delivery
  private async trackDelivery(
    emailId: string,
    status: EmailStatus,
    messageId?: string,
    error?: string
  ) {
    try {
      // TODO: Store in database
      console.log(`📊 Tracking: ${emailId} - ${status}`, { messageId, error });
    } catch (error) {
      console.error('Failed to track email delivery:', error);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
const emailQueue = new EmailQueue();

// Export queue operations
export const queueEmail = (
  emailOptions: EmailOptions,
  priority: EmailPriority = 'medium',
  scheduledFor?: Date,
  metadata?: Record<string, unknown>
): Promise<string> => {
  return emailQueue.add(emailOptions, priority, scheduledFor, metadata);
};

export const getQueueStatus = () => {
  return emailQueue.getStatus();
};

export const getQueuedEmail = (id: string) => {
  return emailQueue.getEmail(id);
};

export const stopQueue = () => {
  emailQueue.stop();
};

// Email delivery tracking
export interface EmailDeliveryStats {
  email_id: string;
  status: EmailStatus;
  sent_at?: Date;
  delivered_at?: Date;
  opened_at?: Date;
  clicked_at?: Date;
  bounced_at?: Date;
  bounce_type?: 'hard' | 'soft';
  bounce_reason?: string;
  spam_at?: Date;
  unsubscribed_at?: Date;
}

// Track email events (called by webhooks)
export const trackEmailEvent = async (
  emailId: string,
  event: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'spam' | 'unsubscribed',
  data?: Record<string, unknown>
) => {
  try {
    console.log(`📊 Email event: ${emailId} - ${event}`, data);
    
    // TODO: Store in database
    // await db.emailDeliveryStats.update({
    //   where: { email_id: emailId },
    //   data: {
    //     [`${event}_at`]: new Date(),
    //     ...data,
    //   },
    // });
  } catch (error) {
    console.error('Failed to track email event:', error);
  }
};

// Get email analytics
export const getEmailAnalytics = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _startDate: Date,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _endDate: Date
): Promise<{
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  spamReports: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}> => {
  // TODO: Query from database using startDate and endDate
  // This is mock data for now
  return {
    totalSent: 1000,
    delivered: 980,
    opened: 450,
    clicked: 120,
    bounced: 20,
    spamReports: 5,
    deliveryRate: 98.0,
    openRate: 45.9,
    clickRate: 12.2,
    bounceRate: 2.0,
  };
};

// Bounce handling
export const handleBounce = async (
  emailAddress: string,
  bounceType: 'hard' | 'soft',
  reason: string
) => {
  try {
    console.log(`⚠️ Email bounce: ${emailAddress} (${bounceType}) - ${reason}`);
    
    if (bounceType === 'hard') {
      // Add to suppress list
      // TODO: Store in database
      console.log(`🚫 Adding ${emailAddress} to suppress list`);
    }
  } catch (error) {
    console.error('Failed to handle bounce:', error);
  }
};

// Unsubscribe handling
export const handleUnsubscribe = async (emailAddress: string, reason?: string) => {
  try {
    console.log(`🔕 Unsubscribe: ${emailAddress}`, { reason });
    
    // TODO: Update user preferences in database
    // await db.userPreferences.update({
    //   where: { email: emailAddress },
    //   data: {
    //     email_notifications: false,
    //     unsubscribed_at: new Date(),
    //     unsubscribe_reason: reason,
    //   },
    // });
  } catch (error) {
    console.error('Failed to handle unsubscribe:', error);
  }
};

// User email preferences
export interface EmailPreferences {
  email: string;
  // Notification categories
  account_emails: boolean;
  message_emails: boolean;
  job_emails: boolean;
  payment_emails: boolean;
  marketing_emails: boolean;
  // Frequency
  digest_frequency: 'instant' | 'daily' | 'weekly' | 'never';
  // Opt-out
  unsubscribed: boolean;
  unsubscribed_at?: Date;
}

export const getEmailPreferences = async (email: string): Promise<EmailPreferences> => {
  // TODO: Get from database
  return {
    email,
    account_emails: true,
    message_emails: true,
    job_emails: true,
    payment_emails: true,
    marketing_emails: false,
    digest_frequency: 'instant',
    unsubscribed: false,
  };
};

export const updateEmailPreferences = async (
  email: string,
  preferences: Partial<EmailPreferences>
) => {
  try {
    console.log(`📧 Updating email preferences for ${email}`, preferences);
    
    // TODO: Update in database
    // await db.userPreferences.update({
    //   where: { email },
    //   data: preferences,
    // });
  } catch (error) {
    console.error('Failed to update email preferences:', error);
    throw error;
  }
};

// Check if email should be sent based on preferences
export const shouldSendEmail = async (
  email: string,
  category: 'account' | 'message' | 'job' | 'payment' | 'marketing'
): Promise<boolean> => {
  const preferences = await getEmailPreferences(email);
  
  if (preferences.unsubscribed) return false;
  
  switch (category) {
    case 'account':
      return preferences.account_emails;
    case 'message':
      return preferences.message_emails;
    case 'job':
      return preferences.job_emails;
    case 'payment':
      return preferences.payment_emails;
    case 'marketing':
      return preferences.marketing_emails;
    default:
      return true;
  }
};

const emailQueueAPI = {
  queueEmail,
  getQueueStatus,
  getQueuedEmail,
  stopQueue,
  trackEmailEvent,
  getEmailAnalytics,
  handleBounce,
  handleUnsubscribe,
  getEmailPreferences,
  updateEmailPreferences,
  shouldSendEmail,
};

export default emailQueueAPI;
