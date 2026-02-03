import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Proposal } from '@/types';

// ==========================================
// FETCH PROPOSALS (by job or freelancer)
// ==========================================

export function useProposals(filters?: {
  jobId?: string;
  freelancerId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['proposals', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.jobId) params.append('jobId', filters.jobId);
      if (filters?.freelancerId) params.append('freelancerId', filters.freelancerId);
      if (filters?.status) params.append('status', filters.status);

      const response = await fetch(`/api/proposals?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch proposals');
      }
      const data = await response.json();
      return data.proposals as Proposal[];
    },
    enabled: !!(filters?.jobId || filters?.freelancerId), // Only run if we have a filter
  });
}

// ==========================================
// CREATE PROPOSAL MUTATION
// ==========================================

export function useCreateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proposalData: {
      jobId: string;
      freelancerId: string;
      coverLetter: string;
      proposedBudget: number;
      estimatedDuration: string;
    }) => {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(proposalData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit proposal');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit proposal');
    },
  });
}

// ==========================================
// UPDATE PROPOSAL STATUS MUTATION
// ==========================================

export function useUpdateProposalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      proposalId, 
      status 
    }: { 
      proposalId: string; 
      status: 'pending' | 'accepted' | 'rejected' 
    }) => {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update proposal');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      
      const message = variables.status === 'accepted' 
        ? 'Proposal accepted!' 
        : 'Proposal rejected';
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update proposal');
    },
  });
}
