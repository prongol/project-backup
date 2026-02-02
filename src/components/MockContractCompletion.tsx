'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertTriangle, DollarSign, Star, FileText, MessageSquare } from 'lucide-react';

interface MockContractCompletionProps {
  isOpen: boolean;
  onClose: () => void;
  contractAmount: number;
  jobTitle: string;
}

export default function MockContractCompletion({
  isOpen,
  onClose,
  contractAmount,
  jobTitle
}: MockContractCompletionProps) {
  const [step, setStep] = useState<'delivery' | 'review' | 'dispute' | 'payment'>('delivery');
  const [reviewPeriodLeft, setReviewPeriodLeft] = useState(7);
  const [isDispute, setIsDispute] = useState(false);
  
  const platformFee = contractAmount * 0.07;
  const freelancerEarnings = contractAmount - platformFee;

  useEffect(() => {
    if (step === 'review' && reviewPeriodLeft > 0) {
      const timer = setTimeout(() => {
        setReviewPeriodLeft(prev => prev - 1);
      }, 1000); // Speed up for demo - normally would be days
      
      if (reviewPeriodLeft === 1 && !isDispute) {
        setStep('payment');
      }
      
      return () => clearTimeout(timer);
    }
  }, [step, reviewPeriodLeft, isDispute]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 animate-in fade-in zoom-in duration-200">
        
        {/* Step 1: Work Delivery */}
        {step === 'delivery' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🚀 Work Delivered!</h2>
              <p className="text-gray-600">Freelancer has submitted the completed work</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">{jobTitle}</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    "I've completed the project according to your requirements. 
                    Please review the deliverables and let me know if any revisions are needed."
                  </p>
                  <div className="mt-3 space-y-1 text-sm text-blue-600">
                    <p>📁 main-project.zip (2.3 MB)</p>
                    <p>📁 source-code.zip (1.1 MB)</p>
                    <p>📄 documentation.pdf (450 KB)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-900">Review Period Started</p>
                  <p className="text-yellow-700 mt-1">
                    You have 7 days to review the work. If no disputes are raised, 
                    payment will be automatically released to the freelancer.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('review')}
                className="flex-1 bg-[#0CF574] text-gray-900 py-3 rounded-lg hover:bg-[#0CF574]/90 font-semibold"
              >
                Start Review
              </button>
              <button
                onClick={onClose}
                className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </>
        )}

        {/* Step 2: Review Period */}
        {step === 'review' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">⏰ Review Period</h2>
              <p className="text-gray-600">Client is reviewing the delivered work</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-green-50 border rounded-lg p-6 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {reviewPeriodLeft}
                </div>
                <p className="text-sm text-gray-600">
                  Days left in review period
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((7 - reviewPeriodLeft) / 7) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Contract Amount:</span>
                    <span className="font-medium">${contractAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Platform Fee (7%):</span>
                    <span>-${platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Freelancer Earnings:</span>
                    <span className="text-green-600">${freelancerEarnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Auto-Payment Protection</span>
                </div>
                <p className="text-sm text-green-700">
                  If no disputes are raised, payment will automatically be released to 
                  the freelancer when the review period ends.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDispute(true);
                  setStep('dispute');
                }}
                className="flex-1 border border-red-300 text-red-600 py-3 rounded-lg hover:bg-red-50"
              >
                Raise Dispute
              </button>
              <button
                onClick={() => setStep('payment')}
                className="flex-1 bg-[#0CF574] text-gray-900 py-3 rounded-lg hover:bg-[#0CF574]/90 font-semibold"
              >
                Approve & Pay Now
              </button>
            </div>
          </>
        )}

        {/* Step 3: Dispute (Optional) */}
        {step === 'dispute' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">⚠️ Dispute Raised</h2>
              <p className="text-gray-600">Let's resolve this together</p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <div className="text-sm">
                  <p className="font-semibold text-orange-900">Dispute Resolution Process</p>
                  <ul className="text-orange-700 mt-2 space-y-1">
                    <li>• Both parties can communicate through our platform</li>
                    <li>• Mediator will review evidence within 48 hours</li>
                    <li>• Funds remain safely in escrow during resolution</li>
                    <li>• Most disputes are resolved within 3-5 business days</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3">Common Resolutions</h3>
              <div className="space-y-2">
                <button className="w-full text-left p-3 bg-white border rounded-lg hover:border-blue-300">
                  <span className="font-medium">Request Revisions</span>
                  <p className="text-sm text-gray-600">Ask freelancer to make specific changes</p>
                </button>
                <button className="w-full text-left p-3 bg-white border rounded-lg hover:border-blue-300">
                  <span className="font-medium">Partial Payment</span>
                  <p className="text-sm text-gray-600">Pay for completed portions of work</p>
                </button>
                <button className="w-full text-left p-3 bg-white border rounded-lg hover:border-blue-300">
                  <span className="font-medium">Full Refund</span>
                  <p className="text-sm text-gray-600">Cancel project and get money back</p>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('review')}
                className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50"
              >
                Cancel Dispute
              </button>
              <button
                onClick={() => setStep('payment')}
                className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600"
              >
                Continue Resolution
              </button>
            </div>
          </>
        )}

        {/* Step 4: Payment Released */}
        {step === 'payment' && (
          <>
            <div className="text-center mb-6">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">💰 Payment Released!</h2>
              <p className="text-gray-600">Transaction completed successfully</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-900 mb-4">Payment Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span>Freelancer Earnings</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    ${freelancerEarnings.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-blue-600" />
                    <span>Platform Fee (7%)</span>
                  </div>
                  <span className="font-semibold text-gray-600">
                    ${platformFee.toFixed(2)}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total Project Value</span>
                    <span className="font-bold text-lg">
                      ${contractAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-sm space-y-2">
                <p><strong>✅ Payment Status:</strong> Completed</p>
                <p><strong>📅 Processing Time:</strong> Instant</p>
                <p><strong>🏦 Freelancer Payment:</strong> Deposited to their account</p>
                <p><strong>📊 Platform Fee:</strong> Deducted for service & protection</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Leave a Review</h3>
              <p className="text-sm text-gray-600 mb-3">Help other clients by sharing your experience</p>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className="w-5 h-5 text-yellow-400 fill-yellow-400 cursor-pointer" 
                  />
                ))}
              </div>
              <textarea 
                placeholder="Great work! The freelancer delivered exactly what I needed..."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-[#0CF574] text-gray-900 py-3 rounded-lg hover:bg-[#0CF574]/90 font-semibold"
              >
                Submit Review
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}