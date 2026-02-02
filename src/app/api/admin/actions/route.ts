import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, getContractWarningEmail } from '@/lib/emailaa';

// POST /api/admin/actions - Execute admin action
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

    // Check admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, admin_level')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      contract_id,
      action_type,
      target_user_id,
      notes,
      details
    } = body;

    let outcome = 'completed';
    let actionResult: any = {};

    switch (action_type) {
      case 'contact_user':
        // Send email to user
        try {
          const { data: targetUser } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', target_user_id)
            .single();

          if (targetUser) {
            const email = getContractWarningEmail(
              targetUser.full_name,
              targetUser.email,
              details.subject,
              details.message,
              contract_id
            );
            await sendEmail(email);
            actionResult.email_sent = true;
          }
        } catch (emailError) {
          console.error('Email error:', emailError);
          outcome = 'partial';
          actionResult.email_sent = false;
        }
        break;

      case 'freeze_escrow':
        // Update contract to freeze escrow
        await supabase
          .from('contracts')
          .update({
            status: 'escrow_frozen',
            updated_at: new Date().toISOString()
          })
          .eq('id', contract_id);
        actionResult.escrow_frozen = true;
        break;

      case 'release_payment':
        // Release milestone payment
        if (details.milestone_id) {
          await supabase
            .from('contract_milestones')
            .update({
              payment_status: 'released',
              approved_at: new Date().toISOString()
            })
            .eq('id', details.milestone_id);
          actionResult.payment_released = true;
        }
        break;

      case 'suspend_account':
        // Suspend user account
        await supabase
          .from('profiles')
          .update({
            account_status: 'suspended',
            suspension_reason: notes,
            suspension_until: details.suspension_until
          })
          .eq('id', target_user_id);

        // Log violation
        await supabase
          .from('violation_history')
          .insert({
            user_id: target_user_id,
            user_type: details.user_type,
            violation_type: details.violation_type,
            contract_id,
            severity: 'HIGH',
            penalty_applied: 'account_suspended',
            description: notes
          });
        actionResult.account_suspended = true;
        break;

      case 'cancel_contract':
        // Cancel contract and refund client
        await supabase
          .from('contracts')
          .update({
            status: 'cancelled',
            cancellation_reason: notes,
            cancelled_at: new Date().toISOString()
          })
          .eq('id', contract_id);
        actionResult.contract_cancelled = true;
        break;

      case 'mediate_dispute':
        // Update dispute status
        if (details.dispute_id) {
          await supabase
            .from('contract_disputes')
            .update({
              status: 'under_review',
              admin_assigned: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', details.dispute_id);
          actionResult.dispute_assigned = true;
        }
        break;

      case 'issue_warning':
        // Log violation warning
        await supabase
          .from('violation_history')
          .insert({
            user_id: target_user_id,
            user_type: details.user_type,
            violation_type: details.violation_type,
            contract_id,
            severity: 'MEDIUM',
            penalty_applied: 'warning',
            description: notes
          });

        // Decrease trust score
        await supabase.rpc('decrement_trust_score', {
          user_uuid: target_user_id,
          amount: 10
        });
        actionResult.warning_issued = true;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action type' },
          { status: 400 }
        );
    }

    // Log the action
    const { data: action, error: actionError } = await supabase
      .from('admin_actions')
      .insert({
        contract_id,
        admin_id: user.id,
        action_type,
        action_details: { ...details, ...actionResult },
        notes,
        outcome
      })
      .select()
      .single();

    if (actionError) {
      console.error('Error logging action:', actionError);
    }

    return NextResponse.json({
      success: true,
      action,
      result: actionResult
    });
  } catch (error: any) {
    console.error('Error executing admin action:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/actions - Get action history
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

    // Check admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contract_id');
    const adminId = searchParams.get('admin_id');

    let query = supabase
      .from('admin_actions')
      .select(`
        *,
        admin:admin_id(full_name, email),
        contract:contract_id(title)
      `)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (contractId) {
      query = query.eq('contract_id', contractId);
    }

    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    const { data: actions, error } = await query;

    if (error) {
      console.error('Error fetching actions:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ actions });
  } catch (error: any) {
    console.error('Error in actions endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
