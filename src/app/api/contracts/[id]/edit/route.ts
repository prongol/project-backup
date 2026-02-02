import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractId = params.id;
    const body = await request.json();
    const { title, description, total_amount, deadline, payment_type, milestones } = body;

    // Get current user's client profile
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (!clientData) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
    }

    // Get contract to verify ownership and editability
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .eq('client_id', clientData.id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: 'Contract not found or access denied' }, { status: 404 });
    }

    // Check if contract is editable
    if (!contract.is_editable) {
      return NextResponse.json(
        { error: 'Contract cannot be edited after freelancer has signed' },
        { status: 403 }
      );
    }

    // Check if freelancer has signed
    if (contract.freelancer_signed) {
      return NextResponse.json(
        { error: 'Contract cannot be edited after freelancer has signed' },
        { status: 403 }
      );
    }

    // Update contract
    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update({
        title,
        description,
        total_amount,
        deadline,
        payment_type,
        edited_by: user.id,
        last_edited_at: new Date().toISOString(),
      })
      .eq('id', contractId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Update milestones if payment type is milestone-based
    if (payment_type === 'milestone' && milestones && milestones.length > 0) {
      // Delete existing milestones
      await supabase
        .from('contract_milestones')
        .delete()
        .eq('contract_id', contractId);

      // Insert new milestones
      interface MilestoneInput {
        title: string;
        description: string;
        amount: number;
        deadline: string;
      }
      
      const milestonesToInsert = (milestones as MilestoneInput[]).map((milestone, index: number) => ({
        contract_id: contractId,
        title: milestone.title,
        description: milestone.description,
        amount: milestone.amount,
        deadline: milestone.deadline,
        order: index + 1,
      }));

      const { error: milestonesError } = await supabase
        .from('contract_milestones')
        .insert(milestonesToInsert);

      if (milestonesError) {
        throw milestonesError;
      }
    }

    // Record in history (trigger will handle this, but we'll add a manual entry for notification)
    await supabase
      .from('contract_history')
      .insert({
        contract_id: contractId,
        edited_by: user.id,
        change_type: 'edited',
        change_summary: 'Contract details updated by client',
        previous_data: {
          title: contract.title,
          description: contract.description,
          total_amount: contract.total_amount,
          deadline: contract.deadline,
          payment_type: contract.payment_type,
        },
        new_data: {
          title,
          description,
          total_amount,
          deadline,
          payment_type,
        },
      })
      .select()
      .single();

    // Get freelancer profile to send notification
    const { data: freelancerData } = await supabase
      .from('freelancers')
      .select('profile_id')
      .eq('id', contract.freelancer_id)
      .single();

    if (freelancerData) {
      // Send notification to freelancer
      await supabase.from('notifications').insert({
        user_id: freelancerData.profile_id,
        type: 'contract_edited',
        title: 'Contract Updated',
        message: `The contract "${title}" has been edited by the client. Please review the changes.`,
        data: {
          contract_id: contractId,
          job_title: title,
          edited_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      contract: updatedContract,
      message: 'Contract updated successfully',
    });
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    );
  }
}

// Get contract edit history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractId = params.id;

    // Get contract history
    const { data: history, error: historyError } = await supabase
      .from('contract_history')
      .select(`
        *,
        edited_by_profile:profiles!contract_history_edited_by_fkey (
          full_name,
          avatar_url
        )
      `)
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });

    if (historyError) {
      throw historyError;
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching contract history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract history' },
      { status: 500 }
    );
  }
}
