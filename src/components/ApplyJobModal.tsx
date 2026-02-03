'use client';

import { useState } from 'react';
import { X, DollarSign, Clock, Send, Briefcase, FileText, TrendingUp, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Job } from '@/types';

interface ApplyJobModalProps {
  job: Job;
  freelancerId: string;
  onClose: () => void;
  onSubmit: (data: {
    job_id: string;
    freelancer_id: string;
    cover_letter: string;
    proposed_budget: number;
    estimated_duration: string;
  }) => Promise<void>;
}

export default function ApplyJobModal({
  job,
  freelancerId,
  onClose,
  onSubmit,
}: ApplyJobModalProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedBudget, setProposedBudget] = useState(job.budget.toString());
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'proposal'>('details');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!coverLetter.trim()) {
      setError('Please write a cover letter');
      return;
    }

    if (coverLetter.length < 100) {
      setError('Cover letter must be at least 100 characters');
      return;
    }

    if (!proposedBudget || parseFloat(proposedBudget) <= 0) {
      setError('Please enter a valid budget');
      return;
    }

    if (!estimatedDuration.trim()) {
      setError('Please enter estimated duration');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        job_id: job.id,
        freelancer_id: freelancerId,
        cover_letter: coverLetter,
        proposed_budget: parseFloat(proposedBudget),
        estimated_duration: estimatedDuration,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  const budgetDifference = parseFloat(proposedBudget) - job.budget;
  const budgetPercentage = job.budget > 0 ? ((budgetDifference / job.budget) * 100).toFixed(1) : '0';
  const isOverBudget = budgetDifference > 0;
  const isUnderBudget = budgetDifference < 0;

  // Calculate character count validation
  const coverLetterMin = 100;
  const coverLetterMax = 2000;
  const coverLetterProgress = (coverLetter.length / coverLetterMin) * 100;
  const isValidLength = coverLetter.length >= coverLetterMin && coverLetter.length <= coverLetterMax;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-[#0CF574] via-[#0CF574]/90 to-[#0CF574]/80 p-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-gray-900" />
                <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Submit Your Proposal</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-800">
                <div className="flex items-center gap-1.5 bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold">${job.budget.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Briefcase className="h-4 w-4" />
                  <span>{job.category || 'General'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:rotate-90"
              aria-label="Close modal"
            >
              <X className="h-6 w-6 text-gray-900" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'details'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-800 hover:bg-white/20'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Job Details
            </button>
            <button
              onClick={() => setActiveTab('proposal')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'proposal'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-800 hover:bg-white/20'
              }`}
            >
              <Send className="h-4 w-4 inline mr-2" />
              Your Proposal
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 animate-in slide-in-from-top duration-200">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Job Details Tab */}
          {activeTab === 'details' && (
            <div className="p-6 space-y-6 animate-in fade-in duration-300">
              {/* Job Description */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#0CF574]" />
                  Project Description
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>

              {/* Required Skills */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium shadow-sm border border-blue-200/50 hover:shadow-md transition-shadow"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Project Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100/30 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500 rounded-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Budget</p>
                      <p className="text-xl font-bold text-gray-900">${job.budget.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/30 rounded-xl p-5 border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500 rounded-lg">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Category</p>
                      <p className="text-lg font-bold text-gray-900">{job.category || 'General'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/30 rounded-xl p-5 border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-500 rounded-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Posted</p>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Proposal Tab */}
          {activeTab === 'proposal' && (
            <form onSubmit={handleSubmit} className="p-6 space-y-6 animate-in fade-in duration-300">
              {/* Cover Letter Section */}
              <div className="space-y-3">
                <label className="block text-base font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#0CF574]" />
                  Cover Letter <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-[#0CF574] focus:border-[#0CF574] outline-none resize-none transition-all ${
                      isValidLength 
                        ? 'border-green-300 bg-green-50/30' 
                        : coverLetter.length > 0 
                        ? 'border-orange-300 bg-orange-50/30' 
                        : 'border-gray-300'
                    }`}
                    rows={10}
                    placeholder="✍️ Tell the client why you're perfect for this project...

Tip: Include:
• Your relevant experience
• Why you're interested in this project
• How you'll approach the work
• Any questions you have"
                    required
                  />
                  {isValidLength && (
                    <CheckCircle2 className="absolute top-4 right-4 h-5 w-5 text-green-600" />
                  )}
                </div>
                
                {/* Character Counter with Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={`font-medium ${
                      isValidLength ? 'text-green-600' : coverLetter.length > 0 ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                      {coverLetter.length >= coverLetterMin ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          Great length!
                        </span>
                      ) : (
                        <span>{coverLetterMin - coverLetter.length} more characters needed</span>
                      )}
                    </span>
                    <span className={`${
                      coverLetter.length > coverLetterMax ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {coverLetter.length}/{coverLetterMax}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        isValidLength ? 'bg-green-500' : 'bg-orange-400'
                      }`}
                      style={{ width: `${Math.min(coverLetterProgress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Budget Section with Smart Comparison */}
              <div className="space-y-3">
                <label className="block text-base font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#0CF574]" />
                  Your Proposed Budget <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">$</span>
                  <input
                    type="number"
                    value={proposedBudget}
                    onChange={(e) => setProposedBudget(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0CF574] focus:border-[#0CF574] outline-none text-lg font-semibold transition-all"
                    placeholder="Enter amount"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
                
                {/* Budget Comparison Card */}
                {proposedBudget && parseFloat(proposedBudget) > 0 && (
                  <div className={`p-4 rounded-xl border-2 transition-all ${
                    isOverBudget 
                      ? 'bg-orange-50 border-orange-200' 
                      : isUnderBudget 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Client's Budget</p>
                        <p className="text-lg font-bold text-gray-900">${job.budget.toLocaleString()}</p>
                      </div>
                      <div className="text-center px-4">
                        <div className={`text-2xl font-bold ${
                          isOverBudget ? 'text-orange-600' : isUnderBudget ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {budgetDifference > 0 ? '+' : ''}{budgetPercentage}%
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {isOverBudget ? 'Above budget' : isUnderBudget ? 'Below budget' : 'At budget'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-600">Your Proposal</p>
                        <p className="text-lg font-bold text-gray-900">${parseFloat(proposedBudget).toLocaleString()}</p>
                      </div>
                    </div>
                    {isOverBudget && (
                      <p className="mt-3 text-sm text-orange-700 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>Your proposal is higher than the client's budget. Make sure to justify the value in your cover letter.</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Duration Section */}
              <div className="space-y-3">
                <label className="block text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#0CF574]" />
                  Estimated Duration <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0CF574] focus:border-[#0CF574] outline-none transition-all"
                  placeholder="e.g., 2 weeks, 1 month, 10 days"
                  required
                />
                <p className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-[#0CF574] font-semibold">💡 Tip:</span>
                  Be realistic with your timeline. Clients appreciate accurate estimates.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-[#0CF574]/10 to-[#0CF574]/5 rounded-xl p-6 border-2 border-[#0CF574]/30">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#0CF574]" />
                  Proposal Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cover Letter Length:</span>
                    <span className={`font-semibold ${isValidLength ? 'text-green-600' : 'text-gray-900'}`}>
                      {coverLetter.length} characters {isValidLength && '✓'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Proposed Budget:</span>
                    <span className="font-semibold text-gray-900">
                      ${proposedBudget ? parseFloat(proposedBudget).toLocaleString() : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timeline:</span>
                    <span className="font-semibold text-gray-900">
                      {estimatedDuration || 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="bg-white border-t-2 border-gray-200 p-6 flex-shrink-0">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold hover:border-gray-400"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !isValidLength || !proposedBudget || !estimatedDuration}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-[#0CF574] to-[#0CF574]/90 text-gray-900 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                  Submitting Proposal...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Proposal
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
