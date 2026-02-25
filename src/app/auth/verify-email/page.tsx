'use client';

import { useState } from 'react';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      // Get the current user's email from localStorage
      const email = localStorage.getItem('pendingVerificationEmail');
      
      if (!email) {
        toast.error('Email not found. Please register again.');
        return;
      }

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Mail className="h-20 w-20 text-green-600" />
              <div className="absolute -top-2 -right-2 bg-green-100 rounded-full p-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Check Your Email
          </h1>

          <p className="text-gray-600 mb-6">
            We've sent you a verification link to your email address. Please check your inbox and click the link to verify your account.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 mb-2">
              <strong>What to do next:</strong>
            </p>
            <ul className="text-sm text-blue-700 space-y-1 text-left list-disc list-inside">
              <li>Check your inbox for an email from Neplancer</li>
              <li>Click the verification link in the email</li>
              <li>You'll be automatically redirected to your dashboard</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>Didn't receive the email?</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-1 text-left mt-2 pl-4">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email address</li>
              <li>• Wait a few minutes and try again</li>
            </ul>
          </div>

          <button
            onClick={handleResendEmail}
            disabled={resending}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? 'Sending...' : 'Resend Verification Email'}
          </button>

          <Link
            href="/login"
            className="flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            Back to Login
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
