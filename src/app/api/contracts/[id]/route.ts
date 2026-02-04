import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailNotifications } from '@/lib/notificationEmails';

// GET /api/contracts/[id] - Get single contract
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

        const { data: contract, error } = await supabase
      .from('contracts')
      .select(`
        *,
        jobs:job_id (
          id,
          title,
          description,
          category,
          skills
        ),
        client:client_id (
          id,
          profile_id,
          profiles!clients_profile_id_fkey (
            full_name,
            avatar_url,
            email
          )
        ),
        freelancer:freelancer_id (
          id,
          profile_id,
          profiles!freelancers_profile_id_fkey (
            full_name,
            avatar_url,
            email
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Get client and freelancer IDs to verify access
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    const { data: freelancerData } = await supabase
      .from('freelancers')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    const isClient = clientData && contract.client_id === clientData.id;
    const isFreelancer = freelancerData && contract.freelancer_id === freelancerData.id;

    // Verify user is part of the contract
    if (!isClient && !isFreelancer) {
      return NextResponse.json(
        { error: 'Unauthorized to view this contract' },
        { status: 403 }
      );
    }

    // Get milestones if any
    const { data: milestones } = await supabase
      .from('contract_milestones')
      .select('*')
      .eq('contract_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ 
      contract: {
        ...contract,
        milestones: milestones || []
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch contract';
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PATCH /api/contracts/[id] - Update contract (sign, update status)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { action, signature, status, cancellation_reason } = body;

    // Get the contract
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('*, client:client_id(id, full_name, profile_id), freelancer:freelancer_id(id, full_name, profile_id)')
      .eq('id', id)
      .single();

    if (fetchError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Get client and freelancer IDs to verify access
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    const { data: freelancerData } = await supabase
      .from('freelancers')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    const isClient = clientData && contract.client_id === clientData.id;
    const isFreelancer = freelancerData && contract.freelancer_id === freelancerData.id;

    // Verify user is part of the contract
    if (!isClient && !isFreelancer) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Handle signing
    if (action === 'sign') {
      if (isClient) {
        updateData.client_signed_at = new Date().toISOString();
        updateData.client_signature = signature || `Signed by ${contract.client.full_name}`;
      } else if (isFreelancer) {
        updateData.freelancer_signed_at = new Date().toISOString();
        updateData.freelancer_signature = signature || `Signed by ${contract.freelancer.full_name}`;
        
        // If both parties have signed, activate the contract
        if (contract.client_signed_at) {
          updateData.status = 'active';
        }
      }

      const { data: updatedContract, error: updateError } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error signing contract:', updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      // Send notification to the other party
      const recipientProfileId = isClient ? contract.freelancer.profile_id : contract.client.profile_id;
      const signerName = isClient ? contract.client.full_name : contract.freelancer.full_name;
      
      // If contract is now active, notify both parties
      if (updatedContract.status === 'active') {
        // Notify client
        await supabase.from('notifications').insert({
          user_id: contract.client.profile_id,
          type: 'contract_active',
          title: 'Contract Activated! ✅',
          message: `The contract "${contract.title}" is now active. Work can begin!`,
          link: `/contracts/${id}`,
          read: false,
        });

        // Notify freelancer
        await supabase.from('notifications').insert({
          user_id: contract.freelancer.profile_id,
          type: 'contract_active',
          title: 'Contract Activated! ✅',
          message: `The contract "${contract.title}" is now active. You can start working!`,
          link: `/contracts/${id}`,
          read: false,
        });
      } else {
        // Just notify about the signature
        await supabase.from('notifications').insert({
          user_id: recipientProfileId,
          type: 'contract_signed',
          title: 'Contract Signed 📝',
          message: `${signerName} has signed the contract "${contract.title}". Please sign to activate.`,
          link: `/contracts/${id}`,
          read: false,
        });
      }

      return NextResponse.json({ 
        success: true, 
        contract: updatedContract,
        message: updatedContract.status === 'active' 
          ? 'Contract activated! Work can begin.' 
          : 'Contract signed successfully!'
      });
    }

    // Handle status updates
    if (status) {
      updateData.status = status;
      
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancellation_reason = cancellation_reason || 'Contract cancelled';
      }

      const { data: updatedContract, error: updateError } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating contract:', updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      // Notify both parties
      const recipientProfileId = isClient ? contract.freelancer.profile_id : contract.client.profile_id;
      const notificationMessage = status === 'completed'
        ? `The contract "${contract.title}" has been marked as completed.`
        : status === 'cancelled'
        ? `The contract "${contract.title}" has been cancelled.`
        : `The contract "${contract.title}" status has been updated.`;

      await supabase.from('notifications').insert({
        user_id: recipientProfileId,
        type: `contract_${status}`,
        title: `Contract ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: notificationMessage,
        link: `/contracts/${id}`,
        read: false,
      });

      // Send email notification for contract cancellation (freelancer gets notified)
      if (status === 'cancelled' && isClient) {
        try {
          const { data: freelancerProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', contract.freelancer.profile_id)
            .single();

          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', contract.client.profile_id)
            .single();

          if (freelancerProfile && clientProfile) {
            // Get payment information if any milestones were completed
            const { data: paidMilestones } = await supabase
              .from('contract_milestones')
              .select('freelancer_net_amount')
              .eq('contract_id', id)
              .eq('status', 'paid');

            const totalPaid = paidMilestones?.reduce((sum, m) => sum + (m.freelancer_net_amount || 0), 0) || 0;

            await EmailNotifications.send(
              EmailNotifications.projectCancelled(
                freelancerProfile.full_name || 'Freelancer',
                freelancerProfile.email,
                clientProfile.full_name || 'Client',
                contract.title,
                contract.id,
                cancellation_reason || 'No reason provided',
                totalPaid > 0,
                totalPaid
              )
            );
            console.log('📧 Project cancellation email sent to freelancer:', freelancerProfile.email);
          }
        } catch (emailError) {
          console.error('⚠️ Failed to send project cancellation email:', emailError);
        }
      }

      return NextResponse.json({ 
        success: true, 
        contract: updatedContract,
        message: `Contract ${status} successfully!`
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update contract';
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
