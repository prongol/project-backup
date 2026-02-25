# Custom Password Reset Implementation - Complete ✅

## Overview
Implemented a custom password reset system using your existing Resend/nodemailer email service instead of Supabase SMTP.

## What Changed

### 1. New Files Created
- **`/src/app/actions/passwordReset.ts`** - Token generation and verification functions
- **`CREATE_PASSWORD_RESET_TOKENS.sql`** - Database table for storing reset tokens

### 2. Files Modified
- **`/src/app/api/auth/forgot-password/route.ts`** - Now uses custom email service
- **`/src/app/api/auth/reset-password/route.ts`** - Token-based password reset
- **`/src/app/(auth)/reset-password/page.tsx`** - Sends token with password update

## Setup Instructions

### Step 1: Create Database Table
Run the SQL in Supabase dashboard:
```bash
# Copy and paste the contents of CREATE_PASSWORD_RESET_TOKENS.sql into Supabase SQL Editor
```

Or use supabase CLI:
```bash
psql -h <your-supabase-host> -U postgres -d postgres -f CREATE_PASSWORD_RESET_TOKENS.sql
```

### Step 2: Test the Flow

1. **Request Password Reset:**
   - Go to `/forgot-password`
   - Enter email address
   - Check console logs for email confirmation

2. **Check Email:**
   - You should receive an email with subject "Reset Your Password - Neplancer"
   - Click the reset link in the email

3. **Reset Password:**
   - Link will take you to `/reset-password?token=xxx`
   - Enter new password
   - Submit form

4. **Login:**
   - Use new password to login

## How It Works

### Password Reset Flow:

1. **User requests reset** (`/forgot-password`)
   ```
   → Creates token (stored as hash)
   → Sends email via Resend/nodemailer
   → Email contains: http://localhost:3000/reset-password?token=abc123...
   ```

2. **User clicks link** (`/reset-password?token=abc123`)
   ```
   → Page extracts token from URL
   → User enters new password
   ```

3. **User submits new password**
   ```
   → Verifies token is valid and not expired
   → Updates password using Supabase admin
   → Deletes used token
   → Redirects to login
   ```

## Security Features

✅ **Token Security:**
- Tokens are hashed (SHA256) before storage
- 1-hour expiration (more secure than 24h)
- One-time use (deleted after password reset)

✅ **Email Privacy:**
- Doesn't reveal if email exists in system
- Always returns success message

✅ **Database Security:**
- RLS enabled on password_reset_tokens table
- Only service role can manage tokens
- Cascading delete on user deletion

## Email Template

Uses existing `resetPasswordEmail()` from `/src/utils/emailTemplates.ts`:
- Red theme (different from verification email)
- Clear "Reset Password" button
- Security notice about ignoring if not requested

## Testing Checklist

- [ ] Run CREATE_PASSWORD_RESET_TOKENS.sql in Supabase
- [ ] Test forgot-password with valid email
- [ ] Check terminal logs for "✅ Password reset email sent successfully"
- [ ] Check email inbox for reset link
- [ ] Click reset link and verify token in URL
- [ ] Submit new password on reset page
- [ ] Verify success message and redirect to login
- [ ] Login with new password
- [ ] Test expired token (wait 1 hour or manually update expires_at)
- [ ] Test invalid token (modify URL token parameter)

## Troubleshooting

### "Error creating reset token"
- Check Supabase service role key is configured
- Verify CREATE_PASSWORD_RESET_TOKENS.sql was executed

### "Failed to send password reset email"
- Check SMTP configuration in .env
- Verify Resend API key (if using Resend)
- Check terminal logs for email errors

### "Invalid or expired reset token"
- Token might be expired (1 hour limit)
- Token might have been used already
- Token might be incorrect (check URL)

## Environment Variables

No new environment variables needed! Uses existing:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=Neplancer <noreply@neplancer.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Maintenance

**Optional: Auto-cleanup expired tokens**
Create a cron job in Supabase:
```sql
-- Run daily at midnight
SELECT cron.schedule(
  'cleanup-expired-reset-tokens',
  '0 0 * * *',
  $$ SELECT cleanup_expired_reset_tokens() $$
);
```

## Advantages Over Supabase SMTP

✅ No dependency on Supabase SMTP configuration
✅ Uses your existing working email service
✅ More control over email template and branding
✅ Custom token expiration (1 hour vs 24 hours)
✅ Can track token usage in your database
✅ Consistent email sender across all emails

## Next Steps

1. Run the SQL to create the table
2. Test with a real email address
3. Verify emails are being sent successfully
4. Consider adding rate limiting to prevent abuse
5. Add monitoring/logging for failed reset attempts
