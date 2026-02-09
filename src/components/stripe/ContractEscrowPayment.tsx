'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { AlertTriangle, Check, CreditCard, DollarSign, Info, Loader2, Lock, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface ContractEscrowPaymentProps {
  contractId: string;
  freelancerId: string;
  amount: number;
  title: string;
  requirements?: string[];
  onPaymentComplete?: (paymentId: string) => void;
  className?: string;
}

interface PaymentFormProps {
  contractId: string;
  freelancerId: string;
  amount: number;
  title: string;
  requirements: string[];
  onPaymentComplete?: (paymentId: string) => void;
}

function PaymentForm({ 
  contractId, 
  freelancerId, 
  amount, 
  title, 
  requirements,
  onPaymentComplete 
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [useNewCard, setUseNewCard] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  const platformFee = amount * 0.07;
  const totalAmount = amount; // Client pays full amount, platform fee deducted from freelancer

  useEffect(() => {
    loadPaymentMethods();
    createPaymentIntent();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/stripe/payment-methods');
      const data = await response.json();
      
      if (data.paymentMethods) {
        setPaymentMethods(data.paymentMethods);
        if (data.paymentMethods.length > 0) {
          setSelectedPaymentMethod(data.paymentMethods[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount,
          contractId,
          freelancerId
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create payment intent');
      }

      setClientSecret(data.clientSecret);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      toast.error(error.message || 'Failed to prepare payment');
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    try {
      let paymentResult;

      if (useNewCard || paymentMethods.length === 0) {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        // Confirm the payment with the card element
        // Since capture_method is 'manual', this will only authorize the funds
        paymentResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              // You can add more details here if needed
            },
          },
        });
      } else {
        // Use existing payment method
        paymentResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: selectedPaymentMethod,
        });
      }

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message);
      }

      if (paymentResult.paymentIntent?.status === 'requires_capture' || paymentResult.paymentIntent?.status === 'succeeded') {
        // Now update our database via the escrow API
        // This makes sure our DB records the payment as authorized/held
        const response = await fetch('/api/stripe/escrow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contractId,
            freelancerId,
            amount: totalAmount,
            paymentIntentId: paymentResult.paymentIntent.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to record payment in database');
        }

        toast.success('Payment secured in escrow! Freelancer can now start work.');
        onPaymentComplete?.(data.paymentId);
      } else {
        throw new Error(`Unexpected payment status: ${paymentResult.paymentIntent?.status}`);
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-6">
      {/* Payment Amount Breakdown */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Payment Summary</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Project Amount</span>
            <span className="font-semibold">${amount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Platform Fee (deducted from freelancer)</span>
            <span>${platformFee.toFixed(2)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total You Pay</span>
            <span className="text-blue-600">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Project Requirements */}
      {requirements.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold">Project Requirements</h3>
          </div>
          <ul className="space-y-1 text-sm">
            {requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Payment Method Selection */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Payment Method</Label>
        
        {paymentMethods.length > 0 && (
          <div className="space-y-2">
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={pm.id}
                  name="paymentMethod"
                  value={pm.id}
                  checked={selectedPaymentMethod === pm.id && !useNewCard}
                  onChange={(e) => {
                    setSelectedPaymentMethod(e.target.value);
                    setUseNewCard(false);
                  }}
                />
                <label htmlFor={pm.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CreditCard className="w-5 h-5" />
                    <span>•••• •••• •••• {pm.card?.last4}</span>
                    <span className="text-sm text-gray-600">{pm.card?.brand?.toUpperCase()}</span>
                    <span className="text-sm text-gray-600">{pm.card?.exp_month}/{pm.card?.exp_year}</span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="new-card"
            name="paymentMethod"
            checked={useNewCard || paymentMethods.length === 0}
            onChange={() => setUseNewCard(true)}
          />
          <label htmlFor="new-card" className="cursor-pointer font-medium">
            Use new card
          </label>
        </div>

        {(useNewCard || paymentMethods.length === 0) && (
          <div className="border rounded-lg p-6 bg-white space-y-4">
            <Label className="block mb-2">Card Information</Label>
            <div className="border p-3 rounded-md">
              <CardElement 
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
            <p className="text-xs text-gray-600">
              Your card information is encrypted and securely processed by Stripe.
            </p>
          </div>
        )}
      </div>

      {/* Escrow Information */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Escrow Protection</h3>
        </div>
        
        <div className="space-y-2 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Your payment is held securely until work is completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>3-day review period after freelancer submits work</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Payment released automatically or through dispute resolution</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading || !clientSecret || !stripe}
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Secure Payment - ${totalAmount.toFixed(2)}
          </>
        )}
      </Button>

      {/* Terms */}
      <p className="text-xs text-gray-600 text-center">
        By clicking "Secure Payment", you agree to our{' '}
        <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
        {' '}and{' '}
        <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
        Your payment will be held in escrow until the project is completed.
      </p>
    </form>
  );
}

export function ContractEscrowPayment({
  contractId,
  freelancerId,
  amount,
  title,
  requirements = [],
  onPaymentComplete,
  className
}: ContractEscrowPaymentProps) {
  const [paymentStatus, setPaymentStatus] = useState<'not_started' | 'processing' | 'completed'>('not_started');

  const handlePaymentComplete = (paymentId: string) => {
    setPaymentStatus('completed');
    onPaymentComplete?.(paymentId);
  };

  if (paymentStatus === 'completed') {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-xl mb-2 text-green-600">Payment Secured!</CardTitle>
          <CardDescription>
            Your payment of ${amount.toFixed(2)} has been secured in escrow. The freelancer can now start working on your project.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Secure Escrow Payment
        </CardTitle>
        <CardDescription>
          Pay safely with escrow protection for "{title}"
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Elements stripe={stripePromise}>
          <PaymentForm
            contractId={contractId}
            freelancerId={freelancerId}
            amount={amount}
            title={title}
            requirements={requirements}
            onPaymentComplete={handlePaymentComplete}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}

      {/* Escrow Information */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Escrow Protection</h3>
        </div>
        
        <div className="space-y-2 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Your payment is held securely until work is completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>3-day review period after freelancer submits work</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Payment released automatically or through dispute resolution</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading || !clientSecret}
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Secure Payment - ${totalAmount.toFixed(2)}
          </>
        )}
      </Button>

      {/* Terms */}
      <p className="text-xs text-gray-600 text-center">
        By clicking "Secure Payment", you agree to our{' '}
        <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
        {' '}and{' '}
        <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
        Your payment will be held in escrow until the project is completed.
      </p>
    </form>
  );
}

export function ContractEscrowPayment({
  contractId,
  freelancerId,
  amount,
  title,
  requirements = [],
  onPaymentComplete,
  className
}: ContractEscrowPaymentProps) {
  const [paymentStatus, setPaymentStatus] = useState<'not_started' | 'processing' | 'completed'>('not_started');

  const handlePaymentComplete = (paymentId: string) => {
    setPaymentStatus('completed');
    onPaymentComplete?.(paymentId);
  };

  if (paymentStatus === 'completed') {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-xl mb-2 text-green-600">Payment Secured!</CardTitle>
          <CardDescription>
            Your payment of ${amount.toFixed(2)} has been secured in escrow. The freelancer can now start working on your project.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Secure Escrow Payment
        </CardTitle>
        <CardDescription>
          Pay safely with escrow protection for "{title}"
        </CardDescription>
      </CardHeader>

      <CardContent>
        <PaymentForm
          contractId={contractId}
          freelancerId={freelancerId}
          amount={amount}
          title={title}
          requirements={requirements}
          onPaymentComplete={handlePaymentComplete}
        />
      </CardContent>
    </Card>
  );
}