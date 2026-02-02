'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  Briefcase, 
  DollarSign, 
  MessageSquare,
  FileText,
  Star,
  ArrowUpRight,
  Activity,
  Users,
  Eye,
  Send,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { demoApi } from '@/lib/demoApi';
//import * as jobApi from '@/lib/jobs'
import type { User, Job, Contract } from '@/types';

export default function ClientDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeContracts: 0,
    completedProjects: 0,
    totalSpent: 0,
    hiredFreelancers: 0
  });
  const [recentActivity, setRecentActivity] = useState<Array<{ type: string; text: string; time: string }>>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);

  useEffect(() => {
    const initDashboard = async () => {
      const user = await getCurrentUser();
      if (!user || user.role !== 'client') {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      await loadDashboardData(user);
    };

    initDashboard();
  }, []);

  async function loadDashboardData(user: User): Promise<void> {
    setLoading(true);
    try {
      const response = await fetch('/api/client/dashboard');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch dashboard data: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      setStats({
        totalJobs: data.stats.totalJobsPosted || 0,
        activeContracts: data.stats.activeJobs || 0,
        completedProjects: data.recentContracts?.filter((c: any) => c.status === 'completed').length || 0,
        totalSpent: data.stats.totalSpending || 0,
        hiredFreelancers: data.recentContracts?.length || 0
      });

      // Format activity for display with fallback
      const formattedActivity = (data.recentActivity || []).map((activity: any) => ({
        type: activity.type || 'activity',
        text: activity.title || activity.description || 'Activity',
        time: activity.created_at ? new Date(activity.created_at).toLocaleString() : 'Recently'
      }));

      setRecentActivity(formattedActivity);
      setRecentJobs(data.recentJobs || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      // Load demo data as fallback
      try {
        const demoData = await loadDemoData();
        setStats(demoData.stats);
        setRecentActivity(demoData.activity);
        setRecentJobs(demoData.jobs);
      } catch (demoError) {
        console.error('Error loading demo data:', demoError);
        // Set empty/default data on error
        setStats({
          totalJobs: 0,
          activeContracts: 0,
          completedProjects: 0,
          totalSpent: 0,
          hiredFreelancers: 0
        });
        setRecentActivity([]);
        setRecentJobs([]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadDemoData() {
    // Demo data to show while the real API is being set up
    return {
      stats: {
        totalJobs: 12,
        activeContracts: 4,
        completedProjects: 8,
        totalSpent: 15750,
        hiredFreelancers: 15
      },
      activity: [
        { type: 'job', text: 'Posted new job: Mobile App Development', time: '2 hours ago' },
        { type: 'proposal', text: 'Received 5 new proposals for Web Design Project', time: '4 hours ago' },
        { type: 'contract', text: 'Contract completed with John Doe', time: '1 day ago' },
        { type: 'message', text: 'New message from Sarah Smith', time: '2 days ago' },
        { type: 'job', text: 'Job "E-commerce Website" was marked as completed', time: '3 days ago' }
      ],
      jobs: [
        {
          id: 'demo-1',
          title: 'React Native Mobile App Development',
          budget: 5000,
          proposalsCount: 12,
          status: 'open',
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-2',
          title: 'WordPress Website Redesign',
          budget: 2500,
          proposalsCount: 8,
          status: 'open',
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-3',
          title: 'Logo Design and Branding',
          budget: 800,
          proposalsCount: 15,
          status: 'in_progress',
          created_at: new Date().toISOString()
        }
      ]
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0CF574]"></div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Client Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, {currentUser.name}! Here&apos;s your overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Jobs */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <span className="flex items-center text-blue-600 text-sm font-medium">
              <Activity className="w-4 h-4 mr-1" />
              Active
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Jobs Posted</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
          <p className="text-xs text-gray-500 mt-2">{stats.activeContracts} currently active</p>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              Growth
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Spent</h3>
          <p className="text-2xl font-bold text-gray-900">
            ${stats.totalSpent.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">On {stats.completedProjects} projects</p>
        </div>

        {/* Hired Freelancers */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="flex items-center text-purple-600 text-sm font-medium">
              <Star className="w-4 h-4 mr-1" />
              Top
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Hired Freelancers</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.hiredFreelancers}</p>
          <p className="text-xs text-gray-500 mt-2">Avg rating: 4.8/5.0</p>
        </div>

        {/* Active Contracts */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <span className="flex items-center text-orange-600 text-sm font-medium">
              <Activity className="w-4 h-4 mr-1" />
              Active
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Active Contracts</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.activeContracts}</p>
          <p className="text-xs text-gray-500 mt-2">In progress</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'proposal' ? 'bg-blue-50' :
                        activity.type === 'message' ? 'bg-green-50' :
                        activity.type === 'contract' ? 'bg-purple-50' :
                        'bg-orange-50'
                      }`}>
                        {activity.type === 'proposal' && <FileText className="w-5 h-5 text-blue-600" />}
                        {activity.type === 'message' && <MessageSquare className="w-5 h-5 text-green-600" />}
                        {activity.type === 'contract' && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                        {activity.type === 'job' && <Briefcase className="w-5 h-5 text-orange-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              )}
            </div>
          </div>

          {/* Posted Jobs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Your Posted Jobs</h2>
              <button
                onClick={() => router.push('/client/jobs')}
                className="text-sm text-[#0CF574] hover:text-[#0CF574]/80 font-medium flex items-center gap-1"
              >
                View All
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              {recentJobs.length > 0 ? (
                <div className="space-y-4">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#0CF574] transition cursor-pointer"
                      onClick={() => router.push(`/client/jobs/${job.id}`)}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{job.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${job.budget.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {job.proposalsCount || 0} proposals
                          </span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No jobs posted yet</p>
                  <button
                    onClick={() => router.push('/client/post-job')}
                    className="mt-4 px-4 py-2 bg-[#0CF574] text-white rounded-lg hover:bg-[#0CF574]/90 transition"
                  >
                    Post a Job
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Profile Views</span>
                <span className="font-medium text-gray-900">1,234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Rate</span>
                <span className="font-medium text-gray-900">98%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg. Rating</span>
                <span className="font-medium text-gray-900 flex items-center gap-1">
                  4.9 <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/client/post-job')}
                className="w-full px-4 py-3 bg-[#0CF574] text-white rounded-lg hover:bg-[#0CF574]/90 transition font-medium flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5 text-white" />
                Post a Job
              </button>
              <button
                onClick={() => router.push('/search/freelancers')}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                Find Freelancers
              </button>
              <button
                onClick={() => router.push('/client/jobs')}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
              >
                <Briefcase className="w-5 h-5" />
                My Jobs
              </button>
              <button
                onClick={() => router.push('/communication')}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Messages
              </button>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-[#0CF574]/10 to-[#0CF574]/5 rounded-lg border border-[#0CF574]/20 p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg">
                <AlertCircle className="w-5 h-5 text-[#0CF574]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Success Tip</h3>
                <p className="text-sm text-gray-600">
                  Add detailed job descriptions to attract quality freelancers and reduce hiring time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}