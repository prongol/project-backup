import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailNotifications } from '@/lib/notificationEmails';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Received job post request:', body);

    // Validate required fields
    const { client_id, title, description, budget, category, skills, status } = body;

    if (!client_id) {
      console.error('❌ Missing client_id');
      return NextResponse.json(
        { error: 'client_id is required' },
        { status: 400 }
      );
    }

    if (!title || !description || !budget || !category || !skills) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: title, description, budget, category, skills' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Insert job into database
    const jobData = {
      client_id,
      title: title.trim(),
      description: description.trim(),
      budget: parseFloat(budget),
      category,
      skills,
      status: status || 'open',
      deadline: body.deadline || null,
      created_at: new Date().toISOString(),
    };

    console.log('💾 Inserting job into database:', jobData);

    const { data, error } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    console.log('✅ Job created successfully:', data);

    // Get client profile details for email
    try {
      // First get the client record to find profile_id
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('profile_id')
        .eq('id', client_id)
        .single();

      if (clientError) {
        console.error('⚠️ Failed to fetch client:', clientError);
      } else if (client) {
        // Now get the profile with email using profile_id
        const { data: clientProfile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', client.profile_id)
          .single();

        if (profileError) {
          console.error('⚠️ Failed to fetch profile:', profileError);
        } else if (clientProfile && clientProfile.email) {
          // Send job posted confirmation email
          await EmailNotifications.send(
            EmailNotifications.jobPosted(
              clientProfile.full_name || 'Client',
              clientProfile.email,
              data.title,
              data.id,
              data.budget,
              data.category
            )
          );
          console.log('📧 Job posted email sent to:', clientProfile.email);
        } else {
          console.warn('⚠️ Client profile has no email address');
        }
      }
    } catch (emailError) {
      // Don't fail the request if email fails
      console.error('⚠️ Failed to send job posted email:', emailError);
    }

    return NextResponse.json(
      { success: true, job: data },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('❌ Error in POST /api/jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const freelancerId = searchParams.get('freelancerId');

    let query = supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // If freelancerId is provided, check which jobs they've already applied to
    if (freelancerId && data) {
      const jobIds = data.map(job => job.id);
      
      const { data: proposals } = await supabase
        .from('proposals')
        .select('job_id')
        .eq('freelancer_id', freelancerId)
        .in('job_id', jobIds);

      const appliedJobIds = new Set(proposals?.map(p => p.job_id) || []);
      
      // Add hasApplied flag to each job
      const jobsWithAppliedStatus = data.map(job => ({
        ...job,
        hasApplied: appliedJobIds.has(job.id)
      }));

      return NextResponse.json({ jobs: jobsWithAppliedStatus });
    }

    return NextResponse.json({ jobs: data });

  } catch (error: any) {
    console.error('Error in GET /api/jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}