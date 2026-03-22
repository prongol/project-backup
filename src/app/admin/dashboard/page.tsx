'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { 
  Users,
  DollarSign,
  FileText,
  Activity,
  Eye,
  Ban,
  UserCheck,
  BarChart3,
  Shield,
  Clock,
  Search,
  Download,
  Trash2,
  RefreshCw,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminStats {
  users: {
    total: number;
    active: number;
    suspended: number;
    newThisMonth: number;
    freelancers: number;
    clients: number;
  };
  contracts: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    atRisk: number;
  };
  payments: {
    totalVolume: number;
    pendingPayments: number;
    completedThisMonth: number;
    averageContractValue: number;
    escrowBalance: number;
  };
  disputes: {
    total: number;
    open: number;
    resolved: number;
    pending: number;
  };
  activity: {
    activeUsersToday: number;
    contractsCreatedToday: number;
    paymentsProcessedToday: number;
    messagesExchangedToday: number;
  };
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'client' | 'freelancer';
  created_at: string;
  account_status: string;
  trust_score: number;
  is_admin: boolean;
}

interface Payment {
  id: string;
  contract_id: string;
  contract_title: string;
  amount: number;
  platform_fee: number;
  freelancer_amount: number;
  status: string;
  contract_status: string;
  stripe_payment_intent_id: string | null;
  auto_release_at: string | null;
  released_at: string | null;
  paid_at: string | null;
  created_at: string;
  client_name: string;
  freelancer_name: string;
}

interface Contract {
  id: string;
  title: string;
  status: string;
  total_amount: number;
  client_name: string;
  freelancer_name: string;
  created_at: string;
  health_status: string;
  payment_status: string;
  stripe_payment_intent_id: string | null;
  auto_release_at: string | null;
}

interface Dispute {
  id: string;
  dispute_type: string;
  reason: string;
  amount_disputed: number | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolution_type: string | null;
  resolution_details: string | null;
  contract_id: string;
  contract_title: string;
  contract_amount: number;
  opened_by_name: string;
  opened_by_email: string;
  opened_by_role: string;
  admin_name: string | null;
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [selectedSection, setSelectedSection] = useState<'overview' | 'users' | 'contracts' | 'payments' | 'disputes' | 'activity'>('overview');
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Prevent re-initialization on re-renders
  const initialized = useRef(false);
  const accessChecked = useRef(false);

  interface Activity {
    id: string;
    timestamp: string;
    created_at: string;
    action_taken?: string;
    description?: string;
    type: string;
  }

  useEffect(() => {
    // Only run access check once
    if (accessChecked.current) return;
    
    // Wait for auth to finish loading AND initializing before checking
    if (authLoading || !isInitialized) {
      console.log('🔄 Admin Dashboard: Waiting for auth to initialize...', { authLoading, isInitialized });
      return;
    }
    
    console.log('🔍 Admin Dashboard: Checking auth state...', { user: user?.email, isAdmin: user?.is_admin });
    
    if (!user) {
      console.log('❌ Admin Dashboard: No user, redirecting to login');
      router.push('/login');
      return;
    }

    if (!user.is_admin) {
      console.log('❌ Admin Dashboard: User not admin, redirecting to dashboard');
      toast.error('Admin access required');
      router.push('/dashboard');
      return;
    }

    console.log('✅ Admin Dashboard: Access granted, fetching data...');
    accessChecked.current = true;
    
    // Fetch data only once after access is verified
    if (!initialized.current) {
      fetchDashboardData();
      initialized.current = true;
    }
  }, [user, authLoading, isInitialized, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard');
      
      if (!response.ok) throw new Error('Failed to fetch data');

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/admin/payments');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/admin/contracts');
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/admin/activities');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchDisputes = async () => {
    try {
      const response = await fetch('/api/admin/disputes');
      if (response.ok) {
        const data = await response.json();
        setDisputes(data.disputes || []);
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
    }
  };

  useEffect(() => {
    if (selectedSection === 'users') fetchUsers();
    else if (selectedSection === 'payments') fetchPayments();
    else if (selectedSection === 'contracts') fetchContracts();
    else if (selectedSection === 'activity') fetchActivities();
    else if (selectedSection === 'disputes') fetchDisputes();
  }, [selectedSection]);

  // User Management Actions
  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin suspension' })
      });
      
      if (response.ok) {
        toast.success('User suspended successfully');
        fetchUsers();
      } else {
        toast.error('Failed to suspend user');
      }
    } catch (error) {
      toast.error('Error suspending user');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast.success('User activated successfully');
        fetchUsers();
      } else {
        toast.error('Failed to activate user');
      }
    } catch (error) {
      toast.error('Error activating user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure? This action cannot be undone!')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  // Payment Actions
  const handleApprovePayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast.success('Payment approved');
        fetchPayments();
      } else {
        toast.error('Failed to approve payment');
      }
    } catch (error) {
      toast.error('Error approving payment');
    }
  };

  const handleRefundPayment = async (paymentId: string) => {
    if (!confirm('Confirm refund? This will return funds to the client.')) return;
    
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/refund`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast.success('Payment refunded');
        fetchPayments();
      } else {
        toast.error('Failed to refund payment');
      }
    } catch (error) {
      toast.error('Error refunding payment');
    }
  };

  const handleHoldFunds = async (contractId: string) => {
    const reason = prompt('Reason for holding funds (optional):') ?? 'Admin hold — under review';
    try {
      const response = await fetch(`/api/admin/payments/${contractId}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        toast.success('Funds withheld — auto-release paused');
        fetchPayments();
      } else {
        const d = await response.json();
        toast.error(d.error || 'Failed to hold funds');
      }
    } catch {
      toast.error('Error withholding funds');
    }
  };

  const handleReleaseFunds = async (contractId: string, freelancerName: string) => {
    if (!confirm(`Release funds immediately to ${freelancerName}? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/payments/${contractId}/release`, {
        method: 'POST',
      });
      if (response.ok) {
        toast.success('Funds released successfully');
        fetchPayments();
      } else {
        const d = await response.json();
        toast.error(d.error || 'Failed to release funds');
      }
    } catch {
      toast.error('Error releasing funds');
    }
  };

  const handleResolveDispute = async (disputeId: string, status: string) => {
    const resolution = status === 'resolved' ? prompt('Resolution details:') : null;
    try {
      const response = await fetch('/api/admin/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispute_id: disputeId, status, resolution_details: resolution }),
      });
      if (response.ok) {
        toast.success(`Dispute marked as ${status}`);
        fetchDisputes();
      } else {
        toast.error('Failed to update dispute');
      }
    } catch {
      toast.error('Error updating dispute');
    }
  };

  // Contract Actions
  const handleCancelContract = async (contractId: string) => {
    if (!confirm('Cancel this contract? This will refund any escrowed funds.')) return;
    
    try {
      const response = await fetch(`/api/admin/contracts/${contractId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin cancellation' })
      });
      
      if (response.ok) {
        toast.success('Contract cancelled');
        fetchContracts();
      } else {
        toast.error('Failed to cancel contract');
      }
    } catch (error) {
      toast.error('Error cancelling contract');
    }
  };

  const handleExportData = (type: string) => {
    toast.success(`Exporting ${type} data...`);
    // Implement CSV export logic here
  };

  if (loading || authLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!isInitialized ? 'Initializing...' : authLoading ? 'Checking authentication...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                Super Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">Platform Control Center</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'contracts', label: 'Contracts', icon: FileText },
              { id: 'payments', label: 'Payments', icon: DollarSign },
              { id: 'disputes', label: 'Disputes', icon: XCircle },
              { id: 'activity', label: 'Activity Logs', icon: Activity }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedSection(id as 'overview' | 'users' | 'contracts' | 'payments' | 'disputes' | 'activity')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap ${
                  selectedSection === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedSection === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* User Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.users.total || 0}</p>
                    <p className="text-xs text-green-600 mt-1">+{stats?.users.newThisMonth || 0} this month</p>
                  </div>
                  <Users className="h-10 w-10 text-blue-600" />
                </div>
                <div className="mt-4 flex gap-4 text-xs">
                  <span className="text-gray-600">Active: {stats?.users.active || 0}</span>
                  <span className="text-gray-600">Suspended: {stats?.users.suspended || 0}</span>
                </div>
              </div>

              {/* Contract Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Contracts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.contracts.active || 0}</p>
                    <p className="text-xs text-red-600 mt-1">{stats?.contracts.atRisk || 0} at risk</p>
                  </div>
                  <FileText className="h-10 w-10 text-green-600" />
                </div>
                <div className="mt-4 flex gap-4 text-xs">
                  <span className="text-gray-600">Total: {stats?.contracts.total || 0}</span>
                  <span className="text-gray-600">Completed: {stats?.contracts.completed || 0}</span>
                </div>
              </div>

              {/* Payment Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Volume</p>
                    <p className="text-2xl font-bold text-gray-900">${(stats?.payments.totalVolume || 0).toLocaleString()}</p>
                    <p className="text-xs text-orange-600 mt-1">${stats?.payments.pendingPayments || 0} pending</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-green-600" />
                </div>
                <div className="mt-4 text-xs text-gray-600">
                  Avg: ${stats?.payments.averageContractValue || 0}
                </div>
              </div>

              {/* Activity Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Today</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.activity.activeUsersToday || 0}</p>
                    <p className="text-xs text-blue-600 mt-1">{stats?.activity.contractsCreatedToday || 0} contracts created</p>
                  </div>
                  <Activity className="h-10 w-10 text-purple-600" />
                </div>
                <div className="mt-4 text-xs text-gray-600">
                  {stats?.activity.paymentsProcessedToday || 0} payments
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setSelectedSection('users')}
                  className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-center"
                >
                  <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium">Manage Users</p>
                </button>
                <button
                  onClick={() => setSelectedSection('contracts')}
                  className="p-4 border border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 text-center"
                >
                  <FileText className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-medium">View Contracts</p>
                </button>
                <button
                  onClick={() => setSelectedSection('payments')}
                  className="p-4 border border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 text-center"
                >
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                  <p className="text-sm font-medium">Manage Payments</p>
                </button>
                <button
                  onClick={() => setSelectedSection('activity')}
                  className="p-4 border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 text-center"
                >
                  <Activity className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm font-medium">Activity Logs</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">User Management</h2>
                <button
                  onClick={() => handleExportData('users')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>

              {/* Search */}
              <div className="mb-4 flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trust Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.filter(u =>
                      !u.is_admin &&
                      (filterStatus === 'all' || u.account_status === filterStatus) &&
                      (searchTerm === '' || u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    ).map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'freelancer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.account_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.account_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{user.trust_score || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {user.account_status === 'active' ? (
                              <button
                                onClick={() => handleSuspendUser(user.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Suspend"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(user.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Activate"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'contracts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Contract Management</h2>
                <button
                  onClick={() => handleExportData('contracts')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>

              {contracts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No contracts found</p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Freelancer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {contracts.map((contract) => (
                      <tr key={contract.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{contract.title}</p>
                          <p className="text-xs text-gray-500">{new Date(contract.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">{contract.client_name}</td>
                        <td className="px-4 py-3 text-sm">{contract.freelancer_name}</td>
                        <td className="px-4 py-3 font-medium">${(contract.total_amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            contract.status === 'active' ? 'bg-green-100 text-green-800' :
                            contract.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            contract.status === 'disputed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {contract.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            contract.payment_status === 'released' ? 'bg-green-100 text-green-800' :
                            contract.payment_status === 'held' ? 'bg-orange-100 text-orange-800' :
                            contract.payment_status === 'paid' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {contract.payment_status || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            contract.health_status === 'healthy' ? 'bg-green-100 text-green-800' :
                            contract.health_status === 'at_risk' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {contract.health_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/contracts/${contract.id}`)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {contract.status === 'active' && (
                              <button
                                onClick={() => handleCancelContract(contract.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Cancel"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </div>
        )}

        {selectedSection === 'payments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Payment Management</h2>
                <button
                  onClick={() => handleExportData('payments')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No payment records found</p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client → Freelancer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform Fee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auto Release</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">{payment.contract_title}</p>
                          <p className="text-xs text-gray-400">{new Date(payment.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-medium">{payment.client_name}</span>
                          <span className="text-gray-400 mx-1">→</span>
                          <span className="font-medium">{payment.freelancer_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold">${(payment.amount || 0).toLocaleString()}</p>
                          {payment.freelancer_amount > 0 && (
                            <p className="text-xs text-gray-500">Net: ${payment.freelancer_amount.toLocaleString()}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {payment.platform_fee > 0 ? `$${payment.platform_fee.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'released' ? 'bg-green-100 text-green-800' :
                            payment.status === 'held' ? 'bg-orange-100 text-orange-800' :
                            payment.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                            payment.status === 'disputed' ? 'bg-red-100 text-red-800' :
                            payment.status === 'refunded' ? 'bg-purple-100 text-purple-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {payment.auto_release_at
                            ? new Date(payment.auto_release_at).toLocaleDateString()
                            : payment.released_at
                            ? `Released ${new Date(payment.released_at).toLocaleDateString()}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {/* Withold button — available on paid/pending status */}
                            {['paid', 'pending', 'approved'].includes(payment.status) && (
                              <button
                                onClick={() => handleHoldFunds(payment.contract_id)}
                                className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 whitespace-nowrap"
                                title="Pause auto-release and hold funds"
                              >
                                ⏸ Withhold
                              </button>
                            )}
                            {/* Instant Release — available on paid/held/approved */}
                            {['paid', 'held', 'approved', 'pending'].includes(payment.status) && (
                              <button
                                onClick={() => handleReleaseFunds(payment.contract_id, payment.freelancer_name)}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 whitespace-nowrap"
                                title="Immediately release funds to freelancer via Stripe"
                              >
                                ⚡ Release
                              </button>
                            )}
                            {/* Refund — available on released */}
                            {payment.status === 'released' && (
                              <button
                                onClick={() => handleRefundPayment(payment.id)}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              >
                                ↩ Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </div>
        )}

        {selectedSection === 'disputes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Dispute Management</h2>
                <div className="flex gap-2 text-sm">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    Open: {disputes.filter(d => d.status === 'open').length}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    Under Review: {disputes.filter(d => d.status === 'under_review').length}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                    Resolved: {disputes.filter(d => d.status === 'resolved').length}
                  </span>
                </div>
              </div>

              {disputes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No disputes found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {disputes.map((dispute) => (
                    <div key={dispute.id} className={`border rounded-lg p-4 ${
                      dispute.status === 'open' ? 'border-yellow-200 bg-yellow-50' :
                      dispute.status === 'under_review' ? 'border-blue-200 bg-blue-50' :
                      dispute.status === 'resolved' ? 'border-green-200 bg-green-50' :
                      'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              dispute.status === 'open' ? 'bg-yellow-200 text-yellow-900' :
                              dispute.status === 'under_review' ? 'bg-blue-200 text-blue-900' :
                              'bg-green-200 text-green-900'
                            }`}>
                              {dispute.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">
                              {dispute.dispute_type.replace(/_/g, ' ')}
                            </span>
                            {dispute.amount_disputed && (
                              <span className="text-xs text-red-600 font-semibold">
                                ${dispute.amount_disputed.toLocaleString()} disputed
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-gray-900 mb-1">{dispute.contract_title}</p>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{dispute.reason}</p>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>Filed by: <strong>{dispute.opened_by_name}</strong> ({dispute.opened_by_role})</span>
                            <span>{new Date(dispute.created_at).toLocaleDateString()}</span>
                            {dispute.admin_name && <span>Assigned: {dispute.admin_name}</span>}
                          </div>
                          {dispute.resolution_details && (
                            <p className="mt-2 text-sm text-green-700 bg-green-100 rounded p-2">
                              Resolution: {dispute.resolution_details}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                            <>
                              <button
                                onClick={() => router.push(`/disputes/${dispute.id}`)}
                                className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 whitespace-nowrap"
                              >
                                Open Thread →
                              </button>
                              <button
                                onClick={() => handleResolveDispute(dispute.id, 'under_review')}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 whitespace-nowrap"
                              >
                                Mark Under Review
                              </button>
                              <button
                                onClick={() => handleResolveDispute(dispute.id, 'resolved')}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 whitespace-nowrap"
                              >
                                Mark Resolved
                              </button>
                              <button
                                onClick={() => router.push(`/contracts/${dispute.contract_id}`)}
                                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 whitespace-nowrap"
                              >
                                View Contract
                              </button>
                            </>
                          )}
                          {dispute.status === 'resolved' && (
                            <>
                              <button
                                onClick={() => router.push(`/disputes/${dispute.id}`)}
                                className="px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200"
                              >
                                View Thread
                              </button>
                              <button
                                onClick={() => router.push(`/contracts/${dispute.contract_id}`)}
                                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                              >
                                View Contract
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedSection === 'activity' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Activity Logs</h2>
                <button
                  onClick={() => handleExportData('activity')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>

              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description || activity.action_taken}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp || activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
