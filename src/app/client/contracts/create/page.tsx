'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, FileSignature, DollarSign, Calendar, CheckCircle, Plus, Minus, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

function CreateContractForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const proposalId = searchParams.get('proposal');
  const contractType = searchParams.get('type') || 'quick';
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proposal, setProposal] = useState<{
    freelancer_id: string;
    job_id: string;
    proposed_budget: number;
    freelancers?: { profiles?: { full_name: string } };
    jobs?: { title: string };
    cover_letter: string;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    contract_type: 'fixed_price',
    title: '',
    description: '',
    budget: '',
    hourly_rate: '',
    estimated_hours: '',
    start_date: '',
    end_date: '',
    terms: '',
    deliverables: '',
    payment_terms: '',
    milestones: [] as { title: string; description: string; amount: string; due_date: string }[],
  });

  useEffect(() => {
    if (proposalId) {
      fetchProposal();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  const fetchProposal = async () => {
    try {
      const response = await fetch(`/api/proposals?proposalId=${proposalId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok && data.proposals?.[0]) {
        const proposalData = data.proposals[0];
        setProposal(proposalData);
        
        // Pre-fill form with proposal data
        setFormData(prev => ({
          ...prev,
          title: proposalData.jobs?.title || '',
          description: proposalData.cover_letter || '',
          budget: proposalData.proposed_budget?.toString() || '',
          payment_terms: contractType === 'quick' 
            ? 'Payment will be released upon successful completion of work.'
            : '',
        }));
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
      toast.error('Failed to load proposal data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { title: '', description: '', amount: '', due_date: '' }
      ]
    }));
  };

  const handleRemoveMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const handleMilestoneChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a contract title');
      return false;
    }
    
    if (!formData.description.trim()) {
      toast.error('Please enter a contract description');
      return false;
    }
    
    if (formData.contract_type === 'hourly') {
      if (!formData.hourly_rate || parseFloat(formData.hourly_rate) <= 0) {
        toast.error('Please enter a valid hourly rate');
        return false;
      }
      if (!formData.estimated_hours || parseFloat(formData.estimated_hours) <= 0) {
        toast.error('Please enter estimated hours');
        return false;
      }
    } else {
      if (!formData.budget || parseFloat(formData.budget) <= 0) {
        toast.error('Please enter a valid budget');
        return false;
      }
    }
    
    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (formData.start_date) {
      const startDate = new Date(formData.start_date);
      if (startDate < today) {
        toast.error('Start date cannot be in the past');
        return false;
      }
    }
    
    if (formData.end_date) {
      const endDate = new Date(formData.end_date);
      if (endDate < today) {
        toast.error('End date cannot be in the past');
        return false;
      }
      
      if (formData.start_date) {
        const startDate = new Date(formData.start_date);
        if (endDate <= startDate) {
          toast.error('End date must be after start date');
          return false;
        }
      }
    }
    
    // Validate milestones
    if (formData.contract_type === 'milestone' && formData.milestones.length === 0) {
      toast.error('Please add at least one milestone for milestone-based contracts');
      return false;
    }
    
    // Validate milestone dates
    if (formData.milestones.length > 0) {
      for (let i = 0; i < formData.milestones.length; i++) {
        const milestone = formData.milestones[i];
        
        if (milestone.due_date) {
          const dueDate = new Date(milestone.due_date);
          if (dueDate < today) {
            toast.error(`Milestone ${i + 1} due date cannot be in the past`);
            return false;
          }
          
          if (formData.start_date) {
            const startDate = new Date(formData.start_date);
            if (dueDate < startDate) {
              toast.error(`Milestone ${i + 1} due date must be on or after contract start date`);
              return false;
            }
          }
          
          if (formData.end_date) {
            const endDate = new Date(formData.end_date);
            if (dueDate > endDate) {
              toast.error(`Milestone ${i + 1} due date must be on or before contract end date`);
              return false;
            }
          }
        }
      }
    }
    
    return true;
  };

  const calculateTotalMilestones = () => {
    return formData.milestones.reduce((total, m) => total + (parseFloat(m.amount) || 0), 0);
  };

  useEffect(() => {
    if (formData.contract_type === 'milestone' && formData.milestones.length > 0 && formData.budget) {
      const totalMilestones = calculateTotalMilestones();
      const budget = parseFloat(formData.budget);
      if (Math.abs(totalMilestones - budget) > 0.01) {
        console.warn('Milestone total does not match budget');
      }
    }
  }, [formData.milestones, formData.budget, formData.contract_type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proposal) {
      toast.error('Proposal data not loaded');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          proposal_id: proposalId,
          freelancer_id: proposal.freelancer_id,
          job_id: proposal.job_id,
          title: formData.title,
          description: formData.description,
          contract_type: formData.contract_type,
          total_amount: formData.budget, // Map budget to total_amount
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          payment_terms: formData.payment_terms || null,
          milestones: formData.milestones.length > 0 ? formData.milestones : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create contract');
      }

      toast.success('Contract created successfully!');
      
      // Redirect to the conversation with the contract message
      if (data.conversationId) {
        router.push(`/communication?conversationId=${data.conversationId}`);
      } else {
        router.push('/contracts');
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create contract');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Messages
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileSignature className="h-8 w-8 text-primary" />
            Create Contract
          </h1>
          <p className="text-gray-600 mt-2">
            {contractType === 'quick' 
              ? '⚡ Quick contract with standard terms'
              : '🎯 Custom contract with detailed terms'}
          </p>
        </div>

        {/* Proposal Summary */}
        {proposal && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Proposal Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Freelancer:</span>
                <span className="ml-2 font-semibold">{proposal.freelancers?.profiles?.full_name}</span>
              </div>
              <div>
                <span className="text-gray-600">Proposed Budget:</span>
                <span className="ml-2 font-semibold">${proposal.proposed_budget?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Contract Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Contract Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contract Type *
            </label>
            <select
              value={formData.contract_type}
              onChange={(e) => setFormData(prev => ({ ...prev, contract_type: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="fixed_price">Fixed Price</option>
              <option value="hourly">Hourly Rate</option>
              <option value="milestone">Milestone-based</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contract Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Website Development Contract"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contract Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the work to be done..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Budget */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Budget (USD) *
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
              placeholder="10000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Hourly Rate and Estimated Hours (for hourly contracts) */}
          {formData.contract_type === 'hourly' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Hourly Rate (USD) *
                </label>
                <input
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                  placeholder="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Estimated Hours *
                </label>
                <input
                  type="number"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                  placeholder="160"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Must be today or later</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Must be after start date</p>
            </div>
          </div>

          {/* Payment Terms */}
          {contractType === 'custom' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Terms
              </label>
              <textarea
                value={formData.payment_terms}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                placeholder="Describe payment schedule and conditions..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          )}

          {/* Terms and Deliverables */}
          {contractType === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Terms
                </label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  placeholder="Enter the terms of the contract..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deliverables
                </label>
                <textarea
                  value={formData.deliverables}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliverables: e.target.value }))}
                  placeholder="List the deliverables..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Milestones (for milestone-based contracts) */}
          {formData.contract_type === 'milestone' && contractType === 'custom' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Milestones
                </label>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  + Add Milestone
                </button>
              </div>
              {formData.milestones.map((milestone, index) => (
                <div key={index} className="p-4 border border-gray-300 rounded-lg mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Milestone {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                      placeholder="Milestone title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <textarea
                      value={milestone.description}
                      onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                      placeholder="Milestone description"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={milestone.amount}
                        onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                        placeholder="Amount (USD)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <div>
                        <input
                          type="date"
                          value={milestone.due_date}
                          onChange={(e) => handleMilestoneChange(index, 'due_date', e.target.value)}
                          min={formData.start_date || new Date().toISOString().split('T')[0]}
                          max={formData.end_date || undefined}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Between contract dates</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-6 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Contract...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Create Contract & Send
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateContractPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CreateContractForm />
    </Suspense>
  );
}
