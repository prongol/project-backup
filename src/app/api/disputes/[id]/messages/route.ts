import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { sendNotification } from '@/lib/notifications';

// ─── GET /api/disputes/[id]/messages ─────────────────────────────────────────
// Returns all (non-admin-note) messages for the dispute thread.
// Admin gets everything including internal notes.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: disputeId } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check profile for admin status + get role
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single();

    // Verify the user is actually a party to this dispute
    const { data: dispute } = await supabase
      .from('contract_disputes')
      .select(`
        id, status,
        opened_by,
        contract:contracts!contract_disputes_contract_id_fkey (
          client:clients!contracts_client_id_fkey ( profile_id ),
          freelancer:freelancers!contracts_freelancer_id_fkey ( profile_id )
        )
      `)
      .eq('id', disputeId)
      .single();

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    const contract = (dispute as any).contract;
    const clientProfileId   = contract?.client?.profile_id;
    const freelancerProfileId = contract?.freelancer?.profile_id;

    const isParty = profile?.is_admin || user.id === clientProfileId || user.id === freelancerProfileId;
    if (!isParty) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build query — admin sees everything, parties skip internal notes
    let query = supabase
      .from('dispute_messages')
      .select(`
        id, message, is_admin_note, attachments, created_at,
        sender:profiles!dispute_messages_sender_id_fkey (
          id, full_name, avatar_url, role, is_admin
        )
      `)
      .eq('dispute_id', disputeId)
      .order('created_at', { ascending: true });

    if (!profile?.is_admin) {
      query = query.eq('is_admin_note', false);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching dispute messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({
      messages: messages || [],
      dispute: {
        id: dispute.id,
        status: dispute.status,
        clientProfileId,
        freelancerProfileId,
        currentUserRole: profile?.is_admin ? 'admin' : profile?.role,
      },
    });
  } catch (err: any) {
    console.error('GET dispute messages error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/disputes/[id]/messages ────────────────────────────────────────
// Sends a new message to the dispute thread.
// Admin can send internal notes (is_admin_note: true) hidden from parties.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: disputeId } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, role, full_name')
      .eq('id', user.id)
      .single();

    // Fetch dispute + contract parties
    const { data: dispute } = await supabase
      .from('contract_disputes')
      .select(`
        id, status,
        opened_by,
        contract:contracts!contract_disputes_contract_id_fkey (
          id, title,
          client:clients!contracts_client_id_fkey ( profile_id ),
          freelancer:freelancers!contracts_freelancer_id_fkey ( profile_id )
        )
      `)
      .eq('id', disputeId)
      .single();

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    const contract = (dispute as any).contract;
    const clientProfileId     = contract?.client?.profile_id;
    const freelancerProfileId = contract?.freelancer?.profile_id;

    const isParty = profile?.is_admin || user.id === clientProfileId || user.id === freelancerProfileId;
    if (!isParty) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      return NextResponse.json({ error: 'This dispute is already closed' }, { status: 400 });
    }

    const body = await req.json();
    const message: string = (body.message || '').trim();
    const isAdminNote: boolean = !!body.is_admin_note && !!profile?.is_admin;

    if (!message) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // Insert the message
    const { data: newMsg, error: insertError } = await supabase
      .from('dispute_messages')
      .insert({
        dispute_id: disputeId,
        sender_id: user.id,
        message,
        is_admin_note: isAdminNote,
      })
      .select(`
        id, message, is_admin_note, created_at,
        sender:profiles!dispute_messages_sender_id_fkey (
          id, full_name, avatar_url, role, is_admin
        )
      `)
      .single();

    if (insertError) {
      console.error('Error inserting dispute message:', insertError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Update dispute updated_at so it floats to top of admin list
    await supabase
      .from('contract_disputes')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', disputeId);

    // ── Notify relevant parties (skip sender, skip if admin note) ──
    if (!isAdminNote) {
      const senderName = profile?.full_name || 'Someone';
      const contractTitle = contract?.title || 'a contract';
      const notifyIds: string[] = [];

      if (user.id !== clientProfileId && clientProfileId)     notifyIds.push(clientProfileId);
      if (user.id !== freelancerProfileId && freelancerProfileId) notifyIds.push(freelancerProfileId);

      // Also notify any admin assigned to the dispute (skip if sender is admin)
      if (!profile?.is_admin) {
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_admin', true)
          .limit(5);
        admins?.forEach((a: { id: string }) => {
          if (!notifyIds.includes(a.id)) notifyIds.push(a.id);
        });
      }

      await Promise.allSettled(
        notifyIds.map((recipientId) =>
          sendNotification({
            user_id: recipientId,
            type: 'new_message',
            title: `New message in dispute — ${contractTitle}`,
            message: `${senderName}: ${message.slice(0, 80)}${message.length > 80 ? '…' : ''}`,
            link: `/disputes/${disputeId}`,
          })
        )
      );
    }

    return NextResponse.json({ message: newMsg }, { status: 201 });
  } catch (err: any) {
    console.error('POST dispute message error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
