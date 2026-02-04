'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Workflow state types
export type WorkflowStage = 
  | 'registration'
  | 'email-verification'
  | 'welcome'
  | 'profile-setup'
  | 'bank-setup'
  | 'first-action'
  | 'active'
  | 'completed';

export type FreelancerStage =
  | 'browsing-jobs'
  | 'viewing-job'
  | 'applying'
  | 'profile-incomplete'
  | 'bank-incomplete'
  | 'application-submitted'
  | 'hired'
  | 'working'
  | 'milestone-submission'
  | 'job-completion'
  | 'review-submission';

export type ClientStage =
  | 'posting-job'
  | 'bank-incomplete'
  | 'job-posted'
  | 'reviewing-applications'
  | 'hiring'
  | 'managing-job'
  | 'milestone-review'
  | 'job-completion'
  | 'review-submission';

interface WorkflowState {
  // User verification status
  isEmailVerified: boolean;
  isProfileCompleted: boolean;
  isBankDetailsCompleted: boolean;
  
  // Current workflow stage
  currentStage: WorkflowStage;
  freelancerStage?: FreelancerStage;
  clientStage?: ClientStage;
  
  // Saved state for redirects
  savedJobId?: string;
  savedJobPostData?: Record<string, unknown>;
  savedApplicationData?: Record<string, unknown>;
  returnUrl?: string;
  
  // Progress tracking
  jobsCompleted: number;
  jobsPosted: number;
  reviewsGiven: number;
  
  // First-time flags
  hasSeenWelcomeBanner: boolean;
  hasCompletedFirstJob: boolean;
  hasPostedFirstJob: boolean;
  hasAppliedToFirstJob: boolean;
}

interface WorkflowContextType {
  state: WorkflowState;
  
  // Verification checks
  checkProfileComplete: () => Promise<boolean>;
  checkBankDetailsComplete: () => Promise<boolean>;
  checkCanApplyToJob: (jobId: string) => Promise<{ canApply: boolean; reason?: string }>;
  checkCanPostJob: () => Promise<{ canPost: boolean; reason?: string }>;
  
  // Stage updates
  updateStage: (stage: WorkflowStage) => void;
  updateFreelancerStage: (stage: FreelancerStage) => void;
  updateClientStage: (stage: ClientStage) => void;
  
  // State saving for redirects
  saveJobApplication: (jobId: string, data?: Record<string, unknown>) => void;
  saveJobPost: (data: Record<string, unknown>) => void;
  saveReturnUrl: (url: string) => void;
  clearSavedState: () => void;
  
  // Completion tracking
  markEmailVerified: () => void;
  markProfileCompleted: () => void;
  markBankDetailsCompleted: () => void;
  markWelcomeBannerSeen: () => void;
  incrementJobsCompleted: () => void;
  incrementJobsPosted: () => void;
  incrementReviewsGiven: () => void;
  
  // Helper methods
  needsProfileSetup: () => boolean;
  needsBankSetup: () => boolean;
  isFirstTimeUser: () => boolean;
  getWorkflowProgress: () => number;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [state, setState] = useState<WorkflowState>({
    isEmailVerified: false,
    isProfileCompleted: false,
    isBankDetailsCompleted: false,
    currentStage: 'registration',
    jobsCompleted: 0,
    jobsPosted: 0,
    reviewsGiven: 0,
    hasSeenWelcomeBanner: false,
    hasCompletedFirstJob: false,
    hasPostedFirstJob: false,
    hasAppliedToFirstJob: false,
  });
  
  // Load workflow state from localStorage and API
  useEffect(() => {
    if (!user) return;
    
    const loadWorkflowState = async () => {
      try {
        // Load from localStorage
        const savedState = localStorage.getItem(`workflow_${user.id}`);
        if (savedState) {
          setState(prev => ({ ...prev, ...JSON.parse(savedState) }));
        }
        
        // Fetch user's current verification status from API
        const response = await fetch(`/api/users/${user.id}/verification-status`);
        if (response.ok) {
          const data = await response.json();
          setState(prev => ({
            ...prev,
            isEmailVerified: data.email_verified || false,
            isProfileCompleted: data.profile_completed || false,
            isBankDetailsCompleted: data.bank_details_completed || false,
            jobsCompleted: data.jobs_completed || 0,
            jobsPosted: data.jobs_posted || 0,
            reviewsGiven: data.reviews_given || 0,
          }));
        }
      } catch (error) {
        console.error('Failed to load workflow state:', error);
      }
    };
    
    loadWorkflowState();
  }, [user]);
  
  // Save workflow state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`workflow_${user.id}`, JSON.stringify(state));
    }
  }, [state, user]);
  
  // Check if profile is complete
  const checkProfileComplete = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(`/api/users/${user.id}/profile/check-complete`);
      if (response.ok) {
        const data = await response.json();
        const isComplete = data.isComplete;
        setState(prev => ({ ...prev, isProfileCompleted: isComplete }));
        return isComplete;
      }
    } catch (error) {
      console.error('Failed to check profile completion:', error);
    }
    
    return state.isProfileCompleted;
  };
  
  // Check if bank details are complete
  const checkBankDetailsComplete = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Check Stripe Connect account status for freelancers
      const response = await fetch('/api/stripe/connect');
      if (response.ok) {
        const data = await response.json();
        // Consider complete if Stripe account exists and is verified
        const isComplete = data.account?.details_submitted || false;
        setState(prev => ({ ...prev, isBankDetailsCompleted: isComplete }));
        return isComplete;
      }
    } catch (error) {
      console.error('Failed to check bank details:', error);
    }
    
    return state.isBankDetailsCompleted;
  };
  
  // Check if user can apply to a job
  const checkCanApplyToJob = async (jobId: string): Promise<{ canApply: boolean; reason?: string }> => {
    if (!user) {
      return { canApply: false, reason: 'not-authenticated' };
    }
    
    // Check email verification
    if (!state.isEmailVerified) {
      return { canApply: false, reason: 'email-not-verified' };
    }
    
    // Check profile completion
    const profileComplete = await checkProfileComplete();
    if (!profileComplete) {
      saveJobApplication(jobId);
      return { canApply: false, reason: 'profile-incomplete' };
    }
    
    // Check bank details
    const bankComplete = await checkBankDetailsComplete();
    if (!bankComplete) {
      saveJobApplication(jobId);
      return { canApply: false, reason: 'bank-details-incomplete' };
    }
    
    return { canApply: true };
  };
  
  // Check if user can post a job
  const checkCanPostJob = async (): Promise<{ canPost: boolean; reason?: string }> => {
    if (!user) {
      return { canPost: false, reason: 'not-authenticated' };
    }
    
    // Check email verification
    if (!state.isEmailVerified) {
      return { canPost: false, reason: 'email-not-verified' };
    }
    
    // Check bank details (payment method)
    const bankComplete = await checkBankDetailsComplete();
    if (!bankComplete) {
      return { canPost: false, reason: 'payment-method-required' };
    }
    
    return { canPost: true };
  };
  
  // Update stages
  const updateStage = (stage: WorkflowStage) => {
    setState(prev => ({ ...prev, currentStage: stage }));
  };
  
  const updateFreelancerStage = (stage: FreelancerStage) => {
    setState(prev => ({ ...prev, freelancerStage: stage }));
  };
  
  const updateClientStage = (stage: ClientStage) => {
    setState(prev => ({ ...prev, clientStage: stage }));
  };
  
  // Save state for redirects
  const saveJobApplication = (jobId: string, data?: Record<string, unknown>) => {
    setState(prev => ({
      ...prev,
      savedJobId: jobId,
      savedApplicationData: data,
      returnUrl: `/jobs/${jobId}`,
    }));
  };
  
  const saveJobPost = (data: Record<string, unknown>) => {
    setState(prev => ({
      ...prev,
      savedJobPostData: data,
      returnUrl: '/jobs/post',
    }));
  };
  
  const saveReturnUrl = (url: string) => {
    setState(prev => ({ ...prev, returnUrl: url }));
  };
  
  const clearSavedState = () => {
    setState(prev => ({
      ...prev,
      savedJobId: undefined,
      savedJobPostData: undefined,
      savedApplicationData: undefined,
      returnUrl: undefined,
    }));
  };
  
  // Mark completions
  const markEmailVerified = () => {
    setState(prev => ({ ...prev, isEmailVerified: true }));
  };
  
  const markProfileCompleted = () => {
    setState(prev => ({ ...prev, isProfileCompleted: true }));
  };
  
  const markBankDetailsCompleted = () => {
    setState(prev => ({ ...prev, isBankDetailsCompleted: true }));
  };
  
  const markWelcomeBannerSeen = () => {
    setState(prev => ({ ...prev, hasSeenWelcomeBanner: true }));
  };
  
  const incrementJobsCompleted = () => {
    setState(prev => ({
      ...prev,
      jobsCompleted: prev.jobsCompleted + 1,
      hasCompletedFirstJob: true,
    }));
  };
  
  const incrementJobsPosted = () => {
    setState(prev => ({
      ...prev,
      jobsPosted: prev.jobsPosted + 1,
      hasPostedFirstJob: true,
    }));
  };
  
  const incrementReviewsGiven = () => {
    setState(prev => ({ ...prev, reviewsGiven: prev.reviewsGiven + 1 }));
  };
  
  // Helper methods
  const needsProfileSetup = () => {
    return !state.isProfileCompleted;
  };
  
  const needsBankSetup = () => {
    return !state.isBankDetailsCompleted;
  };
  
  const isFirstTimeUser = () => {
    return state.jobsCompleted === 0 && state.jobsPosted === 0;
  };
  
  const getWorkflowProgress = (): number => {
    let progress = 0;
    
    if (state.isEmailVerified) progress += 20;
    if (state.isProfileCompleted) progress += 20;
    if (state.isBankDetailsCompleted) progress += 20;
    if (state.hasAppliedToFirstJob || state.hasPostedFirstJob) progress += 20;
    if (state.hasCompletedFirstJob) progress += 20;
    
    return progress;
  };
  
  const value: WorkflowContextType = {
    state,
    checkProfileComplete,
    checkBankDetailsComplete,
    checkCanApplyToJob,
    checkCanPostJob,
    updateStage,
    updateFreelancerStage,
    updateClientStage,
    saveJobApplication,
    saveJobPost,
    saveReturnUrl,
    clearSavedState,
    markEmailVerified,
    markProfileCompleted,
    markBankDetailsCompleted,
    markWelcomeBannerSeen,
    incrementJobsCompleted,
    incrementJobsPosted,
    incrementReviewsGiven,
    needsProfileSetup,
    needsBankSetup,
    isFirstTimeUser,
    getWorkflowProgress,
  };
  
  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}
