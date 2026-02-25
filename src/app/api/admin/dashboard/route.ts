import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/dashboard - Get dashboard overview
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, admin_level')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get at-risk contracts
    const { data: atRiskContracts, error: riskError } = await supabase
      .from('admin_at_risk_contracts')
      .select('*')
      .limit(50);

    // Get payment issues
    const { data: paymentIssues, error: paymentError } = await supabase
      .from('admin_payment_issues')
      .select('*')
      .limit(50);

    // Get active disputes
    const { data: activeDisputes, error: disputeError } = await supabase
      .from('contract_disputes')
      .select(`
        *,
        contract:contract_id(title, total_amount),
        opener:opened_by(full_name, email),
        admin:admin_assigned(full_name)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    // Get monitoring stats
    const { data: monitoringStats, error: statsError } = await supabase
      .from('contract_monitoring')
      .select('risk_level, status, issue_type')
      .eq('status', 'active');

    // Get user stats
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'active');

    const { count: suspendedUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'suspended');

    const { count: freelancers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'freelancer');

    const { count: clients } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client');

    // Get contracts stats
    const { count: totalContracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });

    const [
      { count: activeCount },
      { count: pendingCompletionCount },
      { count: workSubmittedCount },
      { count: approvedCount },
      { count: completedCount },
      { count: paidCount },
      { count: cancelledContracts }
    ] = await Promise.all([
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'pending_completion'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'work_submitted'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'cancelled')
    ]);

    const activeContracts = (activeCount || 0) + (pendingCompletionCount || 0) + (workSubmittedCount || 0);
    const completedContracts = (approvedCount || 0) + (completedCount || 0) + (paidCount || 0);

    // Get payment stats from transactions
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('amount, status, type');

    const totalVolume = allTransactions?.filter(t => t.type === 'escrow_deposit' || t.type === 'deposit').reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
    const pendingPayments = allTransactions?.filter(t => t.status === 'pending').reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

    // Get disputes stats
    const { count: openDisputes } = await supabase
      .from('contract_disputes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    const { count: resolvedDisputes } = await supabase
      .from('contract_disputes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved');

    // Get date-based stats
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count: newUsersThisMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);

    const { count: contractsCreatedToday } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday);

    const { data: paymentsToday } = await supabase
      .from('transactions')
      .select('amount')
      .gte('created_at', startOfToday)
      .in('status', ['completed', 'released']);

    const paymentsProcessedToday = paymentsToday?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

    const { count: messagesExchangedToday } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday);

    const { data: completedPaymentsThisMonth } = await supabase
      .from('transactions')
      .select('amount')
      .gte('created_at', startOfMonth)
      .in('status', ['completed', 'released']);

    const completedVolumeThisMonth = completedPaymentsThisMonth?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

    // Calculate summary statistics with enhanced stats
    const stats = {
      // Legacy stats for backward compatibility
      totalAtRisk: atRiskContracts?.length || 0,
      criticalIssues: monitoringStats?.filter(m => m.risk_level === 'CRITICAL').length || 0,
      highRiskIssues: monitoringStats?.filter(m => m.risk_level === 'HIGH').length || 0,
      paymentDelays: paymentIssues?.length || 0,
      activeDisputes: activeDisputes?.length || 0,
      issueBreakdown: {
        abandonedWork: monitoringStats?.filter(m => m.issue_type === 'abandoned_work').length || 0,
        paymentDelay: monitoringStats?.filter(m => m.issue_type === 'payment_delay').length || 0,
        noActivity: monitoringStats?.filter(m => m.issue_type === 'no_activity').length || 0,
        disputes: monitoringStats?.filter(m => m.issue_type === 'dispute').length || 0,
      },
      // Enhanced stats
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
        suspended: suspendedUsers || 0,
        newThisMonth: newUsersThisMonth || 0,
        freelancers: freelancers || 0,
        clients: clients || 0,
      },
      contracts: {
        total: totalContracts || 0,
        active: activeContracts || 0,
        completed: completedContracts || 0,
        cancelled: cancelledContracts || 0,
        atRisk: atRiskContracts?.length || 0,
      },
      payments: {
        totalVolume: totalVolume,
        pendingPayments: pendingPayments,
        completedThisMonth: completedVolumeThisMonth,
        averageContractValue: totalContracts ? Math.round(totalVolume / totalContracts) : 0,
        escrowBalance: pendingPayments,
      },
      disputes: {
        total: (openDisputes || 0) + (resolvedDisputes || 0),
        open: openDisputes || 0,
        resolved: resolvedDisputes || 0,
        pending: openDisputes || 0,
      },
      activity: {
        activeUsersToday: activeUsers || 0, // Using active users as proxy
        contractsCreatedToday: contractsCreatedToday || 0,
        paymentsProcessedToday: paymentsProcessedToday,
        messagesExchangedToday: messagesExchangedToday || 0,
      },
    };

    return NextResponse.json({
      stats,
      atRiskContracts: atRiskContracts || [],
      paymentIssues: paymentIssues || [],
      activeDisputes: activeDisputes || [],
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
