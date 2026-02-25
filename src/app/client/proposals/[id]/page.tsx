'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  Star,
  Award,
  Briefcase,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProposalDetail {
  id: string;
  job_id: string;
  freelancer_id: string;
  cover_letter: string;
  proposed_budget: number;
  estimated_duration: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  rejection_reason?: string;
  jobs: {
    id: string;
    title: string;
    description: string;
    budget: number;
    category: string;
    skills: string[];
    status: string;
    client_id: string;
  };
  freelancers: {
    id: string;
    title: string;
    skills: string[];
    hourly_rate: number;
    rating: number;
    bio: string;
    profile_id: string;
    profiles: {
      full_name: string;
      avatar_url: string;
    };
  };
}

export default function ProposalDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchProposal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proposals/${id}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch proposal');
      }

      setProposal(data.proposal);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to load proposal';
      toast.error(msg);
      router.push('/client/proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!proposal) return;
    if (!confirm('Accept this proposal? You will be redirected to create a contract.')) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'accepted' }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to accept proposal');

      toast.success('Proposal accepted! Redirecting to create a contract...');
      setTimeout(() => {
        router.push(`/client/contracts/create?proposal=${proposal.id}`);
      }, 1500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to accept proposal');
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!proposal) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'rejected', rejection_reason: rejectionReason }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to reject proposal');

      toast.success('Proposal rejected.');
      setShowRejectModal(false);
      fetchProposal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject proposal');
    } finally {
      setProcessing(false);
    }
  };

  const statusConfig = {
    pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800 border-green-200' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
          <p className="mt-4 text-gray-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (!proposal) return null;

  const freelancer = proposal.freelancers;
  const freelancerProfile = Array.isArray(freelancer?.profiles)
    ? freelancer.profiles[0]
    : freelancer?.profiles;
  const status = statusConfig[proposal.status];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/client/proposals')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Proposals
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {freelancerProfile?.avatar_url ? (
                <Image
                  src={freelancerProfile.avatar_url}
                  alt={freelancerProfile.full_name}
                  width={72}
                  height={72}
                  className="h-18 w-18 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {freelancerProfile?.full_name || 'Freelancer'}
                </h1>
                <p className="text-gray-500">{freelancer?.title || 'Freelancer'}</p>
                {freelancer?.rating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {freelancer.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Proposal Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proposal Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Proposal Details
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Proposed Budget</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${proposal.proposed_budget.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
                    <p className="text-xl font-bold text-gray-900">{proposal.estimated_duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <Award className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Hourly Rate</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${freelancer?.hourly_rate ?? 'N/A'}/hr
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Submitted</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(proposal.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cover Letter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Cover Letter</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {proposal.cover_letter}
              </p>
            </div>

            {/* Freelancer Bio */}
            {freelancer?.bio && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">About the Freelancer</h2>
                <p className="text-gray-700 leading-relaxed">{freelancer.bio}</p>
              </div>
            )}

            {/* Skills */}
            {freelancer?.skills?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {freelancer.skills.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column — Job Info + Actions */}
          <div className="space-y-6">
            {/* Job Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Job Posted
              </h2>
              <h3 className="font-semibold text-gray-900 mb-2">{proposal.jobs?.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{proposal.jobs?.description}</p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  <span className="font-medium">Budget:</span> ${proposal.jobs?.budget?.toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Category:</span> {proposal.jobs?.category}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {proposal.status === 'pending' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Actions</h2>
                <button
                  onClick={handleAccept}
                  disabled={processing}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Accept Proposal
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="h-5 w-5" />
                  Reject Proposal
                </button>
                <button
                  onClick={() => router.push(`/communication?userId=${freelancer?.profile_id}`)}
                  className="w-full py-3 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-5 w-5" />
                  Message Freelancer
                </button>
              </div>
            )}

            {proposal.status === 'accepted' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-800">Proposal Accepted</p>
                <p className="text-sm text-green-700 mt-1">A contract has been or will be created.</p>
                <button
                  onClick={() => router.push(`/communication?userId=${freelancer?.profile_id}`)}
                  className="mt-4 w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Open Chat
                </button>
              </div>
            )}

            {proposal.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <p className="font-semibold text-red-800">Proposal Rejected</p>
                </div>
                {proposal.rejection_reason && (
                  <p className="text-sm text-red-700 mt-1">
                    <span className="font-medium">Reason:</span> {proposal.rejection_reason}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reject Proposal</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Optionally provide feedback to the freelancer explaining your decision.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Optional: Provide a reason for rejection..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={processing}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Reject Proposal'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
