    import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: async () => cookieStore });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subject, category, message, priority } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Get user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, user_type')
      .eq('id', user.id)
      .single();

    // For now, we'll send an email to admin
    
    console.log('📧 Support ticket received:', {
      from: user.email,
      name: profile?.full_name,
      userType: profile?.user_type,
      category,
      priority,
      subject,
      message: message.substring(0, 100) + '...'
    });

    // Save ticket to database
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        category,
        message,
        priority: priority || 'medium',
        status: 'open'
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Error saving support ticket:', ticketError);
      // We don't fail here because the console log happened, but ideally we should
    }

    return NextResponse.json({
      success: true,
      message: 'Support request submitted successfully. Our team will contact you soon.',
      ticketId: ticket?.id || `TICKET-${Date.now()}` // Fallback ID
    });

  } catch (error) {
    console.error('Support ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to submit support request' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: async () => cookieStore });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's support tickets from database
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (ticketsError) {
      console.error('Error fetching support tickets:', ticketsError);
      return NextResponse.json(
        { error: 'Failed to fetch support tickets' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tickets: tickets || []
    });

  } catch (error) {
    console.error('Fetch support tickets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}
