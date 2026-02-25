# Frontend Integration Guide

## How to Connect Your Frontend to the Backend

### 1. Update Register Page

File: `src/app/(auth)/register/page.tsx`

Add username field for freelancers:

```tsx
// Add to your form state
const [username, setUsername] = useState('');

// Add this input field (only show for freelancers)
{role === 'freelancer' && (
  <div>
    <label>Username</label>
    <input
      type="text"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      placeholder="username"
      required
      className="w-full px-4 py-3 rounded-lg border"
    />
  </div>
)}

// Update your submit handler
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name,
        role,
        username: role === 'freelancer' ? username : undefined,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Store user data
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.session) {
        localStorage.setItem('authToken', data.session.access_token);
      }
      
      // Redirect based on role
      if (role === 'client') {
        router.push('/client/post-job');
      } else {
        router.push('/freelancer/browse-jobs');
      }
    } else {
      setError(data.error || 'Registration failed');
    }
  } catch (err) {
    setError('Something went wrong');
  } finally {
    setLoading(false);
  }
};
```

### 2. Update Login Page

File: `src/app/(auth)/login/page.tsx`

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Store user data
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.session) {
        localStorage.setItem('authToken', data.session.access_token);
      }
      
      // Redirect based on role
      if (data.user.role === 'client') {
        router.push('/dashboard');
      } else {
        router.push('/freelancer/browse-jobs');
      }
    } else {
      setError(data.error || 'Login failed');
    }
  } catch (err) {
    setError('Invalid credentials');
  } finally {
    setLoading(false);
  }
};
```

### 3. Update Hero Section to Use Real Data

File: `src/app/components/herosection.tsx`

Replace static data with real database queries:

```tsx
import { useEffect, useState } from 'react';
import { getAllFreelancers } from '@/lib/database';

// Inside component
const [freelancers, setFreelancers] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchFreelancers() {
    try {
      const data = await getAllFreelancers({
        status: 'online',
        minRating: 4.0,
      });
      setFreelancers(data.slice(0, 12)); // Get first 12
    } catch (error) {
      console.error('Failed to fetch freelancers:', error);
    } finally {
      setLoading(false);
    }
  }

  if (activeTab === 'hire') {
    fetchFreelancers();
  }
}, [activeTab]);

// In your render
{loading ? (
  <div>Loading...</div>
) : (
  freelancers.map((freelancer) => (
    <FreelancerCard
      key={freelancer.id}
      name={freelancer.profiles.full_name}
      username={freelancer.username}
      avatar={freelancer.profiles.avatar_url || 'https://i.pravatar.cc/400'}
      status={freelancer.status}
      skills={freelancer.skills}
      rating={freelancer.rating}
    />
  ))
)}
```

### 4. Create Job Posting Page

File: `src/app/client/post-job/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { createJob } from '@/lib/database';
import { useRouter } from 'next/navigation';

export default function PostJobPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    category: '',
    skills: [] as string[],
    deadline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Get client ID from stored user
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const clientId = user.id; // This would be the client record ID

      await createJob({
        client_id: clientId,
        title: formData.title,
        description: formData.description,
        budget: parseFloat(formData.budget),
        category: formData.category,
        skills: formData.skills,
        deadline: formData.deadline || null,
      });

      alert('Job posted successfully!');
      router.push('/client/jobs');
    } catch (error) {
      console.error('Failed to post job:', error);
      alert('Failed to post job');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
    </form>
  );
}
```

### 5. Browse Jobs Page (Freelancers)

File: `src/app/freelancer/browse-jobs/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getAllJobs } from '@/lib/database';

export default function BrowseJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const data = await getAllJobs({ status: 'open' });
        setJobs(data);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  if (loading) return <div>Loading jobs...</div>;

  return (
    <div>
      <h1>Available Jobs</h1>
      {jobs.map((job) => (
        <div key={job.id} className="job-card">
          <h2>{job.title}</h2>
          <p>{job.description}</p>
          <p>Budget: ${job.budget}</p>
          <p>Category: {job.category}</p>
          <button onClick={() => handleApply(job.id)}>Apply Now</button>
        </div>
      ))}
    </div>
  );
}
```

### 6. Submit Proposal

```tsx
import { createProposal } from '@/lib/database';

const handleApply = async (jobId: string) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const freelancerId = user.id; // Freelancer record ID

  try {
    await createProposal({
      job_id: jobId,
      freelancer_id: freelancerId,
      cover_letter: 'Your cover letter here',
      proposed_budget: 4500,
      estimated_duration: '2 weeks',
    });

    alert('Proposal submitted!');
  } catch (error) {
    console.error('Failed to submit proposal:', error);
  }
};
```

### 7. Search Functionality

```tsx
import { searchFreelancers, searchJobs } from '@/lib/database';

// For searching freelancers
const handleSearch = async (query: string) => {
  const results = await searchFreelancers(query);
  setFreelancers(results);
};

// For searching jobs
const handleJobSearch = async (query: string) => {
  const results = await searchJobs(query);
  setJobs(results);
};
```

### 8. Update useAuth Hook

File: `src/hooks/useAuth.ts`

```tsx
import { useState, useEffect } from 'react';
import { getCurrentSession } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const session = await getCurrentSession();
      if (session?.user) {
        const storedUser = localStorage.getItem('user');
        setUser(storedUser ? JSON.parse(storedUser) : session.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  }

  const isAuthenticated = !!user;
  const isClient = user?.role === 'client';
  const isFreelancer = user?.role === 'freelancer';

  return { user, isAuthenticated, isClient, isFreelancer, loading };
}
```

## Testing Checklist

- [ ] Register as a client
- [ ] Register as a freelancer (with username)
- [ ] Login as both roles
- [ ] View freelancers on homepage
- [ ] Post a job (as client)
- [ ] Browse jobs (as freelancer)
- [ ] Submit a proposal (as freelancer)
- [ ] View proposals (as client)
- [ ] Search functionality works

## Error Handling

```tsx
// Wrap database calls in try-catch
try {
  const data = await getAllFreelancers();
  // Success
} catch (error) {
  if (error.message.includes('JWT')) {
    // Session expired - redirect to login
    router.push('/login');
  } else {
    // Show error message
    setError('Failed to load data');
  }
}
```

## Environment Variables

Make sure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://ghnxqbhjpkaszvtxbsdk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Next Steps

1. Run the SQL script in Supabase
2. Test registration
3. Update your components one by one
4. Add loading states
5. Add error handling
6. Test all flows

You're ready to build! 🚀
