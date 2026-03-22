-- =====================================================
-- DISPUTE MESSAGES TABLE
-- A shared thread for client + freelancer + admin
-- to communicate during a dispute resolution
-- =====================================================

CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id  TEXT NOT NULL REFERENCES public.contract_disputes(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  is_admin_note BOOLEAN DEFAULT FALSE,  -- TRUE = only visible to admin (internal note)
  attachments JSONB DEFAULT '[]'::jsonb, -- future: file URLs
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON public.dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_sender  ON public.dispute_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_created ON public.dispute_messages(created_at DESC);

-- RLS: Disabled — access is controlled entirely by the API layer
-- (Admin, client, and freelancer of the contract can all post/read)
ALTER TABLE public.dispute_messages DISABLE ROW LEVEL SECURITY;

-- Grant
GRANT ALL ON public.dispute_messages TO authenticated;

COMMENT ON TABLE public.dispute_messages IS 
  'Threaded dispute communication between client, freelancer, and admin';
COMMENT ON COLUMN public.dispute_messages.is_admin_note IS 
  'When true, message is an internal admin note not shown to client/freelancer';
