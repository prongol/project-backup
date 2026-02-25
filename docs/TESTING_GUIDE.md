# 🧪 Testing Guide - Neplancer Platform

## Pre-Testing Setup

### 1. Start Development Server
```bash
npm run dev
```

### 2. Create Test Accounts
You'll need at least:
- 1 Client account
- 1 Freelancer account

---

## Test Suite

### ✅ Test 1: Profile Form Fix (Client)

**Steps:**
1. Register a new client account
2. Complete the company profile form
3. Verify redirect to dashboard
4. Log out
5. Log back in
6. ✅ **Expected:** Dashboard loads, NO profile form shown

**If it fails:** Check that `profile_completed` is set to `true` in Supabase → Authentication → Users → User Details

---

### ✅ Test 2: DevTools Removal

**Steps:**
1. Open the app in development mode
2. Check bottom-right corner of the screen
3. ✅ **Expected:** NO TanStack Query DevTools panel visible

---

### ✅ Test 3: Logo Navigation

**Steps:**
1. From any page (e.g., `/dashboard`, `/freelancer/browse-jobs`)
2. Click the "Neplancer" logo
3. ✅ **Expected:** Redirects to home page `/`
4. Test from both authenticated and unauthenticated states

---

### ✅ Test 4: Job Posting & Visibility

#### Part A: Post a Job (Client)
1. Login as **Client**
2. Navigate to "Post a Job" from navbar
3. Fill in the form:
   - **Title:** "Full-Stack Developer Needed"
   - **Description:** "Building a modern web app..."
   - **Budget:** 150000
   - **Category:** "Web Development"
   - **Skills:** React, Node.js, TypeScript
4. Submit the form
5. ✅ **Expected:** Success message, job appears in "My Jobs"

#### Part B: Browse Jobs (Freelancer)
1. Login as **Freelancer**
2. Click "Browse Jobs" in navbar
3. ✅ **Expected:** 
   - Your posted job appears in the list
   - Job shows correct title, budget, skills
   - "Apply Now" button is visible

**Verify in Supabase:**
```sql
SELECT id, title, budget, status, created_at 
FROM jobs 
WHERE status = 'open' 
ORDER BY created_at DESC;
```

---

### ✅ Test 5: Job Application System

**Steps:**
1. Login as **Freelancer**
2. Go to "Browse Jobs"
3. Find a job and click **"Apply Now"**
4. ✅ **Expected:** Modal opens with:
   - Job details summary
   - Cover letter textarea
   - Proposed budget (pre-filled with job budget)
   - Estimated duration field

5. Fill out the form:
   ```
   Cover Letter: "I have 5 years of experience..."
   Budget: 145000
   Duration: "2 weeks"
   ```

6. Click **"Submit Proposal"**
7. ✅ **Expected:** 
   - "Proposal submitted successfully!" toast notification
   - Modal closes
   - Job list refreshes

8. Try to apply to the same job again
9. ✅ **Expected:** Error message "You have already submitted a proposal"

**Verify in Supabase:**
```sql
SELECT p.*, j.title, f.title as freelancer_title
FROM proposals p
JOIN jobs j ON p.job_id = j.id
JOIN freelancers f ON p.freelancer_id = f.id
ORDER BY p.created_at DESC;
```

---

### ✅ Test 6: Messaging System

#### Part A: Start Conversation from Job
1. Login as **Freelancer**
2. Browse Jobs page
3. Click **"Message"** button on a job
4. ✅ **Expected:** 
   - Redirects to `/communication?conversationId=xxx`
   - Conversation is created in database

**Verify Conversation Created:**
```sql
SELECT c.*, 
       p1.full_name as participant_1_name,
       p2.full_name as participant_2_name
FROM conversations c
JOIN profiles p1 ON c.participant_1_id = p1.id
JOIN profiles p2 ON c.participant_2_id = p2.id
ORDER BY c.created_at DESC
LIMIT 5;
```

#### Part B: Send Messages
1. From the communication page
2. Type a message: "Hi! I'm interested in this job"
3. Send message
4. ✅ **Expected:** Message appears in the chat

**Check Real-Time (if enabled):**
1. Open the app in two browser windows
   - Window 1: Freelancer account
   - Window 2: Client account
2. Send messages from Window 1
3. ✅ **Expected:** Messages appear instantly in Window 2

**Verify in Database:**
```sql
-- Check messages
SELECT m.*, 
       p.full_name as sender_name,
       m.created_at
FROM messages m
JOIN profiles p ON m.sender_id = p.id
ORDER BY m.created_at DESC
LIMIT 10;

-- Check conversation timestamps updated
SELECT id, updated_at 
FROM conversations 
ORDER BY updated_at DESC
LIMIT 5;
```

---

## Common Issues & Solutions

### ❌ Issue: "freelancer_id is null"
**Solution:** 
```sql
-- Check if freelancer record exists
SELECT * FROM freelancers WHERE profile_id = 'your-user-id';

-- If not, create one:
INSERT INTO freelancers (profile_id, title, bio, skills, hourly_rate)
VALUES ('your-user-id', 'Full-Stack Developer', 'Experienced developer', ARRAY['React', 'Node.js'], 50);
```

### ❌ Issue: "Cannot create conversation"
**Solution:**
- Ensure both users exist in `profiles` table
- Check RLS policies are enabled
- Verify auth.uid() returns correct user ID

### ❌ Issue: Messages not appearing
**Solution:**
1. Check browser console for errors
2. Verify conversation_id is correct
3. Check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

### ❌ Issue: "Profile form keeps showing"
**Solution:**
```sql
-- Update profile_completed flag manually
UPDATE profiles 
SET profile_completed = true 
WHERE id = 'your-user-id';
```

---

## Performance Testing

### Load Test: Browse Jobs
1. Create 20+ test jobs in database
2. Browse Jobs page should load < 2 seconds
3. Filtering and search should be instant

### Load Test: Messages
1. Create a conversation with 50+ messages
2. Messages should load and scroll smoothly
3. Sending new message should be < 1 second

---

## Browser Compatibility

Test in these browsers:
- ✅ Chrome/Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Security Checks

### Test RLS Policies
```sql
-- Try to access another user's proposals (should fail)
SELECT * FROM proposals WHERE freelancer_id != 'your-freelancer-id';

-- Try to read messages from conversation you're not part of (should return empty)
SELECT * FROM messages WHERE conversation_id = 'someone-elses-conversation';
```

---

## Success Criteria

All tests pass when:
- ✅ No console errors
- ✅ No TypeScript compilation errors
- ✅ All user flows complete successfully
- ✅ Database data is consistent
- ✅ Real-time updates work (if enabled)
- ✅ Mobile responsive design works
- ✅ RLS policies prevent unauthorized access

---

## Next Steps After Testing

1. **If everything works:** Deploy to production!
2. **If issues found:** Document them and fix
3. **Consider adding:**
   - Email notifications for new messages
   - Push notifications
   - File upload in chat
   - Proposal status tracking
   - Payment integration

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs
3. Verify database tables and RLS policies
4. Review the IMPLEMENTATION_COMPLETE.md document
