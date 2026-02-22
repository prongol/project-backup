import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/conversations - Get all conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error in GET /api/conversations:', authError);
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

    // Get all conversations where user is a participant
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Deduplicate by user pair - keep only the most recent conversation for each pair
    const userPairMap = new Map();
    conversations.forEach((conv) => {
      const otherUserId = conv.participant_1_id === user.id 
        ? conv.participant_2_id 
        : conv.participant_1_id;
      
      // If we haven't seen this user pair yet, or this conversation is more recent
      if (!userPairMap.has(otherUserId)) {
        userPairMap.set(otherUserId, conv);
      }
    });

    const uniqueConversations = Array.from(userPairMap.values());

    // Get the other participant details for each conversation
    const conversationsWithUsers = await Promise.all(
      uniqueConversations.map(async (conv) => {
        const otherUserId = conv.participant_1_id === user.id 
          ? conv.participant_2_id 
          : conv.participant_1_id;

        const { data: otherUser } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .eq('id', otherUserId)
          .single();

        // Get last message for this conversation
        const { data: lastMessageData } = await supabase
          .from('messages')
          .select('id, content, created_at, read, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const lastMessage = lastMessageData;

        // Count unread messages (not sent by current user)
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('read', false)
          .neq('sender_id', user.id);

        return {
          ...conv,
          otherUser,
          lastMessage,
          unreadCount: unreadCount || 0,
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithUsers });
  } catch (error: any) {
    console.error('Error in GET /api/conversations:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { otherUserId, jobId } = body;

    console.log('POST /api/conversations - Request received:', { otherUserId, jobId });
    console.log('Cookies present:', request.cookies.getAll().map(c => c.name));

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth result:', { user: user?.id, authError: authError?.message });

    if (authError) {
      console.error('Auth error in POST /api/conversations:', authError);
      return NextResponse.json(
        { error: 'Authentication error: ' + authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('No user found - Session may have expired');
      return NextResponse.json(
        { error: 'Not authenticated. Please log in again.' },
        { status: 401 }
      );
    }

    if (!otherUserId) {
      return NextResponse.json(
        { error: 'otherUserId is required' },
        { status: 400 }
      );
    }

    // Resolve target user ID (handle case where client_id or freelancer_id is passed instead of profile_id)
    let targetUserId = otherUserId;
    
    // 1. Check if it's already a profile ID
    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .single();
      
    if (!profileCheck) {
      console.log(`ID ${targetUserId} not found in profiles, checking clients/freelancers tables...`);
      
      // 2. Check clients table
      const { data: clientCheck } = await supabase
        .from('clients')
        .select('profile_id')
        .eq('id', targetUserId)
        .single();
        
      if (clientCheck) {
        console.log(`Resolved client ID ${targetUserId} to profile ID ${clientCheck.profile_id}`);
        targetUserId = clientCheck.profile_id;
      } else {
        // 3. Check freelancers table
        const { data: freelancerCheck } = await supabase
          .from('freelancers')
          .select('profile_id')
          .eq('id', targetUserId)
          .single();
          
        if (freelancerCheck) {
          console.log(`Resolved freelancer ID ${targetUserId} to profile ID ${freelancerCheck.profile_id}`);
          targetUserId = freelancerCheck.profile_id;
        } else {
          console.error(`Target user ID ${targetUserId} could not be resolved`);
          return NextResponse.json(
             { error: 'Recipient user not found' },
             { status: 404 }
          );
        }
      }
    }

    // Verify current user has a profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
      
    if (!userProfile) {
      console.error(`Current user ${user.id} has no profile`);
      return NextResponse.json(
        { error: 'Your user profile is missing. Please contact support.' },
        { status: 400 }
      );
    }

    // Ensure participant_1_id < participant_2_id for consistent ordering
    const [participant1, participant2] = [user.id, targetUserId].sort();

    // Check if conversation already exists
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('participant_1_id', participant1)
      .eq('participant_2_id', participant2);

    if (jobId) {
      query = query.eq('job_id', jobId);
    } else {
      query = query.is('job_id', null);
    }

    const { data: existing } = await query.single();

    if (existing) {
      return NextResponse.json({ conversation: existing });
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        participant_1_id: participant1,
        participant_2_id: participant2,
        job_id: jobId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversation: data });
  } catch (error: any) {
    console.error('Error in POST /api/conversations:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
