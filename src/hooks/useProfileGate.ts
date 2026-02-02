'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useCallback } from 'react';

export function useProfileGate() {
  const { user } = useAuth();
  const [gateOpen, setGateOpen] = useState(false);
  const [gateType, setGateType] = useState<'profile' | 'bank'>('profile');
  const [returnUrl, setReturnUrl] = useState<string>('');
  const [skipRequirement, setSkipRequirement] = useState(false);

  const checkProfileCompletion = useCallback(() => {
    if (!user) return false;
    return user.profile_completed === true;
  }, [user]);

  const checkBankDetails = useCallback(() => {
    if (!user) return false;
    return user.bank_details_completed === true;
  }, [user]);

  const requireProfileCompletion = useCallback((returnTo?: string) => {
    if (!checkProfileCompletion() && !skipRequirement) {
      setGateType('profile');
      setReturnUrl(returnTo || '');
      setGateOpen(true);
      return false;
    }
    return true;
  }, [checkProfileCompletion, skipRequirement]);

  const requireBankDetails = useCallback((returnTo?: string) => {
    if (!checkBankDetails() && !skipRequirement) {
      setGateType('bank');
      setReturnUrl(returnTo || '');
      setGateOpen(true);
      return false;
    }
    return true;
  }, [checkBankDetails, skipRequirement]);

  const closeGate = useCallback(() => {
    setGateOpen(false);
    setSkipRequirement(true); // Allow skipping after user clicks "I'll do this later"
  }, []);

  return {
    user,
    gateOpen,
    gateType,
    returnUrl,
    closeGate,
    requireProfileCompletion,
    requireBankDetails,
    isProfileComplete: checkProfileCompletion(),
    isBankDetailsComplete: checkBankDetails(),
  };
}
