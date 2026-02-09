'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle2, ArrowRight, ArrowLeft, User, Code, DollarSign, Upload, Star } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createVerificationToken } from '@/app/components/token';
import { sendEmail } from '@/components/mailer';
import { verificationEmail } from '@/utils/emailTemplates';

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const POPULAR_SKILLS = [
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript',
  'UI/UX Design', 'Figma', 'Photoshop', 'Illustrator',
  'Content Writing', 'SEO', 'Copywriting',
  'Digital Marketing', 'Social Media', 'Google Ads',
  'Video Editing', 'After Effects', 'Premiere Pro'
];

export default function RegisterFreelancerPage() {
  const router = useRouter();
  const { signUp, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    
    // Step 2: Professional Details
    title: '',
    experience: '',
    category: '',
    
    // Step 3: Skills
    skills: [] as string[],
    customSkill: '',
    
    // Step 4: Rates & Description
    hourlyRate: '',
    bio: '',
    
    // Step 5: Portfolio
    portfolioUrl: '',
    portfolioDescription: '',
  });
  const [error, setError] = useState('');

  const totalSteps = 5;

  const validateStep = (step: number): boolean => {
    setError('');
    
    switch(step) {
      case 1:
        if (!formData.fullName.trim()) {
          setError('Please enter your full name');
          return false;
        }
        if (!formData.username.trim() || formData.username.length < 3) {
          setError('Username must be at least 3 characters');
          return false;
        }
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
          setError('Please enter a valid email');
          return false;
        }
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (!formData.location.trim()) {
          setError('Please enter your location');
          return false;
        }
        return true;
        
      case 2:
        if (!formData.title.trim()) {
          setError('Please enter your professional title');
          return false;
        }
        if (!formData.category) {
          setError('Please select a category');
          return false;
        }
        if (!formData.experience) {
          setError('Please select your experience level');
          return false;
        }
        return true;
        
      case 3:
        if (formData.skills.length < 3) {
          setError('Please select at least 3 skills');
          return false;
        }
        return true;
        
      case 4:
        if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
          setError('Please enter a valid hourly rate');
          return false;
        }
        if (!formData.bio.trim() || formData.bio.length < 50) {
          setError('Please write a bio of at least 50 characters');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const addCustomSkill = () => {
    if (formData.customSkill.trim() && !formData.skills.includes(formData.customSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.customSkill.trim()],
        customSkill: ''
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(5)) return;
    
    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: 'freelancer',
        username: formData.username,
        skills: formData.skills,
        hourlyRate: parseFloat(formData.hourlyRate),
        bio: formData.bio,
        title: formData.title,
      });
      
      router.push('/freelancer/dashboard');
      router.refresh();
    } catch (err) {
      console.log(err)
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };
 
  return (
    <div className={`${manrope.className} min-h-screen bg-gradient-to-br from-background via-[#0CF574]/5 to-background px-4 py-12`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">
            Become a Freelancer
          </h1>
          <p className="text-gray-600">
            Join NepLancer and start your freelancing journey
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step < currentStep
                    ? 'bg-[#0CF574] text-white'
                    : step === currentStep
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? <CheckCircle2 className="w-6 h-6" /> : step}
                </div>
                {step < 5 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step < currentStep ? 'bg-[#0CF574]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600 px-2">
            <span>Basic</span>
            <span>Professional</span>
            <span>Skills</span>
            <span>Rates</span>
            <span>Portfolio</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                    <p className="text-gray-600">Let&apos;s start with your basic details</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
                    placeholder="your_username"
                    minLength={3}
                  />
                  <p className="mt-1 text-xs text-gray-500">Lowercase letters, numbers, and underscores only</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
                    placeholder="Min. 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
                    placeholder="Re-enter password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
                    placeholder="Kathmandu, Nepal"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Professional Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Code className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Professional Details</h2>
                    <p className="text-gray-600">Tell us about your expertise</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Professional Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
                    placeholder="e.g., Senior Web Developer, UI/UX Designer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
                  >
                    <option value="">Select a category</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Graphic Design">Graphic Design</option>
                    <option value="Content Writing">Content Writing</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Video Production">Video Production</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Experience Level *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['Entry Level', 'Intermediate', 'Expert'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData({ ...formData, experience: level })}
                        className={`py-3 px-4 border-2 rounded-lg font-semibold transition-all ${
                          formData.experience === level
                            ? 'border-[#0CF574] bg-[#0CF574]/10 text-gray-900'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Skills Selection */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Skills Selection</h2>
                    <p className="text-gray-600">Select at least 3 skills (Selected: {formData.skills.length})</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Popular Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SKILLS.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-4 py-2 rounded-full font-medium transition-all ${
                          formData.skills.includes(skill)
                            ? 'bg-[#0CF574] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Add Custom Skill
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.customSkill}
                      onChange={(e) => setFormData({ ...formData, customSkill: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
                      placeholder="Enter a skill"
                    />
                    <button
                      type="button"
                      onClick={addCustomSkill}
                      className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {formData.skills.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Your Selected Skills
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill) => (
                        <div
                          key={skill}
                          className="px-4 py-2 bg-[#0CF574] text-white rounded-full flex items-center gap-2"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className="hover:bg-white/20 rounded-full p-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Rates & Description */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Rates & Description</h2>
                    <p className="text-gray-600">Set your rates and describe your services</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hourly Rate (USD) *
                  </label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
                    placeholder="2500"
                    min="0"
                    step="100"
                  />
                  <p className="mt-1 text-sm text-gray-500">Average rate: $15 - $35/hour</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Professional Bio * (Min. 50 characters)
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574] min-h-[150px]"
                    placeholder="Describe your experience, skills, and what makes you unique..."
                  />
                  <p className="mt-1 text-sm text-gray-500">{formData.bio.length} characters</p>
                </div>
              </div>
            )}

            {/* Step 5: Portfolio Upload */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Upload className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Portfolio (Optional)</h2>
                    <p className="text-gray-600">Showcase your best work</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Portfolio URL
                  </label>
                  <input
                    type="url"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Portfolio Description
                  </label>
                  <textarea
                    value={formData.portfolioDescription}
                    onChange={(e) => setFormData({ ...formData, portfolioDescription: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574] min-h-[100px]"
                    placeholder="Brief description of your portfolio..."
                  />
                </div>

                {/* Profile Preview */}
                <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Preview</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <p className="font-semibold">{formData.fullName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Username:</span>
                      <p className="font-semibold">@{formData.username}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Title:</span>
                      <p className="font-semibold">{formData.title}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Hourly Rate:</span>
                      <p className="font-semibold">${formData.hourlyRate}/hour</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Skills:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.skills.slice(0, 5).map(skill => (
                          <span key={skill} className="px-3 py-1 bg-[#0CF574] text-white text-sm rounded-full">
                            {skill}
                          </span>
                        ))}
                        {formData.skills.length > 5 && (
                          <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-full">
                            +{formData.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Previous
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black transition-colors ml-auto"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-8 py-3 bg-[#0CF574] text-white rounded-lg font-semibold hover:bg-[#0CF574]/90 transition-colors ml-auto disabled:opacity-50"
                >
                  {isLoading ? 'Creating Profile...' : 'Complete Registration'}
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-gray-900 underline hover:text-gray-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

