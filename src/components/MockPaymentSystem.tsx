'use client';

import React, { useState } from 'react';
import { CreditCard, Shield, Clock, CheckCircle2, DollarSign, AlertTriangle } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  name: string;
  last4: string;
  expiry?: string;
  isDefault: boolean;
}

interface MockPaymentSystemProps {
  isOpen: boolean;
  onClose: () => void;
  jobBudget: number;
  onPaymentComplete: (paymentId: string) => void;
}

export default function MockPaymentSystem({ 
  isOpen, 
  onClose, 
  jobBudget, 
  onPaymentComplete 
}: MockPaymentSystemProps) {
  const [step, setStep] = useState<'method' | 'confirm' | 'processing' | 'complete'>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [newCard, setNewCard] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const mockPaymentMethods: PaymentMethod[] = [
    {
      id: 'card_1',
      type: 'card',
      name: 'Visa ending in 4242',
      last4: '4242',
      expiry: '12/26',
      isDefault: true
    },
    {
      id: 'card_2',
      type: 'card',
      name: 'Mastercard ending in 8888',
      last4: '8888',
      expiry: '03/27',
      isDefault: false
    }
  ];

  const platformFee = jobBudget * 0.07; // 7% fee
  const freelancerAmount = jobBudget - platformFee;

  if (!isOpen) return null;

  const handleAddCard = () => {
    // Mock card validation
    if (!newCard.number || !newCard.expiry || !newCard.cvv || !newCard.name) {
      alert('Please fill all card details');
      return;
    }

    const mockNewCard: PaymentMethod = {
      id: 'card_new',
      type: 'card',
      name: `${newCard.name.split(' ')[0]} ending in ${newCard.number.slice(-4)}`,
      last4: newCard.number.slice(-4),
      expiry: newCard.expiry,
      isDefault: false
    };

    setSelectedMethod(mockNewCard);
    setStep('confirm');
  };

  const handlePayment = () => {
    setStep('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      setStep('complete');
      onPaymentComplete('payment_' + Date.now());
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        
        {/* Step 1: Payment Method Selection */}
        {step === 'method' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">💳 Payment Method</h2>
              <p className="text-gray-600">Secure your job posting with payment</p>
            </div>

            <div className="space-y-4 mb-6">
              {mockPaymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedMethod(method)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedMethod?.id === method.id 
                      ? 'border-[#0CF574] bg-[#0CF574]/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                      </div>
                    </div>
                    {method.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Card Section */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Add New Card</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Card Number (e.g., 4242424242424242)"
                  value={newCard.number}
                  onChange={(e) => setNewCard({...newCard, number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  maxLength={19}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={newCard.expiry}
                    onChange={(e) => setNewCard({...newCard, expiry: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                    maxLength={5}
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    value={newCard.cvv}
                    onChange={(e) => setNewCard({...newCard, cvv: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                    maxLength={4}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  value={newCard.name}
                  onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={handleAddCard}
                  className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-black transition"
                >
                  Add Card & Continue
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              {selectedMethod && (
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 bg-[#0CF574] text-gray-900 py-2 rounded-lg hover:bg-[#0CF574]/90"
                >
                  Continue
                </button>
              )}
            </div>
          </>
        )}

        {/* Step 2: Payment Confirmation */}
        {step === 'confirm' && selectedMethod && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🔒 Confirm Payment</h2>
              <p className="text-gray-600">Review your payment details</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold">Secure Escrow Payment</p>
                  <p className="text-sm text-gray-600">Funds held safely until work is completed</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Job Budget:</span>
                  <span className="font-medium">${jobBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee (7%):</span>
                  <span>-${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Freelancer will receive:</span>
                  <span className="text-[#0CF574]">${freelancerAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">{selectedMethod.name}</p>
                  <p className="text-sm text-gray-500">Expires {selectedMethod.expiry}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900">How Escrow Works:</p>
                  <ul className="text-blue-700 mt-2 space-y-1">
                    <li>• Funds are held securely until work is delivered</li>
                    <li>• Freelancer gets paid after you approve the work</li>
                    <li>• 7-day dispute resolution period</li>
                    <li>• Your money is protected throughout the process</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('method')}
                className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 bg-[#0CF574] text-gray-900 py-3 rounded-lg hover:bg-[#0CF574]/90 font-semibold"
              >
                Pay ${jobBudget.toLocaleString()}
              </button>
            </div>
          </>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0CF574] border-t-transparent mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600">Securing your funds in escrow...</p>
            <div className="mt-6 text-sm text-gray-500">
              <p>🔒 Bank-level encryption</p>
              <p>🛡️ PCI DSS compliant</p>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="text-center py-4">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Secured! 🎉</h2>
            <p className="text-gray-600 mb-6">Your job is now live and funds are safely held in escrow</p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Amount Secured:</span>
                  <span className="font-semibold">${jobBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Freelancer Earnings:</span>
                  <span className="font-semibold text-green-600">${freelancerAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee:</span>
                  <span className="font-semibold">${platformFee.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-6">
              <p>✅ Job posted and visible to freelancers</p>
              <p>✅ Payment secured in escrow</p>
              <p>✅ You'll be notified when proposals arrive</p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#0CF574] text-gray-900 py-3 rounded-lg hover:bg-[#0CF574]/90 font-semibold"
            >
              View My Job Posting
            </button>
          </div>
        )}
      </div>
    </div>
  );
}