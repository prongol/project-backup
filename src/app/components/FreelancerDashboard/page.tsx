'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, 
  DollarSign, 
  CheckCircle2,
  MessageSquare,
  FileText,
  Star,
  ArrowUpRight,
  Activity,
  Users,
  AlertCircle,
  Clock
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { demoApi } from '@/lib/demoApi';
import type { User, Contract } from '@/types';

export default function FreelancerDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingProposals: 0
  });
  const [recentActivity, setRecentActivity] = useState<Array<{ type: string; text: string; time: string }>>([]);
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);

  useEffect(() => {
    const initDashboard = async () => {
      const user = await getCurrentUser();
      if (!user || user.role !== 'freelancer') {
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
      const response = await fetch('/api/freelancer/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();

      setStats({
        totalEarnings: data.stats.totalEarnings,
        activeProjects: data.stats.activeProjects,
        completedProjects: data.stats.completedProjects,
        pendingProposals: data.stats.pendingApplications
      });

      // Format activity for display
      const formattedActivity = data.recentActivity.map((activity: any) => ({
        type: activity.type || 'activity',
        text: activity.description || activity.title || 'Activity',
        time: new Date(activity.created_at).toLocaleString()
      }));

      setRecentActivity(formattedActivity);
      setRecentContracts(data.recentContracts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty/default data on error
      setStats({
        totalEarnings: 0,
        activeProjects: 0,
        completedProjects: 0,
        pendingProposals: 0
      });
      setRecentActivity([]);
      setRecentContracts([]);
    } finally {
      setLoading(false);
    }
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
          Freelancer Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, {currentUser.name}! Here&apos;s your overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Earnings */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              12%
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Earnings</h3>
          <p className="text-2xl font-bold text-gray-900">
            ${stats.totalEarnings.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">+$1,500 this month</p>
        </div>

        {/* Active Projects */}
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
          <h3 className="text-gray-600 text-sm font-medium mb-1">Active Projects</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
          <p className="text-xs text-gray-500 mt-2">2 nearing deadline</p>
        </div>

        {/* Completed Projects */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-purple-600" />
            </div>
            <span className="flex items-center text-purple-600 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              8%
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Completed</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.completedProjects}</p>
          <p className="text-xs text-gray-500 mt-2">100% success rate</p>
        </div>

        {/* Pending Proposals */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <span className="flex items-center text-gray-600 text-sm font-medium">
              <Clock className="w-4 h-4 mr-1" />
              Pending
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Proposals</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingProposals}</p>
          <p className="text-xs text-gray-500 mt-2">Awaiting response</p>
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

          {/* Active Contracts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Active Contracts</h2>
              <button
                onClick={() => router.push('/contracts')}
                className="text-sm text-[#0CF574] hover:text-[#0CF574]/80 font-medium flex items-center gap-1"
              >
                View All
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              {recentContracts.length > 0 ? (
                <div className="space-y-4">
                  {recentContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#0CF574] transition cursor-pointer"
                      onClick={() => router.push(`/contracts/${contract.id}`)}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {(contract as any).job?.title || contract.jobTitle || 'Untitled Contract'}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${((contract as any).total_amount || contract.totalAmount || 0).toLocaleString()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            contract.status === 'active' ? 'bg-green-50 text-green-700' :
                            contract.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                            'bg-gray-50 text-gray-700'
                          }`}>
                            {contract.status}
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
                  <p className="text-gray-500">No active contracts yet</p>
                  <button
                    onClick={() => router.push('/freelancer/browse-jobs')}
                    className="mt-4 text-[#0CF574] hover:text-[#0CF574]/80 font-medium text-sm"
                  >
                    Browse Jobs
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
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="font-medium text-gray-900">2 hours</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/freelancer/browse-jobs')}
                className="w-full px-4 py-3 bg-[#0CF574] text-white rounded-lg hover:bg-[#0CF574]/90 transition font-medium flex items-center justify-center gap-2"
              >
                <Briefcase className="w-5 h-5 text-white" />
                Browse Jobs
              </button>
              <button
                onClick={() => router.push('/freelancer/my-proposals')}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                My Proposals
              </button>
              <button
                onClick={() => router.push(`/freelancer/profile/${currentUser.id}`)}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                View Profile
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
                <h3 className="font-semibold text-gray-900 mb-2">Pro Tip</h3>
                <p className="text-sm text-gray-600">
                  Complete your profile to increase your chances of getting hired by 40%!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}