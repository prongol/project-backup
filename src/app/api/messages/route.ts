import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyNewMessage } from '@/lib/notifications';

// GET /api/messages?conversationId=xxx - Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error in GET /api/messages:', authError);
      return NextResponse.json(
        { error: 'Authentication error: ' + authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated. Please log in again.' },
        { status: 401 }
      );
    }

    // Verify user is part of this conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conversation || 
        (conversation.participant_1_id !== user.id && conversation.participant_2_id !== user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Error in GET /api/messages:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { conversationId, content } = body;

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'conversationId and content are required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error in POST /api/messages:', authError);
      return NextResponse.json(
        { error: 'Authentication error: ' + authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated. Please log in again.' },
        { status: 401 }
      );
    }

    // Verify user is part of this conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conversation || 
        (conversation.participant_1_id !== user.id && conversation.participant_2_id !== user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Insert message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Send notification to recipient
    try {
      // Determine recipient (the other person in the conversation)
      const recipientId = conversation.participant_1_id === user.id 
        ? conversation.participant_2_id 
        : conversation.participant_1_id;

      // Get sender's profile to get their name
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (senderProfile && recipientId) {
        await notifyNewMessage({
          recipientProfileId: recipientId,
          senderName: senderProfile.full_name || 'Someone',
          preview: content.trim(),
          conversationId: conversationId
        });
      }
    } catch (notifError) {
      console.error('Error sending message notification:', notifError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ message: data });
  } catch (error: any) {
    console.error('Error in POST /api/messages:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/messages - Mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error in PATCH /api/messages:', authError);
      return NextResponse.json(
        { error: 'Authentication error: ' + authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated. Please log in again.' },
        { status: 401 }
      );
    }

    // Mark all messages in this conversation as read (except those sent by current user)
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in PATCH /api/messages:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
