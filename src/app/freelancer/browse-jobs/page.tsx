'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  DollarSign,
  Clock,
  Briefcase,
  Filter,
  Bookmark,
  Calendar,
  ArrowRight,
  Users,
  Award,
  MessageSquare
} from 'lucide-react';
import { Job } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import ApplyJobModal from '@/components/ApplyJobModal';
import ProfileGateModal from '@/components/ProfileGateModal';
import WelcomeBanner from '@/components/WelcomeBanner';
import { useProfileGate } from '@/hooks/useProfileGate';
import { toast } from 'sonner';

export default function BrowseJobsPage() {
  const router = useRouter();
  const { 
    user, 
    gateOpen, 
    gateType, 
    returnUrl, 
    closeGate, 
    requireProfileCompletion,
    requireBankDetails 
  } = useProfileGate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [freelancerId, setFreelancerId] = useState<string | null>(null);
  const [selectedJobForApply, setSelectedJobForApply] = useState<Job | null>(null);

  const categories = [
    'All Categories',
    'Web Development',
    'Mobile Apps',
    'Design',
    'Content Writing',
    'Digital Marketing',
    'Data Science',
    'Video Editing',
    'SEO',
  ];

  useEffect(() => {
    async function initializeUser() {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      setCurrentUser(user);
      
      // Get freelancer ID from the database
      const response = await fetch(`/api/freelancers?profileId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.freelancer) {
          setFreelancerId(data.freelancer.id);
        }
      }
      
      loadSavedJobs();
    }
    
    initializeUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load jobs when freelancerId is available
  useEffect(() => {
    if (freelancerId) {
      loadJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freelancerId]);

  useEffect(() => {
    filterJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, minBudget, sortBy, jobs]);

  const loadJobs = async () => {
    try {
      setLoading(true);

      // Fetch jobs through API route - include freelancerId if available to check applied status
      const url = freelancerId 
        ? `/api/jobs?status=open&freelancerId=${freelancerId}`
        : '/api/jobs?status=open';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      
      console.log('API response:', data); // Debug log

      // Check if data is valid
      if (!data.jobs || !Array.isArray(data.jobs)) {
        console.error('Invalid data received from API:', data);
        setJobs([]);
        setFilteredJobs([]);
        return;
      }

      // Transform API response to Job type
      const formattedJobs: Job[] = data.jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        category: job.category,
        budget: job.budget,
        skills: job.skills ?? [],
        status: job.status as 'open' | 'in_progress' | 'completed' | 'cancelled',
        createdAt: new Date(job.createdAt || job.created_at),
        deadline: job.deadline ? new Date(job.deadline) : undefined,
        clientId: job.clientId || job.client_id,
        hasApplied: job.hasApplied || false,
        client: job.client ? {
          id: job.client.id,
          name: job.client.name,
          email: job.client.email,
          jobsPosted: job.client.jobsPosted
        } : undefined
      }));

      console.log('Formatted jobs:', formattedJobs); // Debug log

      setJobs(formattedJobs);
      setFilteredJobs(formattedJobs);

    } catch (error) {
      console.error('Error loading jobs:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Show empty state instead of breaking
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedJobs = () => {
    // Temporary localStorage solution
    // TODO: Replace with database query to fetch user's saved jobs
    try {
      const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      setSavedJobs(saved);
    } catch (error) {
      console.error('Error loading saved jobs:', error);
      setSavedJobs([]);
    }
  };

  const filterJobs = () => {
    let results = [...jobs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        job =>
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.skills.some(skill => skill.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'All Categories') {
      results = results.filter(job => job.category === selectedCategory);
    }

    // Budget filter
    if (minBudget) {
      const budgetNum = parseInt(minBudget);
      results = results.filter(job => job.budget >= budgetNum);
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'budget-high':
        results.sort((a, b) => b.budget - a.budget);
        break;
      case 'budget-low':
        results.sort((a, b) => a.budget - b.budget);
        break;
    }

    setFilteredJobs(results);
  };

  const toggleSaveJob = (jobId: string) => {
    // Temporary localStorage solution
    // TODO: Replace with API call to save/unsave job in database
    let updated;
    if (savedJobs.includes(jobId)) {
      updated = savedJobs.filter(id => id !== jobId);
    } else {
      updated = [...savedJobs, jobId];
    }
    setSavedJobs(updated);
    localStorage.setItem('savedJobs', JSON.stringify(updated));
  };

  const handleApplyJob = async (proposalData: any) => {
    try {
      const response = await fetch('/api/proposals', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(proposalData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit proposal');
      }

      toast.success(data.message || 'Proposal submitted successfully! The client has been notified and will review your proposal.', {
        duration: 5000,
      });
      setSelectedJobForApply(null);
      
      // Refresh jobs to update proposal counts
      await loadJobs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit proposal');
      throw error;
    }
  };

  const handleMessageClient = async (job: Job) => {
    if (!currentUser || !job.clientId) {
      toast.error('Unable to start conversation');
      return;
    }

    try {
      // Verify session is still valid before making request
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      
      if (!session) {
        toast.error('Your session has expired. Please log in again.');
        router.push('/login');
        return;
      }

      // Create or get existing conversation
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          otherUserId: job.clientId,
          jobId: job.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create conversation');
      }

      // Redirect to communication page with conversation
      router.push(`/communication?conversationId=${data.conversation.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to start conversation');
    }
  };

  const formatBudget = (budget: number) => {
    return `$${budget.toLocaleString()}`;
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    const days = Math.floor(diffInHours / 24);
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>
              <p className="text-gray-600 mt-1">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} available
              </p>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs by title, skills, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 outline-none rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat === 'All Categories' ? '' : cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="budget-high">Highest Budget</option>
              <option value="budget-low">Lowest Budget</option>
            </select>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
                showFilters
                  ? 'bg-primary text-gray-900 border-primary'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            {/* Results count */}
            <div className="ml-auto text-sm text-gray-600">
              Showing {filteredJobs.length} of {jobs.length} jobs
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Budget
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 50000"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search criteria
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setMinBudget('');
              }}
              className="px-6 py-2 bg-primary text-gray-900 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredJobs.map((job) => {
              const isSaved = savedJobs.includes(job.id);
              
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-xl border-2 border-gray-200 hover:border-primary transition-all p-6 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Job Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2 hover:text-primary cursor-pointer">
                            {job.title}
                          </h2>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {job.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {getTimeAgo(job.createdAt)}
                            </span>
                            {job.client && (
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {job.client.name}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => toggleSaveJob(job.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isSaved
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 mb-4 line-clamp-3 break-all">
                        {job.description}
                      </p>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Job Meta */}
                      <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-500">Budget</p>
                            <p className="font-bold text-gray-900">{formatBudget(job.budget)}</p>
                          </div>
                        </div>

                        {job.deadline && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-orange-600" />
                            <div>
                              <p className="text-xs text-gray-500">Deadline</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(job.deadline).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        )}

                        {job.client?.jobsPosted && (
                          <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">Client History</p>
                              <p className="font-semibold text-gray-900">
                                {job.client.jobsPosted} jobs posted
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                    {!job.hasApplied ? (
                      <button
                        onClick={() => {
                          // First check profile completion
                          if (!requireProfileCompletion(`/freelancer/browse-jobs?jobId=${job.id}`)) {
                            return;
                          }
                          // Then check bank details
                          if (!requireBankDetails(`/freelancer/browse-jobs?jobId=${job.id}`)) {
                            return;
                          }
                          // If both checks pass, open apply modal
                          setSelectedJobForApply(job);
                        }}
                        disabled={!freelancerId}
                        className="px-6 py-3 bg-primary text-gray-100 rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply Now
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    ) : (
                      <div className="px-6 py-3 bg-green-50 text-green-700 rounded-lg border border-green-200 font-semibold flex items-center justify-center gap-2">
                        ✓ Applied
                      </div>
                    )}
                    <button
                      onClick={() => handleMessageClient(job)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                    >
                      <MessageSquare className="h-5 w-5" />
                      Message
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More (Placeholder) */}
        {filteredJobs.length > 0 && filteredJobs.length >= 10 && (
          <div className="text-center mt-8">
            <button className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Load More Jobs
            </button>
          </div>
        )}
      </div>

      {/* Saved Jobs Badge */}
      {savedJobs.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => router.push('/freelancer/saved-jobs')}
            className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg hover:bg-black transition-colors flex items-center gap-2"
          >
            <Bookmark className="h-5 w-5 fill-current" />
            <span className="font-semibold">{savedJobs.length} Saved</span>
          </button>
        </div>
      )}

      {/* Apply Job Modal */}
      {selectedJobForApply && freelancerId && (
        <ApplyJobModal
          job={selectedJobForApply}
          freelancerId={freelancerId}
          onClose={() => setSelectedJobForApply(null)}
          onSubmit={handleApplyJob}
        />
      )}

      {/* Profile Gate Modal */}
      <ProfileGateModal
        isOpen={gateOpen}
        onClose={closeGate}
        type={gateType}
        role="freelancer"
        returnTo={returnUrl}
      />
    </div>
  );
} 