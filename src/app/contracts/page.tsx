'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  DollarSign,
  Calendar,
  User,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface Contract {
  id: string;
  title: string;
  description: string;
  contract_type: 'fixed_price' | 'hourly' | 'milestone';
  total_amount: number;
  hourly_rate?: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  created_at: string;
  client_signed_at?: string;
  freelancer_signed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  client: {
    id: string;
    profile_id: string;
    profiles: {
      full_name: string;
      avatar_url?: string;
    };
  };
  freelancer: {
    id: string;
    profile_id: string;
    profiles: {
      full_name: string;
      avatar_url?: string;
    };
  };
  jobs?: {
    title: string;
    category: string;
  };
  milestones?: Array<{
    id: string;
    title: string;
    amount: number;
    status: string;
  }>;
}

export default function ContractsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<'client' | 'freelancer' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');  
      return;
    }
    fetchContracts();
  }, [user, router]);

  useEffect(() => {
    filterContracts();
  }, [contracts, selectedStatus, searchTerm]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/contracts', {
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 403) {
          setError('profile_incomplete');
          setContracts([]);
          return;
        }
        throw new Error(data.error || 'Failed to fetch contracts');
      }

      setContracts(data.contracts || []);

      // Determine user role based on contracts
      if (data.contracts?.length > 0) {
        const firstContract = data.contracts[0];
        // Check if user is client or freelancer by comparing IDs
        // This is a simple check - you might need to adjust based on your data structure
        setUserRole(firstContract.client?.id ? 'client' : 'freelancer');
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to load contracts');
      setError('fetch_failed');
    } finally {
      setLoading(false);
    }
  };

  const filterContracts = () => {
    let filtered = contracts;

    // Filter by status
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'active') {
        filtered = filtered.filter(c => ['active', 'pending_completion'].includes(c.status));
      } else if (selectedStatus === 'completed') {
        filtered = filtered.filter(c => ['approved', 'completed'].includes(c.status));
      } else {
        filtered = filtered.filter(c => c.status === selectedStatus);
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.client.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.freelancer.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredContracts(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'work_submitted':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'approved':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'active':
        return <TrendingUp className="h-4 w-4" />;
      case 'work_submitted':
        return <FileText className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const statusCounts = {
    all: contracts.length,
    pending: contracts.filter(c => c.status === 'pending').length,
    active: contracts.filter(c => ['active', 'pending_completion'].includes(c.status)).length,
    completed: contracts.filter(c => ['approved', 'completed'].includes(c.status)).length,
    cancelled: contracts.filter(c => c.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  // Show profile incomplete message
  if (error === 'profile_incomplete') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
            <p className="text-gray-600 mb-6">
              You need to complete your profile as either a client or freelancer before you can view contracts.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/profile')}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold"
              >
                Complete Profile
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                My Contracts
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your {userRole === 'client' ? 'hired projects' : 'freelance work'}
              </p>
            </div>
            {userRole === 'client' && (
              <button
                onClick={() => router.push('/client/contracts/create')}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold shadow-sm"
              >
                Create Contract
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Contracts</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
              </div>
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.active}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{statusCounts.completed}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contracts, clients, or freelancers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 overflow-x-auto">
              {[
                { value: 'all', label: 'All', count: statusCounts.all },
                { value: 'pending', label: 'Pending', count: statusCounts.pending },
                { value: 'active', label: 'Active', count: statusCounts.active },
                { value: 'completed', label: 'Completed', count: statusCounts.completed },
                { value: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSelectedStatus(tab.value)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
                    selectedStatus === tab.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contracts List */}
        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No contracts found</h3>
            <p className="text-gray-600 mb-6">
              {selectedStatus === 'all'
                ? "You don't have any contracts yet."
                : `No ${selectedStatus} contracts found.`}
            </p>
            {userRole === 'client' && selectedStatus === 'all' && (
              <button
                onClick={() => router.push('/jobs')}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Browse Freelancers
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">
                          {contract.title}
                        </h3>
                        {contract.jobs && (
                          <p className="text-sm text-gray-600 mb-2 truncate">
                            Project: {contract.jobs.title}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2 break-words overflow-hidden">
                          {contract.description}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(contract.status)}`}>
                        {getStatusIcon(contract.status)}
                        {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {/* Amount */}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-600">Amount</p>
                      <p className="font-semibold text-gray-900">
                        ${contract.total_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-600">Type</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {contract.contract_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Party */}
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-600">
                        {userRole === 'client' ? 'Freelancer' : 'Client'}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {userRole === 'client'
                          ? contract.freelancer.profiles.full_name
                          : contract.client.profiles.full_name}
                      </p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-600">Created</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(contract.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Signature Status */}
                <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${contract.client_signed_at ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-600">
                      Client {contract.client_signed_at ? 'signed' : 'pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${contract.freelancer_signed_at ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-600">
                      Freelancer {contract.freelancer_signed_at ? 'signed' : 'pending'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push(`/contracts/${contract.id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>

                  {contract.status === 'pending' && (
                    <span className="text-sm text-yellow-600 font-medium">
                      Awaiting signature
                    </span>
                  )}
                  {contract.status === 'active' && (
                    <span className="text-sm text-green-600 font-medium">
                      Work in progress
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
