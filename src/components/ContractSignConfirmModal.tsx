"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, FileCheck, Keyboard } from 'lucide-react';

interface ContractSignConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signature: string) => void;
  contractTitle: string;
  userRole: 'client' | 'freelancer';
  isLoading?: boolean;
}

export default function ContractSignConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  contractTitle,
  userRole,
  isLoading = false
}: ContractSignConfirmModalProps) {
  const [typedSignature, setTypedSignature] = useState('');
  
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (typedSignature.trim()) {
      onConfirm(typedSignature);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Confirm Contract Signature</h2>
              <p className="text-sm text-gray-500">Please review before proceeding</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Contract Title</p>
                <p className="text-sm text-blue-700 mt-1">{contractTitle}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900">
              Final Review
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-900">Important Notice</p>
                  <ul className="text-sm text-amber-800 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold mt-0.5">•</span>
                      <span>Once signed, the contract terms become <strong>legally binding</strong></span>
                    </li>
                    {userRole === 'freelancer' ? (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold mt-0.5">•</span>
                          <span>The contract will be <strong>locked</strong> and cannot be edited by the client</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold mt-0.5">•</span>
                          <span>You must deliver work according to the agreed terms and deadline</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold mt-0.5">•</span>
                          <span>You can still <strong>edit the contract</strong> until the freelancer signs</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold mt-0.5">•</span>
                          <span>You must pay the agreed amount upon successful work completion</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="space-y-2 pt-2">
              <label className="block text-sm font-bold text-gray-900">
                Authorized Signature
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Type your full legal name below to sign this contract. This acts as your electronic signature.
              </p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Keyboard className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Your Full Name"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-signature"
                  disabled={isLoading}
                />
              </div>
              <p className="text-[10px] text-gray-400 italic">
                By typing your name, you are electronically signing this document.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-[10px] text-gray-600 leading-relaxed">
                By signing this contract, you agree to abide by the terms outlined in the contract and 
                Neplancer&apos;s Terms of Service. Any violation may result in account restrictions, payment 
                withholding, or legal action as per our platform policies.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-black hover:bg-gray-800 disabled:bg-gray-400"
            disabled={isLoading || !typedSignature.trim()}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Sign & Accept'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
