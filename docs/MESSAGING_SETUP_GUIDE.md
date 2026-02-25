# Quick Database Setup for New Features

## Step 1: Run the Messaging System SQL

Open your Supabase SQL Editor and run the following:

```sql
-- =============================================
-- CHAT AND MESSAGING SYSTEM
-- =============================================

-- Conversations table to track chat threads
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    participant_2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(participant_1_id, participant_2_id, job_id),
    CHECK (participant_1_id < participant_2_id)
);

-- Messages table to store individual messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Conversations
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (
        participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    );

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (
        participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    );

CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (
        participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    );

-- RLS Policies for Messages
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (
        sender_id = auth.uid()
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read) WHERE read = false;

-- Function to update conversation timestamp on new message
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NEW.created_at 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation timestamp
CREATE TRIGGER update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Enable realtime for messages (for real-time chat)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

## Step 2: Verify Tables

Run this query to check if tables were created successfully:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages')
ORDER BY table_name;
```

You should see:
- conversations
- messages

## Step 3: Test the Setup

### Test 1: Create a Conversation
```sql
-- Replace UUIDs with actual user IDs from your profiles table
INSERT INTO conversations (participant_1_id, participant_2_id)
VALUES (
    'user-id-1', -- Smaller UUID first
    'user-id-2'  -- Larger UUID second
);
```

### Test 2: Send a Message
```sql
-- Replace with actual conversation ID and sender ID
INSERT INTO messages (conversation_id, sender_id, content)
VALUES (
    'conversation-id',
    'sender-profile-id',
    'Hello! This is a test message.'
);
```

### Test 3: Verify Trigger Works
```sql
-- Check if conversation updated_at changed after message insert
SELECT id, updated_at 
FROM conversations 
WHERE id = 'your-conversation-id';
```

## Step 4: Enable Real-time (Optional but Recommended)

1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for the `messages` table
3. This allows real-time message delivery without page refresh

## Troubleshooting

### Error: "relation conversations does not exist"
- Make sure you're running the SQL in the correct database
- Check that you have CREATE TABLE permissions

### Error: "column participant_1_id is not less than participant_2_id"
- Ensure participant_1_id < participant_2_id when inserting
- The application handles this automatically

### Messages not appearing in real-time
- Enable Supabase Realtime for the messages table
- Check that your client has subscribed to changes

### RLS policy errors
- Verify you're authenticated when testing
- Check that auth.uid() returns a valid profile ID
- Test with actual API endpoints, not direct SQL

## Complete! 🎉

Your database is now ready to support:
- ✅ Real-time messaging between users
- ✅ Job-specific conversations
- ✅ Secure data access with RLS
- ✅ Automatic timestamp updates
- ✅ Optimized queries with indexes

Next: Test the messaging feature in your application!
