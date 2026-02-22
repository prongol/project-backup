import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { EmailNotifications } from '@/lib/notificationEmails';
import { notifyContractSigned } from '@/lib/notifications';

// POST /api/contracts/[id]/sign - Sign a contract
export async function POST(
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
    const body = await request.json();
    const { role } = body;

    if (!role || !['client', 'freelancer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be either "client" or "freelancer"' },
        { status: 400 }
      );
    }

    // Get the contract
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        client:client_id (
          id,
          profile_id
        ),
        freelancer:freelancer_id (
          id,
          profile_id
        )
      `)
      .eq('id', id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Safely extract joined records
    const freelancer = Array.isArray(contract.freelancer) ? contract.freelancer[0] : contract.freelancer;
    const client = Array.isArray(contract.client) ? contract.client[0] : contract.client;

    // Verify user is part of the contract
    const isClient = role === 'client' && client?.profile_id === user.id;
    const isFreelancer = role === 'freelancer' && freelancer?.profile_id === user.id;

    if (!isClient && !isFreelancer) {
      console.error('Unauthorized sign attempt:', { 
        role, 
        clientProfileId: client?.profile_id, 
        freelancerProfileId: freelancer?.profile_id,
        userId: user.id 
      });
      return NextResponse.json(
        { error: 'Unauthorized to sign this contract' },
        { status: 403 }
      );
    }

    // Check if already signed
    if (role === 'client' && contract.client_signed_at) {
      return NextResponse.json(
        { error: 'Contract already signed by client' },
        { status: 400 }
      );
    }

    if (role === 'freelancer' && contract.freelancer_signed_at) {
      return NextResponse.json(
        { error: 'Contract already signed by freelancer' },
        { status: 400 }
      );
    }

    // Check if contract is in correct status
    if (contract.status !== 'pending') {
      return NextResponse.json(
        { error: 'Contract must be in pending status to sign' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updateData: {
      client_signed_at?: string;
      freelancer_signed_at?: string;
      status?: string;
    } = {};

    if (role === 'client') {
      updateData.client_signed_at = now;
    } else {
      updateData.freelancer_signed_at = now;
    }

    // Check if both parties have signed (or will have after this signature)
    const bothSigned = 
      (role === 'client' && contract.freelancer_signed_at) ||
      (role === 'freelancer' && contract.client_signed_at);

    // If both parties have signed, update status to active
    if (bothSigned) {
      // REQUIREMENT: Escrow must be funded before contract becomes active
      // Use admin client to bypass RLS issues that might hide the escrow record
      const adminSupabase = createAdminClient();
      const { data: escrowAccount, error: escrowCheckError } = await adminSupabase
        .from('escrow_accounts')
        .select('status')
        .eq('contract_id', id)
        .eq('status', 'held')
        .maybeSingle();

      if (escrowCheckError) {
        console.error('Escrow check error:', escrowCheckError);
      }

      if (!escrowAccount) {
        return NextResponse.json(
          { 
            error: 'Escrow not funded', 
            message: 'The contract cannot be activated until funds are secured in escrow. Please secure the funds using the Stripe payment modal first.' 
          },
          { status: 400 }
        );
      }

      updateData.status = 'active';
    }

    // Update the contract
    const { error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error signing contract:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Create notification for the other party
    const otherPartyId = role === 'client' 
      ? freelancer?.profile_id 
      : client?.profile_id;

    // Use the notification library function
    await notifyContractSigned({
      recipientProfileId: otherPartyId,
      contractTitle: contract.title,
      contractId: id,
      signerRole: role,
      bothSigned
    });

    // Send email notification when freelancer signs (client gets notified)
    if (role === 'freelancer' && bothSigned) {
      try {
        const { data: clientProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', client?.profile_id)
          .single();

        const { data: freelancerProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', freelancer?.profile_id)
          .single();

        if (clientProfile && freelancerProfile) {
          const startDate = contract.start_date 
            ? new Date(contract.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

          await EmailNotifications.send(
            EmailNotifications.freelancerSignedContract(
              clientProfile.full_name || 'Client',
              clientProfile.email,
              freelancerProfile.full_name || 'Freelancer',
              contract.title,
              contract.id,
              contract.total_amount,
              startDate
            )
          );
          console.log('📧 Contract signed email sent to client:', clientProfile.email);
        }
      } catch (emailError) {
        console.error('⚠️ Failed to send contract signed email:', emailError);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: bothSigned 
        ? 'Contract signed and activated successfully!'
        : 'Contract signed successfully. Waiting for other party to sign.',
      bothSigned
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign contract';
    console.error('Error signing contract:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
