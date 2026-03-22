'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import FreelancerDashboard from '@/app/components/FreelancerDashboard/page';
import ClientDashboard from '@/app/components/ClientDashboard/page';
import type { User } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent re-initialization on tab visibility changes
    if (initialized.current) return;
    
    const initDashboard = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      setLoading(false);
      initialized.current = true;
    };

    initDashboard();
  }, []);

  useEffect(() => {
    if (!currentUser || loading) return;

    // Check if profile is incomplete and redirect to profile creation (only once)
    if (!currentUser.profile_completed) {
      if (currentUser.role === 'freelancer') {
        router.push('/freelancer/createProfile');
      } else if (currentUser.role === 'client') {
        router.push('/client/profile');
      }
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0CF574]"></div>
      </div>
    );
  }
  
  // Show appropriate dashboard based on role (regardless of profile_completed —
  // each dashboard handles its own incomplete-profile state internally)
  if (currentUser?.role === 'client') {
    return <ClientDashboard />;
  }

  if (currentUser?.role === 'freelancer') {
    return <FreelancerDashboard />;
  }

  return null;
}
