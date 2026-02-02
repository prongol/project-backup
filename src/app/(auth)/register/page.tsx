'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, signUpSchema } from '@/lib/validations';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'freelancer' as 'client' | 'freelancer',
    clientType: 'individual' as 'individual' | 'company', // New field
    username: '',
  });
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);

  // Real-time email validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value.trim();
    setFormData({ ...formData, email });
    
    if (!email) {
      setEmailError('');
      setIsEmailValid(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      setIsEmailValid(false);
      return;
    }

    // Check for disposable email domains
    const domain = email.split('@')[1]?.toLowerCase();
    const disposableDomains = ['tempmail.com', 'throwaway.email', '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'trashmail.com', 'temp-mail.org', 'fakeinbox.com', 'yopmail.com', 'getnada.com', 'maildrop.cc', 'mintemail.com'];
    
    if (domain && disposableDomains.includes(domain)) {
      setEmailError('Disposable email addresses are not allowed. Please use a real email address.');
      setIsEmailValid(false);
      return;
    }

    // Additional validation checks
    if (email.includes('..')) {
      setEmailError('Email cannot contain consecutive dots');
      setIsEmailValid(false);
      return;
    }

    const localPart = email.split('@')[0];
    if (localPart && (localPart.length === 0 || localPart.length > 64)) {
      setEmailError('Email format is invalid');
      setIsEmailValid(false);
      return;
    }

    // Email is valid
    setEmailError('');
    setIsEmailValid(true);
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
  };

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setEmailTouched(true);

  // Validate email first
  if (!formData.email) {
    setError('Email address is required');
    setEmailError('Email address is required');
    toast.error('Email address is required');
    return;
  }

  if (!isEmailValid) { //need to work on this,
    setError('Please enter a valid email address');
    toast.error('Please enter a valid email address');
    return;
  }

  // Validate full name
  if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
    setError('Please enter your full name (at least 2 characters)');
    toast.error('Please enter your full name');
    return;
  }

  // Validation for passwords
  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match');
    toast.error('Passwords do not match');
    return;
  }

  if (formData.password.length < 8) {
    setError('Password must be at least 8 characters');
    toast.error('Password must be at least 8 characters');
    return;
  }

  // Freelancer-specific validation
  if (formData.role === 'freelancer' && !formData.username.trim()) {
    setError('Username is required for freelancers');
    toast.error('Username is required for freelancers');
    return;
  }

  if (formData.role === 'freelancer' && formData.username.length < 3) {
    setError('Username must be at least 3 characters');
    toast.error('Username must be at least 3 characters');
    return;
  }
  
  try {
    // Step 1: Sign up the user via backend API
    const signUpResponse = await signUp({
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      fullName: formData.fullName.trim(),
      role: formData.role,
      username: formData.role === 'freelancer' ? formData.username : undefined,
      clientType: formData.role === 'client' ? formData.clientType : undefined,
    });

    // Backend handles:
    // ✅ Creating auth user
    // ✅ Creating profile
    // ✅ Creating role-specific record (freelancer/client)
    // ✅ Sending verification email
    // So registration is complete!

    // Step 2: Show success and redirect
    toast.success('Registration successful! Please check your email to verify your account.', {
      duration: 6000,
    });
    
    router.push('/auth/verify-email');

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
    setError(errorMessage);
    toast.error(errorMessage);
    console.log(errorMessage);
  }
};

  
  

  return (
    <div className={`${manrope.className} min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-[#0CF574]/10 px-4 py-12`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl w-full items-center">
        <div>
          <h1 className="text-6xl font-extrabold text-left -tracking-wider text-gray-900">Join Neplancer</h1>
          <p className="mt-2 text-left text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-gray-900 hover:text-gray-700 underline">
              Log in
            </Link>
          </p>
        </div>

        {/* Form Section */}
        <div className="max-w-md w-full space-y-8 mx-auto lg:mx-0">
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              I want to
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'freelancer' })}
                className={`flex-1 py-4 px-4 border-2 rounded-lg font-semibold transition-all duration-200 ${
                  formData.role === 'freelancer'
                    ? 'border-[#0CF574] bg-[#0CF574]/10 text-gray-900 shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 cursor-pointer'
                }`}
              >
                <div className="text-2xl mb-1">💼</div>
                <div className="font-bold">Find Work</div>
                <div className="text-xs mt-1 opacity-75">As a Freelancer</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'client' })}
                className={`flex-1 py-4 px-4 border-2 rounded-lg font-semibold transition-all duration-200 ${
                  formData.role === 'client'
                    ? 'border-[#0CF574] bg-[#0CF574]/10 text-gray-900 shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 cursor-pointer'
                }`}
              >
                <div className="text-2xl mb-1">🎯</div>
                <div className="font-bold">Hire Talent</div>
                <div className="text-xs mt-1 opacity-75">As a Client</div>
              </button>
            </div>
          </div>

          {/* Client Type Selection - only for clients */}
          {formData.role === 'client' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                You are
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, clientType: 'individual' })}
                  className={`flex-1 py-3 px-3 border-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    formData.clientType === 'individual'
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 cursor-pointer'
                  }`}
                >
                  <div className="text-lg mb-1">👤</div>
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, clientType: 'company' })}
                  className={`flex-1 py-3 px-3 border-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    formData.clientType === 'company'
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 cursor-pointer'
                  }`}
                >
                  <div className="text-lg mb-1">🏢</div>
                  Company
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-600">
                {formData.clientType === 'individual' 
                  ? 'Hiring for personal projects or short-term work' 
                  : 'Hiring on behalf of a company or organization'}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                {formData.role === 'client' && formData.clientType === 'company' 
                  ? 'Your Full Name' 
                  : 'Full Name'}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574] focus:border-transparent"
                placeholder={formData.role === 'client' && formData.clientType === 'company' ? 'John Doe' : 'Samarpan KC'}
              />
              {formData.role === 'client' && formData.clientType === 'company' && (
                <p className="mt-1 text-xs text-gray-500">
                  Your personal name (company details will be added later)
                </p>
              )}
            </div>

            {/* Username field - only for freelancers */}
            {formData.role === 'freelancer' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    className="appearance-none relative block w-full pl-8 pr-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574] focus:border-transparent"
                    placeholder="samarpan_kc"
                    minLength={3}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  ✓ Your unique profile URL will be: neplancer.com/@{formData.username || 'your-username'}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  className={`appearance-none relative block w-full px-4 py-3 pr-10 border ${
                    emailTouched && emailError
                      ? 'border-red-300 focus:ring-red-500'
                      : emailTouched && isEmailValid
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-gray-300 focus:ring-[#0CF574]'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                  placeholder="yourmail@domain.com"
                />
                {emailTouched && formData.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isEmailValid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {emailTouched && emailError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {emailError}
                </p>
              )}
              {emailTouched && isEmailValid && (
                <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Valid email address - ready to register!
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                ⚠️ Use a real email address - you'll need it to verify your account
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  checkPasswordStrength(e.target.value);
                }}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574] focus:border-transparent"
                placeholder="••••••••"
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength
                            ? passwordStrength <= 2
                              ? 'bg-red-500'
                              : passwordStrength <= 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    Password strength: {
                      passwordStrength <= 2 ? '🔴 Weak' :
                      passwordStrength <= 3 ? '🟡 Medium' :
                      '🟢 Strong'
                    }
                  </p>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574] focus:border-transparent"
                placeholder="••••••••"
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>❌</span> Passwords do not match
                </p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                  <span>✓</span> Passwords match
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-lg font-semibold text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>

          <div className="text-center text-sm text-gray-600">
            By continuing, you agree to our{' '}
            <a href="#" className="underline hover:text-gray-900">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-gray-900">Privacy Policy</a>
          </div>
        </form>
                

      </div>
      </div>
    </div>
  );}
