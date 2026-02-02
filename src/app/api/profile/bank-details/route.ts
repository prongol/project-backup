import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/profile/bank-details - Get user's bank details
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get profile with bank details
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('bank_details')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching bank details:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      bank_details: profile?.bank_details || {}
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bank details';
    console.error('Error fetching bank details:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/profile/bank-details - Update user's bank details
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
    const { bank_details } = body;

    if (!bank_details) {
      return NextResponse.json(
        { error: 'Bank details are required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['account_holder_name', 'bank_name', 'account_number', 'routing_number', 'country'];
    for (const field of requiredFields) {
      if (!bank_details[field]) {
        return NextResponse.json(
          { error: `${field.replace('_', ' ')} is required` },
          { status: 400 }
        );
      }
    }

    // Update profile with bank details
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        bank_details,
        bank_details_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating bank details:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'bank_details_updated',
        title: 'Bank Details Updated ✅',
        message: 'Your bank account information has been successfully updated.',
        link: '/settings',
        read: false,
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({ 
      success: true,
      message: 'Bank details updated successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update bank details';
    console.error('Error updating bank details:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
