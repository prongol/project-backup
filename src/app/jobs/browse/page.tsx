'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useWorkflow } from '@/contexts/WorkflowContext';
import WelcomeBanner from '@/components/workflow/WelcomeBanner';
import { Search, DollarSign, Clock, MapPin, Star, Briefcase, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Job {
  id: string;
  title: string;
  description: string;
  budget: {
    type: 'fixed' | 'hourly';
    amount: number;
    min?: number;
    max?: number;
  };
  duration: string;
  experience_level: string;
  skills: string[];
  posted_date: string;
  proposals_count: number;
  client: {
    id: string;
    name: string;
    company_name?: string;
    company_logo?: string;
    rating: number;
    reviews_count: number;
    jobs_posted: number;
    hire_rate: number;
    location: string;
  };
  category: string;
}

export default function FreelancerBrowseJobsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const workflow = useWorkflow();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBudget, setSelectedBudget] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  
  // Check if user is newly registered
  useEffect(() => {
    if (user && workflow.isFirstTimeUser() && !workflow.state.hasSeenWelcomeBanner) {
      setShowWelcomeBanner(true);
    }
  }, [user, workflow]);
  
  // Load jobs
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (selectedBudget !== 'all') params.append('budget', selectedBudget);
        if (selectedExperience !== 'all') params.append('experience', selectedExperience);
        
        const response = await fetch(`/api/jobs?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setJobs(data.jobs || []);
        }
      } catch (error) {
        console.error('Failed to load jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadJobs();
  }, [searchQuery, selectedCategory, selectedBudget, selectedExperience]);
  
  const handleViewJob = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };
  
  const handleApplyToJob = async (jobId: string) => {
    // Check if user can apply
    const check = await workflow.checkCanApplyToJob(jobId);
    
    if (check.canApply) {
      router.push(`/jobs/${jobId}?action=apply`);
    }
    // If cannot apply, the workflow context will save the job ID and show appropriate modal
  };
  
  const handleDismissWelcome = () => {
    setShowWelcomeBanner(false);
    workflow.markWelcomeBannerSeen();
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Banner for new users */}
      {showWelcomeBanner && (
        <WelcomeBanner
          userRole="freelancer"
          userName={user?.name}
          variant="first-time"
          onDismiss={handleDismissWelcome}
        />
      )}
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Jobs</h1>
        <p className="text-gray-600">Find projects that match your skills and start earning</p>
      </div>
      
      {/* Search and Filters */}
      <Card className="p-6 mb-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs by title, skills, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="web-development">Web Development</option>
                <option value="mobile-development">Mobile Development</option>
                <option value="design">Design</option>
                <option value="writing">Writing</option>
                <option value="marketing">Marketing</option>
                <option value="data-science">Data Science</option>
              </select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Budget</label>
              <select
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Any Budget</option>
                <option value="0-500">$0 - $500</option>
                <option value="500-1000">$500 - $1,000</option>
                <option value="1000-5000">$1,000 - $5,000</option>
                <option value="5000+">$5,000+</option>
              </select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Experience Level</label>
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="entry">Entry Level</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Job Listings */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : jobs.length === 0 ? (
        <Card className="p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => (
            <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewJob(job.id)}
            >
              {/* Job Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 hover:text-blue-600">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {job.budget.type === 'fixed' 
                        ? `$${job.budget.amount.toLocaleString()} fixed` 
                        : `$${job.budget.min}-$${job.budget.max}/hr`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {job.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {job.experience_level}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {job.proposals_count} proposals
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyToJob(job.id);
                  }}
                  className="ml-4"
                >
                  Apply Now
                </Button>
              </div>
              
              {/* Job Description */}
              <p className="text-gray-700 mb-4 line-clamp-3 break-words overflow-hidden">{job.description}</p>
              
              {/* Skills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {job.skills.slice(0, 6).map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
                {job.skills.length > 6 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    +{job.skills.length - 6} more
                  </span>
                )}
              </div>
              
              {/* Client Info */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {job.client.company_name?.[0] || job.client.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{job.client.company_name || job.client.name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {job.client.rating.toFixed(1)} ({job.client.reviews_count})
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.client.location}
                      </span>
                      <span>{job.client.jobs_posted} jobs posted</span>
                      <span>{job.client.hire_rate}% hire rate</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Posted {new Date(job.posted_date).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
