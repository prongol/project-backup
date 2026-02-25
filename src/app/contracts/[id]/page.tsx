'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  FileText,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Download,
  MessageSquare,
  TrendingUp,
  Briefcase,
  Target,
  Loader2,
  Edit,
  History,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import ContractSignConfirmModal from '@/components/ContractSignConfirmModal';
import ContractEditModal from '@/components/ContractEditModal';
import ContractHistoryView from '@/components/ContractHistoryView';
import { ContractEscrowPayment } from '@/components/stripe/ContractEscrowPayment';

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'paid' | 'rejected';
  completed_at?: string;
  paid_at?: string;
  submission_note?: string;
  rejection_reason?: string;
}

interface Contract {
  id: string;
  title: string;
  description: string;
  contract_type: 'fixed_price' | 'hourly' | 'milestone';
  total_amount: number;
  client_id?: string;
  freelancer_id?: string;
  platform_fee_percentage?: number;
  platform_fee_amount?: number;
  freelancer_net_amount?: number;
  hourly_rate?: number;
  estimated_hours?: number;
  status: 'pending' | 'active' | 'pending_completion' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  created_at: string;
  client_signed_at?: string;
  freelancer_signed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  payment_released_at?: string;
  completion_note?: string;
  rejection_reason?: string;
  approval_note?: string;
  terms?: string;
  deliverables?: string;
  payment_terms?: string;
  payment_type?: string;
  deadline?: string;
  is_editable?: boolean;
  last_edited_at?: string;
  edited_by?: string;
  client: {
    id: string;
    profile_id: string;
    profiles: {
      full_name: string;
      avatar_url?: string;
      email: string;
    };
  };
  freelancer: {
    id: string;
    profile_id: string;
    profiles: {
      full_name: string;
      avatar_url?: string;
      email: string;
    };
  };
  jobs?: {
    id: string;
    title: string;
    description: string;
    category: string;
    skills: string[];
  };
  milestones?: Milestone[];
  escrow_status?: string;
  escrow_funded?: boolean;
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: contractId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [disputeType, setDisputeType] = useState('quality_issue');
  const [disputeReason, setDisputeReason] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [contract, setContract] = useState<Contract | null>(null);
  const [userRole, setUserRole] = useState<'client' | 'freelancer' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New state for confirmation, edit, and history
  const [showSignConfirm, setShowSignConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchContract();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, contractId]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/contracts/${contractId}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contract');
      }

      setContract(data.contract);
      
      // Determine user role
      if (user) {
        // Check if user is client or freelancer by comparing profile IDs
        const isClient = data.contract.client.profile_id === user.id;
        setUserRole(isClient ? 'client' : 'freelancer');
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
      setError(error instanceof Error ? error.message : 'Failed to load contract');
      toast.error('Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signature: string) => {
    if (!contract || !userRole) return;

    try {
      setSigning(true);
      const response = await fetch(`/api/contracts/${contract.id}/sign`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: userRole,
          signature
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign contract');
      }

      toast.success('Contract signed successfully!');
      setShowSignConfirm(false); // Close confirmation modal
      fetchContract(); // Refresh contract data
    } catch (error) {
      console.error('Error signing contract:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sign contract');
    } finally {
      setSigning(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!contract) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/contracts/${contract.id}/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completion_note: completionNote
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit work');
      }

      toast.success('Work submitted for client approval!');
      setShowCompletionModal(false);
      setCompletionNote('');
      fetchContract();
    } catch (error) {
      console.error('Error submitting work:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit work');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveWork = async () => {
    if (!contract) return;

    try {
      setApproving(true);
      const response = await fetch(`/api/contracts/${contract.id}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approval_note: approvalNote,
          rating: rating > 0 ? rating : undefined,
          review: review || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve work');
      }

      toast.success('Work approved and payment released!');
      setShowApprovalModal(false);
      setApprovalNote('');
      setRating(0);
      setReview('');
      fetchContract();
    } catch (error) {
      console.error('Error approving work:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve work');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectWork = async () => {
    if (!contract) return;

    try {
      setApproving(true);
      const response = await fetch(`/api/contracts/${contract.id}/approve`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejection_reason: rejectionReason
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request revision');
      }

      toast.success('Revision requested successfully!');
      setShowRejectionModal(false);
      setRejectionReason('');
      fetchContract();
    } catch (error) {
      console.error('Error requesting revision:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to request revision');
    } finally {
      setApproving(false);
    }
  };

  const handleFileDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }

    try {
      setApproving(true);
      const response = await fetch(`/api/contracts/${contract?.id}/dispute`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dispute_type: disputeType,
          reason: disputeReason,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to file dispute');
      }

      toast.success('Dispute filed! An admin will review your case.');
      setShowDisputeModal(false);
      setDisputeReason('');
      setDisputeType('quality_issue');
      fetchContract();
    } catch (error) {
      console.error('Error filing dispute:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to file dispute');
    } finally {
      setApproving(false);
    }
  };

  const handleSubmitMilestone = async (milestoneId: string, note: string) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/contracts/${contract?.id}/milestones/${milestoneId}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submission_note: note
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit milestone');
      }

      toast.success('Milestone submitted for approval!');
      fetchContract();
    } catch (error) {
      console.error('Error submitting milestone:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit milestone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveMilestone = async (milestoneId: string, note: string) => {
    try {
      setApproving(true);
      const response = await fetch(`/api/contracts/${contract?.id}/milestones/${milestoneId}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approval_note: note
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve milestone');
      }

      toast.success('Milestone approved and payment released!');
      fetchContract();
    } catch (error) {
      console.error('Error approving milestone:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve milestone');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectMilestone = async (milestoneId: string, reason: string) => {
    try {
      setApproving(true);
      const response = await fetch(`/api/contracts/${contract?.id}/milestones/${milestoneId}/approve`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejection_reason: reason
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject milestone');
      }

      toast.success('Revision requested for milestone!');
      fetchContract();
    } catch (error) {
      console.error('Error rejecting milestone:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject milestone');
    } finally {
      setApproving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending_completion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'active':
        return <TrendingUp className="h-5 w-5" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const canSign = () => {
    if (!contract || !userRole) return false;
    
    // Check if both have already signed (this shouldn't happen if status is pending but good to check)
    if (contract.client_signed_at && contract.freelancer_signed_at) return false;

    if (userRole === 'client') {
      return !contract.client_signed_at && contract.status === 'pending';
    } else {
      return !contract.freelancer_signed_at && contract.status === 'pending';
    }
  };

  const needsEscrowBeforeSigning = () => {
    if (!contract) return false;
    // Activation signature requires escrow funding
    const isActivationSignature = 
      (userRole === 'client' && contract.freelancer_signed_at) ||
      (userRole === 'freelancer' && contract.client_signed_at);
      
    return isActivationSignature && !contract.escrow_funded;
  };

  const isSigned = () => {
    if (!contract || !userRole) return false;
    
    if (userRole === 'client') {
      return !!contract.client_signed_at;
    } else {
      return !!contract.freelancer_signed_at;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-gray-600">Loading contract details...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Contract Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The contract you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/contracts')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold"
            >
              Back to Contracts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/contracts')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Contracts
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold text-gray-900">{contract.title}</h1>
                {/* Show edited badge if contract was edited and freelancer hasn't signed yet */}
                {userRole === 'freelancer' && contract.last_edited_at && !contract.freelancer_signed_at && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full flex items-center gap-1 animate-pulse">
                    <Edit className="h-3 w-3" />
                    Recently Edited
                  </span>
                )}
              </div>
              <p className="text-gray-600">Contract ID: {contract.id}</p>
              {contract.last_edited_at && (
                <p className="text-sm text-gray-500 mt-1">
                  Last edited: {new Date(contract.last_edited_at).toLocaleString()}
                </p>
              )}
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${getStatusColor(contract.status)}`}>
              {getStatusIcon(contract.status)}
              {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap break-words overflow-wrap-anywhere">{contract.description}</p>
            </div>

            {/* Job Details */}
            {contract.jobs && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Related Job
                </h2>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900 break-words">{contract.jobs.title}</p>
                  <p className="text-sm text-gray-600 break-words overflow-wrap-anywhere">{contract.jobs.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm text-gray-600">Category:</span>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                      {contract.jobs.category}
                    </span>
                  </div>
                  {contract.jobs.skills && contract.jobs.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {contract.jobs.skills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
            {contract.terms && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{contract.terms}</p>
              </div>
            )}

            {/* Deliverables */}
            {contract.deliverables && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Deliverables
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{contract.deliverables}</p>
              </div>
            )}

            {/* Payment Terms */}
            {contract.payment_terms && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Terms</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{contract.payment_terms}</p>
              </div>
            )}

            {/* Milestones */}
            {contract.milestones && contract.milestones.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Milestones</h2>
                <div className="space-y-4">
                  {contract.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-500">Milestone {index + 1}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getMilestoneStatusColor(milestone.status)}`}>
                              {milestone.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900">{milestone.title}</h3>
                          {milestone.description && (
                            <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-gray-900">${milestone.amount.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {new Date(milestone.due_date).toLocaleDateString()}
                        </div>
                        {milestone.completed_at && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Completed: {new Date(milestone.completed_at).toLocaleDateString()}
                          </div>
                        )}
                        {milestone.paid_at && (
                          <div className="flex items-center gap-1 text-purple-600">
                            💰 Paid: {new Date(milestone.paid_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Milestone Actions */}
                      {userRole === 'freelancer' && ['pending', 'in_progress', 'rejected'].includes(milestone.status) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => {
                              const note = prompt('Add a note about milestone completion:');
                              if (note) handleSubmitMilestone(milestone.id, note);
                            }}
                            disabled={submitting}
                            className="text-sm px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {submitting ? 'Submitting...' : 'Submit for Approval'}
                          </button>
                        </div>
                      )}

                      {userRole === 'client' && milestone.status === 'submitted' && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                          <button
                            onClick={() => {
                              const note = prompt('Add an approval note (optional):');
                              handleApproveMilestone(milestone.id, note || '');
                            }}
                            disabled={approving}
                            className="text-sm px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {approving ? 'Processing...' : 'Approve & Release Payment'}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Why are you requesting revisions?');
                              if (reason) handleRejectMilestone(milestone.id, reason);
                            }}
                            disabled={approving}
                            className="text-sm px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                          >
                            Request Revision
                          </button>
                        </div>
                      )}

                      {milestone.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm font-medium text-red-800">Revision Requested:</p>
                          <p className="text-sm text-red-700 mt-1">{milestone.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-6">
            {/* Contract Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Summary</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">${contract.total_amount.toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Contract Type</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {contract.contract_type.replace('_', ' ')}
                  </p>
                </div>

                {contract.hourly_rate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Hourly Rate</p>
                    <p className="font-medium text-gray-900">${contract.hourly_rate}/hr</p>
                  </div>
                )}

                {contract.estimated_hours && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated Hours</p>
                    <p className="font-medium text-gray-900">{contract.estimated_hours} hours</p>
                  </div>
                )}

                {contract.start_date && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Start Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(contract.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {contract.end_date && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">End Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(contract.end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-1">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(contract.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Platform Fee Information */}
                {contract.status === 'completed' && contract.platform_fee_amount && (
                  <>
                    <div className="col-span-full border-t border-gray-200 pt-4 mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">Payment Breakdown</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Gross Amount</p>
                      <p className="font-medium text-gray-900">${contract.total_amount.toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Platform Fee (7%)</p>
                      <p className="font-medium text-red-600">-${contract.platform_fee_amount.toLocaleString()}</p>
                    </div>

                    {userRole === 'freelancer' && contract.freelancer_net_amount && (
                      <div className="col-span-full">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Your Net Earning</p>
                          <p className="text-2xl font-bold text-green-700">
                            ${contract.freelancer_net_amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">To be transferred to your bank account</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Parties */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Parties</h2>
              
              {/* Client */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Client</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                    {contract.client.profiles.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={contract.client.profiles.avatar_url} 
                        alt={contract.client.profiles.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{contract.client.profiles.full_name}</p>
                    <p className="text-sm text-gray-600">{contract.client.profiles.email}</p>
                  </div>
                </div>
              </div>

              {/* Freelancer */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Freelancer</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden">
                    {contract.freelancer.profiles.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={contract.freelancer.profiles.avatar_url} 
                        alt={contract.freelancer.profiles.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{contract.freelancer.profiles.full_name}</p>
                    <p className="text-sm text-gray-600">{contract.freelancer.profiles.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Status */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Signatures</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Client</span>
                  {contract.client_signed_at ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Signed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Clock className="h-5 w-5" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                  )}
                </div>
                {contract.client_signed_at && (
                  <p className="text-xs text-gray-500">
                    {new Date(contract.client_signed_at).toLocaleString()}
                  </p>
                )}

                <div className="border-t border-gray-200 pt-3"></div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Freelancer</span>
                  {contract.freelancer_signed_at ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Signed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Clock className="h-5 w-5" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                  )}
                </div>
                {contract.freelancer_signed_at && (
                  <p className="text-xs text-gray-500">
                    {new Date(contract.freelancer_signed_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Revision Feedback - Show when work was rejected */}
            {contract.rejection_reason && contract.status === 'active' && (
              <div className="bg-yellow-50 rounded-lg shadow-sm p-6 border-2 border-yellow-300">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-yellow-900">
                        Revision Requested
                      </h3>
                      {contract.revision_count >= 1 && (
                        <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                          Dispute available
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-yellow-800 mb-3">
                      The client has requested changes to the submitted work. {contract.revision_count >= 1 ? 'You can resubmit or file a dispute if you disagree.' : 'Please review the feedback below and resubmit.'}
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-yellow-200">
                      <p className="text-sm font-medium text-gray-700 mb-1">Client Feedback:</p>
                      <p className="text-gray-900 whitespace-pre-wrap break-words overflow-wrap-anywhere">{contract.rejection_reason}</p>
                    </div>
                    {contract.rejected_at && (
                      <p className="text-xs text-yellow-700 mt-2">
                        Rejected on {new Date(contract.rejected_at).toLocaleString()}
                      </p>
                    )}
                    {contract.revision_count >= 1 && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">
                          💡 Work has been rejected. If you believe the rejection is unfair, you can file a dispute instead of resubmitting.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {/* Edit Contract Button (Client only, before freelancer signs) */}
                {userRole === 'client' && !contract.freelancer_signed_at && contract.status === 'pending' && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    <Edit className="h-5 w-5" />
                    Edit Contract
                  </button>
                )}

                {/* View History Button */}
                <button
                  onClick={() => setShowHistoryView(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                >
                  <History className="h-5 w-5" />
                  View History
                </button>

                {/* Pay Escrow Button (Client only, when not yet paid) */}
                {userRole === 'client' && contract.status === 'pending' && !contract.escrow_funded && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0CF574] text-white rounded-lg hover:bg-[#0CF574]/90 font-bold border-2 border-black/10 shadow-sm transition-all"
                  >
                    <DollarSign className="h-5 w-5" />
                    Secure Funds in Escrow
                  </button>
                )}

                {canSign() && (
                  <div className="space-y-2">
                    {needsEscrowBeforeSigning() && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                          {userRole === 'freelancer' 
                            ? "Waiting for client to secure funds in escrow before you can sign and activate the contract."
                            : "You must secure funds in escrow before this contract can be activated."}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => setShowSignConfirm(true)}
                      disabled={signing || needsEscrowBeforeSigning()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                    >
                      {signing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Signing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          Sign Contract
                        </>
                      )}
                    </button>
                  </div>
                )}

                {isSigned() && contract.status === 'pending' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Waiting for {userRole === 'client' ? 'freelancer' : 'client'} to sign
                    </p>
                  </div>
                )}

                {contract.status === 'active' && userRole === 'freelancer' && !contract.milestones?.length && (
                  <button
                    onClick={() => setShowCompletionModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Submit Work for Approval
                  </button>
                )}

                {contract.status === 'active' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">
                      ✓ Contract is active and work can begin
                    </p>
                  </div>
                )}

                {contract.status === 'pending_completion' && userRole === 'freelancer' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">
                      ⏳ Waiting for client approval...
                    </p>
                  </div>
                )}

                {contract.status === 'pending_completion' && userRole === 'client' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowApprovalModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Approve & Release Payment
                    </button>
                    <button
                      onClick={() => setShowRejectionModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold"
                    >
                      <XCircle className="h-5 w-5" />
                      Request Revision{contract.revision_count > 0 && ` (Revision #${contract.revision_count + 1})`}
                    </button>
                    {contract.revision_count >= 1 && (
                      <button
                        onClick={() => setShowDisputeModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                      >
                        <AlertCircle className="h-5 w-5" />
                        File Dispute
                      </button>
                    )}
                  </div>
                )}

                {contract.status === 'completed' && contract.payment_released_at && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800 font-medium">
                      ✓ Completed & Paid
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      Payment released on {new Date(contract.payment_released_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {contract.rejection_reason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Revision Requested:</p>
                    <p className="text-sm text-red-700 mt-1 break-words overflow-wrap-anywhere">{contract.rejection_reason}</p>
                  </div>
                )}

                {contract.completion_note && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-800">Completion Note:</p>
                    <p className="text-sm text-gray-700 mt-1 break-words">{contract.completion_note}</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    const otherParty = userRole === 'client' ? contract.freelancer : contract.client;
                    router.push(`/communication?user=${otherParty.profile_id}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  <MessageSquare className="h-5 w-5" />
                  Message {userRole === 'client' ? 'Freelancer' : 'Client'}
                </button>

                {/* File Dispute Button - Available for active contracts */}
                {(contract.status === 'active' || contract.status === 'pending_completion') && (
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                  >
                    <AlertCircle className="h-5 w-5" />
                    File Dispute
                  </button>
                )}

                {/* Contact Admin Button */}
                <button
                  onClick={() => router.push('/support')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 font-medium"
                >
                  <MessageSquare className="h-5 w-5" />
                  Contact Admin Support
                </button>

                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  <Download className="h-5 w-5" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {/* Submit Work Modal */}
        {showCompletionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Work for Approval</h3>
              <textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="Add notes about your work completion (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitWork}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    setCompletionNote('');
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approve Work Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Approve Work & Release Payment</h3>
              <p className="text-gray-600 mb-4">
                Payment of <strong>${contract.total_amount.toLocaleString()}</strong> will be released to the freelancer.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating (Optional)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write a review (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
                rows={3}
              />

              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Add approval notes (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
                rows={2}
              />

              <div className="flex gap-3">
                <button
                  onClick={handleApproveWork}
                  disabled={approving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {approving ? 'Processing...' : 'Approve & Pay'}
                </button>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalNote('');
                    setRating(0);
                    setReview('');
                  }}
                  disabled={approving}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Work Modal */}
        {showRejectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Request Revision</h3>
              <p className="text-gray-600 mb-4">
                Please explain what needs to be revised:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Describe what needs to be changed..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
                rows={4}
                required
              />
              <div className="flex gap-3">
                <button
                  onClick={handleRejectWork}
                  disabled={approving || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {approving ? 'Requesting...' : 'Request Revision'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                  }}
                  disabled={approving}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Dispute Modal */}
        {showDisputeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                File Dispute
              </h3>
              <p className="text-gray-600 mb-4">
                This will escalate the issue to an admin for resolution. Both parties will be notified.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dispute Type
                </label>
                <select
                  value={disputeType}
                  onChange={(e) => setDisputeType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="quality_issue">Quality of Work Issue</option>
                  <option value="payment_issue">Payment Issue</option>
                  <option value="scope_change">Scope Change Dispute</option>
                  <option value="delivery_issue">Delivery/Timeline Issue</option>
                  <option value="refund_request">Refund Request</option>
                  <option value="abandoned_work">Work Abandoned</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Explanation *
                </label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Please provide a detailed explanation of the dispute..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={5}
                  required
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Filing a dispute will pause the contract and notify an admin. 
                  Please ensure you've tried to resolve the issue directly first.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleFileDispute}
                  disabled={approving || !disputeReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {approving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Filing...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      File Dispute
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDisputeModal(false);
                    setDisputeReason('');
                    setDisputeType('quality_issue');
                  }}
                  disabled={approving}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contract Sign Confirmation Modal */}
        <ContractSignConfirmModal
          isOpen={showSignConfirm}
          onClose={() => setShowSignConfirm(false)}
          onConfirm={handleSign}
          contractTitle={contract.title}
          userRole={userRole || 'freelancer'}
          isLoading={signing}
        />

        {/* Contract Edit Modal */}
        <ContractEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            fetchContract();
            setShowEditModal(false);
          }}
          contract={contract}
        />

        {/* Contract History View */}
        <ContractHistoryView
          contractId={contract.id}
          isOpen={showHistoryView}
          onClose={() => setShowHistoryView(false)}
        />

        {/* Stripe Escrow Payment Modal */}
        {showPaymentModal && contract && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              >
                <XCircle className="h-6 w-6" />
              </button>
              <ContractEscrowPayment
                contractId={contract.id}
                freelancerId={contract.freelancer_id}
                amount={contract.total_amount}
                title={contract.title}
                onPaymentComplete={() => {
                  setShowPaymentModal(false);
                  toast.success('Funds secured in escrow!');
                  fetchContract();
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
