-- =============================================
-- VERIFICATION SCRIPT FOR DATABASE SETUP
-- Run these queries to verify everything is working
-- =============================================

-- 1. Check if tables exist
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'clients', 'freelancers', 'jobs', 'proposals', 'conversations', 'messages')
ORDER BY table_name;

-- Expected output: 7 tables

-- 2. Check RLS is enabled
SELECT tablename, 
       CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'messages');

-- Expected: Both should show "✅ Enabled"

-- 3. Check indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'messages')
ORDER BY tablename, indexname;

-- Expected: 6+ indexes

-- 4. Check trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'messages';

-- Expected: update_conversation_on_message trigger

-- 5. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'messages')
ORDER BY tablename, policyname;

-- Expected: 6 policies (3 for conversations, 3 for messages)

-- =============================================
-- TEST DATA (Optional - for development only)
-- =============================================

-- Get your user ID first:
-- SELECT id, email FROM auth.users LIMIT 5;

-- Then create a test conversation (replace UUIDs with real ones):
/*
INSERT INTO conversations (participant_1_id, participant_2_id)
VALUES (
    'user-uuid-1',  -- Replace with smaller UUID
    'user-uuid-2'   -- Replace with larger UUID
)
RETURNING *;

-- Send a test message:
INSERT INTO messages (conversation_id, sender_id, content)
VALUES (
    'conversation-uuid',  -- From above
    'sender-uuid',        -- One of the participants
    'Hello! This is a test message from the verification script.'
)
RETURNING *;

-- Verify conversation was updated:
SELECT id, updated_at 
FROM conversations 
WHERE id = 'conversation-uuid';
*/
