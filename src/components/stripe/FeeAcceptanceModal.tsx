'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';
import { AlertTriangle, Check, CreditCard, DollarSign, Info, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface FeeAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  proposalAmount?: number;
  jobTitle?: string;
}

export function FeeAcceptanceModal({ 
  isOpen, 
  onClose, 
  onAccept, 
  proposalAmount = 1000,
  jobTitle = "Sample Project" 
}: FeeAcceptanceModalProps) {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const platformFee = proposalAmount * 0.07;
  const youWillReceive = proposalAmount - platformFee;

  const handleAccept = async () => {
    if (!hasAccepted) {
      toast.error('Please check the acceptance box first');
      return;
    }

    setLoading(true);
    try {
      await onAccept();
    } catch (error) {
      console.error('Error accepting fee:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center border-b">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Platform Fee Agreement</CardTitle>
          <CardDescription>
            Please review and accept our platform fee structure to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Project Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Proposal Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Project:</span>
                <span className="font-medium">{jobTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Proposal Amount:</span>
                <span className="font-medium">${proposalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Payment Breakdown</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Client Pays (Total Project Cost)</span>
                <span className="font-semibold">${proposalAmount.toFixed(2)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center text-red-600">
                <span>NepLancer Platform Fee (7%)</span>
                <span className="font-semibold">-${platformFee.toFixed(2)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center text-lg font-bold text-green-600">
                <span>You Will Receive</span>
                <span>${youWillReceive.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Platform Benefits */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">What You Get</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Secure escrow payment protection</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Dispute resolution service</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Client verification & screening</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>24/7 customer support</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Professional profile & portfolio</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Marketing & job matching</span>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <h4 className="font-semibold text-yellow-900 mb-2">Important Notes:</h4>
                <ul className="space-y-1 text-yellow-800">
                  <li>• The 7% fee is automatically deducted when payment is released</li>
                  <li>• Clients pay the full amount you proposed</li>
                  <li>• Fees help us maintain platform security and services</li>
                  <li>• This is a one-time acceptance for your account</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Terms Acceptance */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="feeAcceptance"
                checked={hasAccepted}
                onChange={(e) => setHasAccepted(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="feeAcceptance" className="text-sm cursor-pointer">
                <span className="font-semibold">I understand and accept</span> that NepLancer will charge a 7% platform fee on all payments I receive. This fee covers platform services including payment processing, dispute resolution, and customer support. I acknowledge that:
                <br /><br />
                • The fee will be automatically deducted from each payment
                <br />
                • This agreement applies to all future projects on NepLancer
                <br />
                • I have read and agree to the{' '}
                <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>
        </CardContent>

        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!hasAccepted || loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Processing...' : 'Accept & Continue'}
          </Button>
        </div>
      </Card>
    </div>
  );
}