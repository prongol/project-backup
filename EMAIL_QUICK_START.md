# 🚀 Email System - Quick Start Guide

## Prerequisites
- Resend account (https://resend.com - Free tier available)
- Domain for sending emails (optional for testing)

## Setup Steps

### 1. Get Resend API Key
```bash
1. Go to https://resend.com/signup
2. Create a free account
3. Navigate to API Keys
4. Click "Create API Key"
5. Copy the key (starts with re_...)
```

### 2. Configure Environment Variables
Add to your `.env.local` file:

```env
# Resend Email Configuration
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@neplancer.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production, use your domain:
# RESEND_FROM_EMAIL=noreply@yourdomain.com
# NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. Verify Domain (Production Only)
```bash
1. Go to Resend Dashboard → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., neplancer.com)
4. Add the DNS records Resend provides:
   - SPF record (TXT)
   - DKIM record (TXT)
   - DMARC record (TXT)
5. Click "Verify Domain"
```

### 4. Test the System

#### Development Mode (No API Key Needed)
```bash
# Emails will log to console instead of sending
npm run dev

# Look for logs like:
# 📧 [DEV MODE] Email would be sent to: user@example.com
# 📋 Subject: Job Posted Successfully: Build a Website
```

#### Production Mode (With API Key)
```bash
# Emails will actually send
npm run dev

# Look for logs like:
# ✅ Email sent successfully to: user@example.com
# 📧 Job posted email sent to: client@example.com
```

## 📧 Available Email Types

### Client Emails (4 types)
1. **Job Posted** - Confirmation when client posts a job
2. **Proposal Received** - When freelancer submits proposal
3. **Contract Signed** - When freelancer signs contract
4. **Work Completed** - When freelancer submits work

### Freelancer Emails (3 types)
5. **Contract Arrived** - When client creates contract
6. **Payment Received** - When payment is released (24hr notice)
7. **Project Cancelled** - When client cancels project

## 🧪 Testing Emails

### Test Individual Email
```typescript
// In your browser console or API testing tool
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'job_posted',
    email: 'your-test-email@example.com'
  })
});
```

### Test All Emails Flow
1. **Post a job** → Client receives "Job Posted" email
2. **Submit proposal** → Client receives "Proposal Received" email
3. **Create contract** → Freelancer receives "Contract Arrived" email
4. **Sign contract** → Client receives "Contract Signed" email
5. **Complete work** → Client receives "Work Completed" email
6. **Approve payment** → Freelancer receives "Payment Received" email
7. **Cancel contract** → Freelancer receives "Project Cancelled" email

## 🔍 Troubleshooting

### Emails Not Sending
```bash
# Check 1: Environment variables
echo $RESEND_API_KEY  # Should show your API key

# Check 2: Console logs
# Look for: ❌ Email send error: ...

# Check 3: Resend dashboard
# Go to https://resend.com/emails
# Check for failed sends
```

### Emails Going to Spam
```bash
# Solution 1: Verify your domain
# Add SPF, DKIM, DMARC records

# Solution 2: Use verified sender
# RESEND_FROM_EMAIL should be from verified domain

# Solution 3: Warm up your domain
# Send gradually increasing volume
```

### Wrong Links in Emails
```bash
# Check NEXT_PUBLIC_APP_URL
# Should be: http://localhost:3000 (dev)
# Or: https://yourdomain.com (prod)
```

## 📝 Quick Reference

### Email Trigger Locations
```
POST /api/jobs                                      → Job Posted Email
POST /api/proposals                                 → Proposal Received Email
POST /api/contracts                                 → Contract Arrived Email
POST /api/contracts/[id]/sign                       → Contract Signed Email
POST /api/contracts/[id]/complete                   → Work Completed Email
POST /api/contracts/[id]/milestones/[id]/approve    → Payment Received Email
PATCH /api/contracts/[id] (status: cancelled)       → Project Cancelled Email
```

### Email File Locations
```
src/lib/notificationEmails.ts       → All email templates
src/app/api/*/route.ts              → Email trigger integrations
```

## 🎯 Next Steps

1. **Customize Email Content**
   - Edit templates in `src/lib/notificationEmails.ts`
   - Update branding colors
   - Add your logo

2. **Add More Email Types**
   - Follow the pattern in existing templates
   - Integrate into appropriate API endpoints
   - Test thoroughly

3. **Monitor Performance**
   - Check Resend dashboard for delivery rates
   - Monitor open rates
   - Track bounce rates

4. **Production Deployment**
   - Verify your domain
   - Update environment variables
   - Test with real email addresses
   - Monitor for first 24 hours

## ✅ Verification Checklist

Before going live:

- [ ] Resend API key configured
- [ ] Domain verified (production)
- [ ] Test emails sent successfully
- [ ] Links work correctly
- [ ] Mobile view looks good
- [ ] All 7 email types tested
- [ ] Spam score checked
- [ ] Error handling works
- [ ] Logging is visible
- [ ] Documentation reviewed

## 🆘 Support

Need help? Check these resources:

1. **Email System Documentation:** `EMAIL_NOTIFICATION_SYSTEM.md`
2. **Resend Docs:** https://resend.com/docs
3. **Console Logs:** Check terminal for errors
4. **Resend Dashboard:** Check delivery status

---

**Ready to go!** Your email notification system is now fully functional. 📧✨

Start your development server and test the system:
```bash
npm run dev
```

Then perform actions that trigger emails (post job, submit proposal, etc.)
