'use client';

import React, { useState } from 'react';
import MockPaymentSystem from '@/components/MockPaymentSystem';
import MockContractCompletion from '@/components/MockContractCompletion';
import { Play, ArrowRight, DollarSign, Users, Shield, Star } from 'lucide-react';

export default function TransactionDemoPage() {
  const [currentDemo, setCurrentDemo] = useState<'payment' | 'completion' | null>(null);
  const [demoStep, setDemoStep] = useState(1);

  const mockJob = {
    title: 'E-commerce Website Development',
    budget: 2500,
    description: 'Build a modern e-commerce website with React and Node.js'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0CF574]/5 to-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Neplancer Transaction Flow Demo
          </h1>
          <p className="text-xl text-gray-600">
            See how our secure payment system protects both clients and freelancers
          </p>
        </div>

        {/* Demo Flow Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">1. Client Posts Job</h3>
            <p className="text-sm text-gray-600">Client creates job and adds secure payment method</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">2. Escrow Protection</h3>
            <p className="text-sm text-gray-600">Funds held safely in escrow until work is completed</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">3. Work Delivery</h3>
            <p className="text-sm text-gray-600">Freelancer completes and delivers the project</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold mb-2">4. Payment Release</h3>
            <p className="text-sm text-gray-600">After approval, freelancer gets 93% (7% platform fee)</p>
          </div>
        </div>

        {/* Demo Buttons */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl p-8 shadow-lg border">
            <h2 className="text-2xl font-bold mb-4">💳 Payment & Escrow Demo</h2>
            <p className="text-gray-600 mb-6">
              Experience how clients securely pay for jobs and how funds are protected in escrow
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#0CF574] rounded-full"></div>
                <span className="text-sm">Mock payment methods (Visa, Mastercard)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#0CF574] rounded-full"></div>
                <span className="text-sm">Secure escrow system</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#0CF574] rounded-full"></div>
                <span className="text-sm">Real-time payment processing</span>
              </div>
            </div>
            <button
              onClick={() => setCurrentDemo('payment')}
              className="w-full bg-[#0CF574] text-gray-900 py-3 rounded-lg hover:bg-[#0CF574]/90 font-semibold flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Try Payment Flow
            </button>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg border">
            <h2 className="text-2xl font-bold mb-4">🎯 Project Completion Demo</h2>
            <p className="text-gray-600 mb-6">
              See how projects are delivered, reviewed, and how payments are distributed
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#0CF574] rounded-full"></div>
                <span className="text-sm">Work delivery simulation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#0CF574] rounded-full"></div>
                <span className="text-sm">7-day review period</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#0CF574] rounded-full"></div>
                <span className="text-sm">Automatic payment distribution</span>
              </div>
            </div>
            <button
              onClick={() => setCurrentDemo('completion')}
              className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-black font-semibold flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Try Completion Flow
            </button>
          </div>
        </div>

        {/* Transaction Breakdown */}
        <div className="bg-white rounded-xl p-8 shadow-lg border mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">💰 Transaction Breakdown Example</h2>
          <div className="max-w-md mx-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Project Budget:</span>
                <span className="font-semibold text-lg">${mockJob.budget.toLocaleString()}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Freelancer Earnings (93%):</span>
                  <span className="font-semibold text-green-600">
                    ${(mockJob.budget * 0.93).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Platform Fee (7%):</span>
                  <span className="font-semibold text-blue-600">
                    ${(mockJob.budget * 0.07).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Protected:</span>
                  <span className="font-bold text-xl text-[#0CF574]">
                    ${mockJob.budget.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-gradient-to-r from-[#0CF574]/10 to-blue-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">🛡️ Why Our System is Secure</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[#0CF574]" />
              </div>
              <h3 className="font-semibold mb-2">Escrow Protection</h3>
              <p className="text-sm text-gray-600">
                Funds held safely until work is completed and approved
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-[#0CF574]" />
              </div>
              <h3 className="font-semibold mb-2">Instant Payments</h3>
              <p className="text-sm text-gray-600">
                Freelancers get paid immediately after project approval
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-[#0CF574]" />
              </div>
              <h3 className="font-semibold mb-2">Fair Fees</h3>
              <p className="text-sm text-gray-600">
                Only 7% platform fee - one of the lowest in the industry
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Modals */}
      <MockPaymentSystem
        isOpen={currentDemo === 'payment'}
        onClose={() => setCurrentDemo(null)}
        jobBudget={mockJob.budget}
        onPaymentComplete={(paymentId) => {
          setCurrentDemo(null);
          alert(`🎉 Payment successful! Job posted with payment ID: ${paymentId}`);
        }}
      />

      <MockContractCompletion
        isOpen={currentDemo === 'completion'}
        onClose={() => setCurrentDemo(null)}
        contractAmount={mockJob.budget}
        jobTitle={mockJob.title}
      />
    </div>
  );
}