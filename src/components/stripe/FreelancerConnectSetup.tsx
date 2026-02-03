'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';
import { AlertTriangle, Check, CreditCard, DollarSign, ExternalLink, Loader2, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { FeeAcceptanceModal } from './FeeAcceptanceModal';

interface FreelancerConnectSetupProps {
  onSetupComplete?: (accountId: string) => void;
  className?: string;
}

export function FreelancerConnectSetup({ onSetupComplete, className }: FreelancerConnectSetupProps) {
  const [loading, setLoading] = useState(false);
  const [connectAccount, setConnectAccount] = useState<any>(null);
  const [setupStatus, setSetupStatus] = useState<'not_started' | 'fee_pending' | 'account_pending' | 'onboarding_pending' | 'complete'>('not_started');
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check current setup status on load
  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await fetch('/api/stripe/connect/status');
      const data = await response.json();
      
      if (data.account) {
        setConnectAccount(data.account);
        if (data.account.details_submitted && data.account.charges_enabled) {
          setSetupStatus('complete');
        } else {
          setSetupStatus('onboarding_pending');
        }
      } else if (data.feeAccepted) {
        setSetupStatus('account_pending');
      } else {
        setSetupStatus('fee_pending');
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
      setSetupStatus('not_started');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFeeAcceptance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/connect/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feeAccepted: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept fee');
      }

      setShowFeeModal(false);
      setSetupStatus('account_pending');
      toast.success('Fee acceptance recorded! Now let\'s set up your payment account.');
      
    } catch (error: any) {
      console.error('Error accepting fee:', error);
      toast.error(error.message || 'Failed to accept fee');
    } finally {
      setLoading(false);
    }
  };

  const createConnectAccount = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/connect/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createAccount: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account');
      }

      setConnectAccount(data.account);
      setSetupStatus('onboarding_pending');
      toast.success('Payment account created! Please complete the onboarding process.');
      
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast.error(error.message || 'Failed to create payment account');
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/connect/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to start onboarding');
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url;
      
    } catch (error: any) {
      console.error('Error starting onboarding:', error);
      toast.error(error.message || 'Failed to start onboarding process');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    setCheckingStatus(true);
    await checkSetupStatus();
    if (setupStatus === 'complete') {
      toast.success('Payment setup completed successfully!');
      onSetupComplete?.(connectAccount?.id);
    }
  };

  if (checkingStatus) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Checking payment setup status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            {setupStatus === 'complete' ? (
              <Check className="w-8 h-8 text-green-600" />
            ) : (
              <CreditCard className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <CardTitle className="text-xl">
            {setupStatus === 'complete' ? 'Payment Setup Complete' : 'Payment Account Setup'}
          </CardTitle>
          <CardDescription>
            {setupStatus === 'complete' 
              ? 'You can now receive payments from clients'
              : 'Set up your account to receive payments securely'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Setup Progress */}
          <div className="space-y-4">
            <h3 className="font-semibold">Setup Progress</h3>
            
            <div className="space-y-3">
              {/* Step 1: Fee Acceptance */}
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  setupStatus === 'not_started' ? 'bg-gray-200' : 'bg-green-100'
                }`}>
                  {setupStatus === 'not_started' ? (
                    <span className="text-xs font-semibold text-gray-600">1</span>
                  ) : (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">Accept Platform Fee (7%)</div>
                  <div className="text-sm text-gray-600">Understand our fee structure</div>
                </div>
                <Badge variant={setupStatus === 'not_started' ? 'outline' : 'default'}>
                  {setupStatus === 'not_started' ? 'Pending' : 'Complete'}
                </Badge>
              </div>

              {/* Step 2: Account Creation */}
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  setupStatus === 'not_started' || setupStatus === 'fee_pending' ? 'bg-gray-200' : 
                  setupStatus === 'account_pending' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {setupStatus === 'account_pending' ? (
                    <span className="text-xs font-semibold text-blue-600">2</span>
                  ) : setupStatus === 'not_started' || setupStatus === 'fee_pending' ? (
                    <span className="text-xs font-semibold text-gray-600">2</span>
                  ) : (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">Create Payment Account</div>
                  <div className="text-sm text-gray-600">Set up your Stripe account</div>
                </div>
                <Badge variant={
                  setupStatus === 'not_started' || setupStatus === 'fee_pending' ? 'outline' :
                  setupStatus === 'account_pending' ? 'secondary' : 'default'
                }>
                  {setupStatus === 'not_started' || setupStatus === 'fee_pending' ? 'Pending' :
                   setupStatus === 'account_pending' ? 'Ready' : 'Complete'}
                </Badge>
              </div>

              {/* Step 3: Onboarding */}
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  setupStatus === 'onboarding_pending' ? 'bg-blue-100' :
                  setupStatus === 'complete' ? 'bg-green-100' : 'bg-gray-200'
                }`}>
                  {setupStatus === 'onboarding_pending' ? (
                    <span className="text-xs font-semibold text-blue-600">3</span>
                  ) : setupStatus === 'complete' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <span className="text-xs font-semibold text-gray-600">3</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">Complete Onboarding</div>
                  <div className="text-sm text-gray-600">Verify your identity and banking details</div>
                </div>
                <Badge variant={
                  setupStatus === 'onboarding_pending' ? 'secondary' :
                  setupStatus === 'complete' ? 'default' : 'outline'
                }>
                  {setupStatus === 'onboarding_pending' ? 'In Progress' :
                   setupStatus === 'complete' ? 'Complete' : 'Pending'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-4">
            {setupStatus === 'not_started' && (
              <Button
                onClick={() => setShowFeeModal(true)}
                className="w-full"
                size="lg"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Start Setup - Review Fee Structure
              </Button>
            )}

            {setupStatus === 'fee_pending' && (
              <Button
                onClick={() => setShowFeeModal(true)}
                className="w-full"
                size="lg"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Accept 7% Platform Fee
              </Button>
            )}

            {setupStatus === 'account_pending' && (
              <Button
                onClick={createConnectAccount}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <User className="w-5 h-5 mr-2" />
                )}
                Create Payment Account
              </Button>
            )}

            {setupStatus === 'onboarding_pending' && (
              <div className="space-y-3">
                <Button
                  onClick={startOnboarding}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="w-5 h-5 mr-2" />
                  )}
                  Complete Onboarding with Stripe
                </Button>
                
                <Button
                  onClick={refreshStatus}
                  disabled={checkingStatus}
                  variant="outline"
                  className="w-full"
                >
                  {checkingStatus ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Check Completion Status
                </Button>
              </div>
            )}

            {setupStatus === 'complete' && (
              <div className="text-center py-4">
                <div className="text-green-600 font-semibold text-lg mb-2">
                  ✅ Payment setup complete!
                </div>
                <p className="text-gray-600 mb-4">
                  You can now receive payments from clients. Payments will be processed securely through Stripe.
                </p>
                <Button
                  onClick={refreshStatus}
                  disabled={checkingStatus}
                  variant="outline"
                >
                  {checkingStatus ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Refresh Status
                </Button>
              </div>
            )}
          </div>

          {/* Info Section */}
          {setupStatus !== 'complete' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <h4 className="font-semibold text-blue-900 mb-1">Secure Payment Processing</h4>
                  <p className="text-blue-800">
                    We use Stripe Connect for secure payment processing. Your banking information is encrypted and never stored on our servers. The 7% platform fee helps us maintain security, provide customer support, and improve our services.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Acceptance Modal */}
      <FeeAcceptanceModal
        isOpen={showFeeModal}
        onClose={() => setShowFeeModal(false)}
        onAccept={handleFeeAcceptance}
      />
    </>
  );
}