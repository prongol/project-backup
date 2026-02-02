// lib/auth.ts
import { supabase } from './supabase';
import type { User } from '@/types';
import { sendEmailAction } from './emaila/emailActions';
import { WelcomeEmail,emailLayout,emailVerificationEmail,passwordResetEmail } from './emaila/templates';
import { createVerificationToken } from '@/app/actions/verification';

// --------------------
// SIGN UP WITH PROFILE CREATION
// --------------------
export async function signUp(data: {
  email: string;
  password: string;
  fullName: string;
  role: 'client' | 'freelancer';
  // Freelancer fields
  username?: string;
  skills?: string[];
  hourlyRate?: number;
  bio?: string;
  title?: string;
  // Client fields
  companyName?: string;
  companyDescription?: string;
  website?: string;
  location?: string;
}) {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      data: {
        full_name: data.fullName,
        role: data.role,
      },
    },
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Failed to create account');
  }

  try {
    // 2. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
        role: data.role,
        profile_completed: false, // Ensure this is false initially
      });

    if (profileError) {
      throw new Error('Failed to create profile: ' + profileError.message);
    }

    // 3. Create role-specific record
    if (data.role === 'freelancer') {
      if (!data.username) {
        throw new Error('Username is required for freelancers');
      }

      const { error: freelancerError } = await supabase
        .from('freelancers')
        .insert({
          profile_id: authData.user.id,
          username: data.username,
          skills: data.skills || [],
          hourly_rate: data.hourlyRate || null,
          bio: data.bio || null,
          title: data.title || null,
        });

      if (freelancerError) {
        throw new Error('Failed to create freelancer profile: ' + freelancerError.message);
      }
    } else {
      // Client
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          profile_id: authData.user.id,
          company_name: data.companyName || null,
          company_description: data.companyDescription || null,
          website: data.website || null,
          location: data.location || null,
        });

      if (clientError) {
        throw new Error('Failed to create client profile: ' + clientError.message);
      }
    }

    // 4. Create custom verification token
    let verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`;
    try {
      const tokenResult = await createVerificationToken(authData.user.id);
      
      if (tokenResult.success && tokenResult.token) {
        // Build verification URL with token
        verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify?token=${tokenResult.token}`;
      } else {
        console.error('Error creating verification token:', tokenResult.error);
      }
    } catch (tokenError) {
      console.error('Error creating verification token:', tokenError);
    }

    // 5. Send welcome email with verification link
    try {
      console.log('📧 Attempting to send welcome email to:', data.email);
      const welcomeEmail = WelcomeEmail(data.fullName, verificationUrl);
      
      const emailResult = await sendEmailAction({
        to: data.email,
        subject: 'Welcome to Neplancer!',
        html: welcomeEmail
      });
      
      if (emailResult.success) {
        console.log('✅ Welcome email sent successfully to:', data.email);
      } else {
        console.error('⚠️ Failed to send welcome email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send welcome email:', emailError);
      console.error('⚠️ Email error details:', emailError instanceof Error ? emailError.message : emailError);
      // Don't throw - email failure shouldn't block registration
    }

    console.log('🔍 Registration complete. Email confirmation required?', !authData.session);
    console.log('🔍 User email confirmed at:', authData.user.email_confirmed_at);

    return authData;
  } catch (error) {
    // Rollback: delete auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw error;
  }
}

// --------------------
// SIGN IN
// --------------------
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  });
  
  if (error) {
    throw error;
  }
  
  return data;
}

// --------------------
// SIGN OUT
// --------------------
export async function signOut() {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut({
      scope: 'global' // Sign out from all sessions
    });
    
    if (error) {
      console.error('Sign out error:', error);
    }
    
    // Clear all Supabase cookies manually
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        if (name.includes('sb-') || name.includes('supabase')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      }
    }
    
    // Clear local storage
    if (typeof localStorage !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// --------------------
// GET CURRENT USER WITH PROFILE
// --------------------
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  // Single optimized query with joins to get all data at once
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      freelancers(completed_jobs, total_earned, rating),
      clients(jobs_posted, total_spent)
    `)
    .eq('id', user.id)
    .single();

  if (!profile) {
    return null;
  }

  // Provide defaults for optional admin fields
  const is_admin = (profile as any).is_admin || false;
  const admin_level = (profile as any).admin_level;

  // Build stats from joined data
  let stats = {};
  if (profile.role === 'freelancer' && profile.freelancers) {
    const freelancerData = Array.isArray(profile.freelancers) ? profile.freelancers[0] : profile.freelancers;
    stats = {
      completedJobs: freelancerData.completed_jobs || 0,
      totalEarnings: freelancerData.total_earned || 0,
      rating: freelancerData.rating || 5.0,
    };
  } else if (profile.role === 'client' && profile.clients) {
    const clientData = profile.clients;
    stats = {
      jobsPosted: clientData.jobs_posted || 0,
      totalSpent: clientData.total_spent || 0,
    };
  }

  return {
    id: user.id,
    email: profile.email,
    role: profile.role,
    fullName: profile.full_name,
    name: profile.full_name,
    avatarUrl: profile.avatar_url,
    profile_completed: profile.profile_completed,
    is_admin,
    admin_level,
    stats,
  } as User;
}

// --------------------
// GET CURRENT SESSION
// --------------------
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }
  return session;
}

// --------------------
// AUTH STATE CHANGE
// --------------------
export function onAuthStateChange(callback: (user: User | null) => void) {
  const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
  return listener;
}

// --------------------
// PASSWORD RESET
// --------------------
export async function sendPasswordResetEmail(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    throw error;
  }
  return data;
}

// --------------------
// REFRESH SESSION
// --------------------
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    throw error;
  }
  return data;
}