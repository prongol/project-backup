import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailNotifications } from '@/lib/notificationEmails';

// GET /api/contracts - Get all contracts for the authenticated user
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Get client ID if user is a client
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    // Get freelancer ID if user is a freelancer
    const { data: freelancerData } = await supabase
      .from('freelancers')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (!clientData && !freelancerData) {
      return NextResponse.json(
        { error: 'User is neither a client nor a freelancer' },
        { status: 403 }
      );
    }

    // Build filter conditions based on user role
    const conditions: string[] = [];
    if (clientData) {
      conditions.push(`client_id.eq.${clientData.id}`);
    }
    if (freelancerData) {
      conditions.push(`freelancer_id.eq.${freelancerData.id}`);
    }

    let query = supabase
      .from('contracts')
      .select(`
        *,
        jobs:job_id (
          id,
          title,
          category
        ),
        client:client_id (
          id,
          profile_id,
          profiles!clients_profile_id_fkey (
            full_name,
            avatar_url
          )
        ),
        freelancer:freelancer_id (
          id,
          profile_id,
          profiles!freelancers_profile_id_fkey (
            full_name,
            avatar_url
          )
        )
      `)
      .or(conditions.join(','))
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: contracts, error } = await query;

    if (error) {
      console.error('Error fetching contracts:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ contracts: contracts || [] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch contracts';
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/contracts - Create a new contract
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      proposal_id,
      job_id,
      freelancer_id,
      title,
      description,
      contract_type,
      total_amount,
      hourly_rate,
      start_date,
      end_date,
      estimated_hours,
      terms,
      deliverables,
      payment_terms,
      custom_fields,
      milestones
    } = body;

    console.log('📝 Creating contract with data:', {
      proposal_id,
      job_id,
      freelancer_id,
      title,
      total_amount
    });

    // Validate required fields
    if (!job_id || !freelancer_id || !title) {
      console.error('❌ Missing required fields:', { job_id, freelancer_id, title, total_amount });
      return NextResponse.json(
        { error: 'Missing required fields: job_id, freelancer_id, and title are required' },
        { status: 400 }
      );
    }

    if (!total_amount || parseFloat(total_amount) <= 0) {
      console.error('❌ Invalid total_amount:', total_amount);
      return NextResponse.json(
        { error: 'Total amount must be a positive number' },
        { status: 400 }
      );
    }

    // Get client ID from clients table (not user.id directly)
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (clientError || !clientData) {
      console.error('❌ Client not found for profile_id:', user.id);
      return NextResponse.json(
        { error: 'Client profile not found. Please complete your client profile first.' },
        { status: 404 }
      );
    }

    // Validate freelancer exists in freelancers table
    const { data: freelancerData, error: freelancerError } = await supabase
      .from('freelancers')
      .select('id, profile_id, profiles:profile_id(full_name)')
      .eq('id', freelancer_id)
      .single();

    if (freelancerError || !freelancerData) {
      console.error('❌ Freelancer not found:', freelancer_id);
      return NextResponse.json(
        { error: 'Freelancer not found' },
        { status: 404 }
      );
    }

    // Create the contract
    const contractData: any = {
      proposal_id,
      job_id,
      client_id: clientData.id,
      freelancer_id: freelancerData.id,
      title,
      total_amount: parseFloat(total_amount),
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Add optional fields only if they exist
    if (description) contractData.description = description;
    if (contract_type) contractData.contract_type = contract_type;
    if (hourly_rate) contractData.hourly_rate = parseFloat(hourly_rate);
    if (start_date) contractData.start_date = start_date;
    if (end_date) contractData.end_date = end_date;
    if (estimated_hours) contractData.estimated_hours = estimated_hours;
    if (terms) contractData.terms = terms;
    if (deliverables) contractData.deliverables = deliverables;
    if (payment_terms) contractData.payment_terms = payment_terms;
    if (custom_fields) contractData.custom_fields = custom_fields;

    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (contractError) {
      console.error('Error creating contract:', contractError);
      return NextResponse.json(
        { error: contractError.message },
        { status: 500 }
      );
    }

    // Create milestones if provided
    if (milestones && Array.isArray(milestones) && milestones.length > 0) {
      const milestonesData = milestones.map((m: { title: string; description: string; amount: number; due_date: string }) => ({
        contract_id: contract.id,
        title: m.title,
        description: m.description,
        amount: parseFloat(String(m.amount)),
        due_date: m.due_date,
        status: 'pending',
      }));

      const { error: milestonesError } = await supabase
        .from('contract_milestones')
        .insert(milestonesData);

      if (milestonesError) {
        console.error('Error creating milestones:', milestonesError);
      }
    }

    // Send contract to freelancer's messages
    const freelancerProfileId = freelancerData.profile_id;
    
    // Find or create conversation
    const participantCondition = `and(participant_1_id.eq.${user.id},participant_2_id.eq.${freelancerProfileId}),and(participant_1_id.eq.${freelancerProfileId},participant_2_id.eq.${user.id})`;
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .or(participantCondition)
      .maybeSingle();

    let conversationId = conversation?.id;

    // Create conversation if doesn't exist
    if (!conversationId) {
      const participant1 = user.id < freelancerProfileId ? user.id : freelancerProfileId;
      const participant2 = user.id < freelancerProfileId ? freelancerProfileId : user.id;

      const { data: newConv, error: newConvError } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: participant1,
          participant_2_id: participant2,
          job_id,
        })
        .select()
        .single();

      if (newConvError) {
        console.error('Error creating conversation:', newConvError);
      } else {
        conversationId = newConv.id;
      }
    }

    // Send contract message
    if (conversationId) {
      // Truncate description if too long for better readability
      const shortDescription = description && description.length > 100 
        ? description.substring(0, 100) + '...' 
        : description || 'No description provided';
      
      const contractMessage = `📄 **New Contract: ${title}**

💼 **Type:** ${(contract_type || '').replace('_', ' ').toUpperCase()}
💰 **Amount:** $${total_amount}${hourly_rate ? `\n⏱️ **Hourly Rate:** $${hourly_rate}/hr` : ''}${estimated_hours ? `\n📅 **Estimated Hours:** ${estimated_hours} hrs` : ''}

📋 **Summary:** ${shortDescription}

✅ **Next Steps:**
1. Review the full contract details
2. Sign the contract to accept
3. Start working on the project

👉 [View Full Contract & Sign](/contracts/${contract.id})`;

      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: contractMessage,
          read: false,
        });
    }

    // Create notification for freelancer
    await supabase
      .from('notifications')
      .insert({
        user_id: freelancerProfileId,
        type: 'contract_received',
        title: 'New Contract Received! 📝',
        message: `You have received a contract for "${title}". Review and sign to start working!`,
        link: `/contracts/${contract.id}`,
        read: false,
        created_at: new Date().toISOString(),
      });

    // Send email notification to freelancer about new contract
    try {
      const { data: freelancerProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', freelancerProfileId)
        .single();

      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (freelancerProfile && clientProfile) {
        const duration = estimated_hours ? `${estimated_hours} hours` : (end_date && start_date) ? 'As specified in contract' : 'To be determined';
        
        await EmailNotifications.send(
          EmailNotifications.contractArrived(
            freelancerProfile.full_name || 'Freelancer',
            freelancerProfile.email,
            clientProfile.full_name || 'Client',
            title,
            contract.id,
            parseFloat(total_amount),
            duration
          )
        );
        console.log('📧 Contract arrival email sent to freelancer:', freelancerProfile.email);
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send contract arrival email:', emailError);
    }

    return NextResponse.json({ 
      success: true, 
      contract,
      conversationId,
      message: 'Contract created and sent to freelancer!'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create contract';
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
