'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { useAuth } from '@/hooks/useAuth';
import {
  Briefcase,
  DollarSign,
  Calendar,
  Tag,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  AlertCircle,
} from 'lucide-react';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  skills: string[];
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  deadline: string | null;
  created_at: string;
}

export default function ClientJobsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'client') {
      router.push('/freelancer/browse-jobs');
      return;
    }

    if (user) {
      fetchClientIdAndJobs();
    }
  }, [user, authLoading, router, filter]);

  const fetchClientIdAndJobs = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch client ID using profileId
      const clientResponse = await fetch(`/api/clients?profileId=${user?.id}`);
      const clientData = await clientResponse.json();

      if (!clientResponse.ok) {
        throw new Error(clientData.error || 'Failed to fetch client data');
      }

      if (clientData.client) {
        setClientId(clientData.client.id);

        // Fetch jobs for this client
        const jobsResponse = await fetch(
          `/api/jobs?clientId=${clientData.client.id}${filter !== 'all' ? `&status=${filter}` : ''}`
        );
        const jobsData = await jobsResponse.json();

        if (!jobsResponse.ok) {
          throw new Error(jobsData.error || 'Failed to fetch jobs');
        }

        if (jobsData.jobs) {
          setJobs(jobsData.jobs);
        }
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete job');
      }

      setJobs(jobs.filter((job) => job.id !== jobId));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Error deleting job:', err);
      setError(err.message || 'Failed to delete job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={`${manrope.className} min-h-screen bg-gradient-to-br from-background via-[#0CF574]/5 to-background px-4 py-12`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">
              My Posted Jobs
            </h1>
            <p className="text-gray-600">
              Manage and track your job postings
            </p>
          </div>
          <button
            onClick={() => router.push('/client/post-job')}
            className="flex items-center gap-2 px-6 py-3 bg-[#0CF574] text-white rounded-lg font-semibold hover:bg-[#0CF574]/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Post New Job
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex gap-2 overflow-x-auto">
          {['all', 'open', 'in_progress', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-[#0CF574] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't posted any jobs yet."
                : `No ${getStatusLabel(filter).toLowerCase()} jobs found.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => router.push('/client/post-job')}
                className="px-6 py-3 bg-[#0CF574] text-white rounded-lg font-semibold hover:bg-[#0CF574]/90 transition-colors"
              >
                Post Your First Job
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 relative"
              >
                {/* Job Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {job.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {getStatusLabel(job.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2">
                      {job.description}
                    </p>
                  </div>

                  {/* Actions Menu */}
                  <div className="relative ml-4">
                    <button
                      onClick={() => setActiveMenu(activeMenu === job.id ? null : job.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>

                    {activeMenu === job.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => {
                            router.push(`/client/jobs/${job.id}`);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            router.push(`/client/jobs/${job.id}/edit`);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Job
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirm(job.id);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Job
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Meta */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">${job.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tag className="w-4 h-4" />
                    <span>{job.category}</span>
                  </div>
                  {job.deadline && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {new Date(job.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 5 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      +{job.skills.length - 5} more
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Posted on {new Date(job.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete Job?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this job? This action cannot be undone and will also delete all associated proposals.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}