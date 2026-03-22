/**
 * Freelancer Ranking and Recommendation System
 * 
 * Implements a multi-factor scoring approach combined with collaborative filtering
 * and content-based matching to rank and recommend freelancers.
 */

import { supabase } from "./supabase";
import type { Database } from "@/types/database";

type FreelancerRow = Database["public"]["Tables"]["freelancers"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type JobRow = Database["public"]["Tables"]["jobs"]["Row"];

export interface FreelancerScore {
  freelancerId: string;
  profileQuality: number;
  performanceMetrics: number;
  experienceScore: number;
  reputationScore: number;
  jobMatchScore: number;
  recencyBoost: number;
  finalScore: number;
  activityMultiplier: number;
}

export interface RankedFreelancer extends FreelancerRow {
  profiles: ProfileRow;
  score: FreelancerScore;
}

// Scoring weights (sum to 1.0)
const WEIGHTS = {
  profileQuality: 0.15,
  performance: 0.25,
  experience: 0.20,
  reputation: 0.25,
  jobMatch: 0.10,
  recency: 0.05,
};

/**
 * Calculate Profile Quality Score (0-100)
 * Based on profile completeness and quality indicators
 */
function calculateProfileQualityScore(
  freelancer: FreelancerRow,
  profile: ProfileRow
): number {
  let score = 0;
  
  // Bio completeness (25 points)
  if (freelancer.bio) {
    const bioLength = freelancer.bio.length;
    score += Math.min(25, (bioLength / 500) * 25);
  }
  
  // Skills (25 points)
  if (freelancer.skills && freelancer.skills.length > 0) {
    score += Math.min(25, freelancer.skills.length * 5);
  }
  
  // Portfolio/Links (25 points)
  let linksCount = 0;
  if (freelancer.portfolio_url) linksCount++;
  if (freelancer.github_url) linksCount++;
  if (freelancer.linkedin_url) linksCount++;
  score += linksCount * 8.33;
  
  // Profile picture (10 points)
  if (profile.avatar_url) {
    score += 10;
  }
  
  // Title/Headline (15 points)
  if (freelancer.title) {
    score += 15;
  }
  
  return Math.min(100, score);
}

/**
 * Calculate Performance Metrics Score (0-100)
 * Based on job completion and client satisfaction
 */
function calculatePerformanceScore(freelancer: FreelancerRow): number {
  let score = 0;
  
  // Success rate (50 points) - based on whether jobs have been completed
  const completedJobs = freelancer.completed_jobs || 0;
  if (completedJobs > 0) {
    score += 50;
  } else {
    score += 25; // New freelancers get half points
  }
  
  // Rating normalized (50 points)
  if (freelancer.rating) {
    score += (freelancer.rating / 5) * 50;
  } else {
    score += 25; // New freelancers get half points
  }
  // Note: recency/response-time is handled separately by calculateRecencyBoost
  // and calculateActivityMultiplier to avoid triple-penalizing inactive freelancers.
  
  return Math.min(100, score);
}

/**
 * Calculate Experience Score (0-100)
 * Based on jobs completed and earnings with logarithmic scaling
 */
function calculateExperienceScore(freelancer: FreelancerRow): number {
  let score = 0;
  
  // Jobs completed with logarithmic scaling (60 points)
  const completedJobs = freelancer.completed_jobs || 0;
  if (completedJobs > 0) {
    // Log scale: 1 job = 10 pts, 10 jobs = 20 pts, 100 jobs = 30 pts
    const jobScore = Math.min(60, Math.log10(completedJobs + 1) * 30);
    score += jobScore;
  }
  
  // Total earnings (40 points)
  const totalEarned = freelancer.total_earned || 0;
  if (totalEarned > 0) {
    // $1,000 = 10 pts, $5,000 = 20 pts, $10,000 = 30 pts, $50,000+ = 40 pts
    const earningsScore = Math.min(40, Math.log10(totalEarned / 100 + 1) * 20);
    score += earningsScore;
  }
  
  return Math.min(100, score);
}

/**
 * Calculate Reputation Score (0-100)
 * Based on ratings and reviews
 */
function calculateReputationScore(freelancer: FreelancerRow): number {
  let score = 0;
  
  // Average rating (60 points)
  if (freelancer.rating) {
    score += (freelancer.rating / 5) * 60;
  } else {
    score += 30; // New freelancers get half points
  }
  
  // Number of reviews with diminishing returns (40 points)
  const totalReviews = freelancer.total_reviews || 0;
  if (totalReviews > 0) {
    // 1 review = 5 pts, 10 reviews = 20 pts, 50+ reviews = 40 pts
    const reviewScore = Math.min(40, Math.sqrt(totalReviews) * 8);
    score += reviewScore;
  }
  
  return Math.min(100, score);
}

/**
 * Calculate Skill Match Score (0-100)
 * Matches freelancer skills against required job skills
 */
function calculateSkillMatchScore(
  freelancerSkills: string[] | null,
  jobSkills: string[] | null
): number {
  if (!freelancerSkills || !jobSkills || jobSkills.length === 0) {
    return 50; // Neutral score if no skills to match
  }
  
  const normalizedFreelancerSkills = freelancerSkills.map(s => s.toLowerCase().trim());
  const normalizedJobSkills = jobSkills.map(s => s.toLowerCase().trim());
  
  // Count exact matches
  const exactMatches = normalizedJobSkills.filter(jobSkill =>
    normalizedFreelancerSkills.some(fSkill => fSkill.includes(jobSkill) || jobSkill.includes(fSkill))
  ).length;
  
  // Calculate match percentage
  const matchPercentage = (exactMatches / normalizedJobSkills.length) * 100;
  
  return Math.min(100, matchPercentage);
}

/**
 * Calculate Budget Match Score (0-100)
 * Checks if freelancer rate fits within budget range
 */
function calculateBudgetMatchScore(
  freelancerRate: number | null,
  jobBudget: number | null
): number {
  if (!freelancerRate || !jobBudget) {
    return 50; // Neutral score if no budget info
  }
  
  // Convert hourly rate to project estimate (assume 40 hours)
  const estimatedCost = freelancerRate * 40;
  const ratio = estimatedCost / jobBudget;
  
  if (ratio >= 0.7 && ratio <= 1.3) return 100; // Perfect range
  if (ratio >= 0.5 && ratio <= 1.5) return 80;
  if (ratio >= 0.3 && ratio <= 2.0) return 50;
  return 20;
}

/**
 * Calculate Recency Boost (0-100)
 * Rewards recently active freelancers
 */
function calculateRecencyBoost(freelancer: FreelancerRow): number {
  if (!freelancer.updated_at) return 50;
  
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(freelancer.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceUpdate <= 1) return 100;
  if (daysSinceUpdate <= 7) return 90;
  if (daysSinceUpdate <= 14) return 75;
  if (daysSinceUpdate <= 30) return 60;
  if (daysSinceUpdate <= 90) return 40;
  return 20;
}

/**
 * Calculate Activity Multiplier
 * Boosts active freelancers (1.0 - 1.1x)
 */
function calculateActivityMultiplier(freelancer: FreelancerRow): number {
  const daysSinceUpdate = freelancer.updated_at
    ? Math.floor((Date.now() - new Date(freelancer.updated_at).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  // Active in last 7 days gets 1.1x boost
  if (daysSinceUpdate <= 7) return 1.1;
  
  // Active in last 30 days gets 1.05x boost
  if (daysSinceUpdate <= 30) return 1.05;
  
  return 1.0;
}

/**
 * Calculate comprehensive freelancer score
 */
export function calculateFreelancerScore(
  freelancer: FreelancerRow,
  profile: ProfileRow,
  job?: JobRow
): FreelancerScore {
  const profileQuality = calculateProfileQualityScore(freelancer, profile);
  const performanceMetrics = calculatePerformanceScore(freelancer);
  const experienceScore = calculateExperienceScore(freelancer);
  const reputationScore = calculateReputationScore(freelancer);
  const recencyBoost = calculateRecencyBoost(freelancer);
  
  // Calculate job match if job is provided
  let jobMatchScore = 50; // Default neutral score
  if (job) {
    const skillMatch = calculateSkillMatchScore(freelancer.skills, job.skills);
    const budgetMatch = calculateBudgetMatchScore(freelancer.hourly_rate, job.budget);
    jobMatchScore = (skillMatch * 0.7 + budgetMatch * 0.3);
  }
  
  // Calculate weighted final score
  const baseScore =
    WEIGHTS.profileQuality * profileQuality +
    WEIGHTS.performance * performanceMetrics +
    WEIGHTS.experience * experienceScore +
    WEIGHTS.reputation * reputationScore +
    WEIGHTS.jobMatch * jobMatchScore +
    WEIGHTS.recency * recencyBoost;
  
  // Apply activity multiplier
  const activityMultiplier = calculateActivityMultiplier(freelancer);
  const finalScore = baseScore * activityMultiplier;
  
  return {
    freelancerId: freelancer.id,
    profileQuality,
    performanceMetrics,
    experienceScore,
    reputationScore,
    jobMatchScore,
    recencyBoost,
    finalScore,
    activityMultiplier,
  };
}

/**
 * Rank all freelancers by overall quality (no specific job)
 */
export async function rankAllFreelancers(options?: {
  limit?: number;
  minRating?: number;
  skills?: string[];
  availableOnly?: boolean;
}): Promise<RankedFreelancer[]> {
  let query = supabase
    .from("freelancers")
    .select("*, profiles!inner(*)");
  
  // Apply filters
  if (options?.minRating) {
    query = query.gte("rating", options.minRating);
  }
  
  if (options?.availableOnly) {
    query = query.eq("status", "available");
  }
  
  const { data, error } = await query;
  
  if (error || !data) {
    console.error("Error fetching freelancers:", error);
    return [];
  }
  
  // Calculate scores for each freelancer
  type FreelancerWithProfile = FreelancerRow & { profiles: ProfileRow };
  const rankedFreelancers = (data as FreelancerWithProfile[])
    .map((item) => {
      const score = calculateFreelancerScore(item, item.profiles);
      return {
        ...item,
        score,
      } as RankedFreelancer;
    })
    .filter((fl: RankedFreelancer) => {
      // Filter by skills if specified
      if (options?.skills && options.skills.length > 0) {
        return options.skills.some(skill =>
          fl.skills?.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        );
      }
      return true;
    })
    .sort((a: RankedFreelancer, b: RankedFreelancer) => b.score.finalScore - a.score.finalScore);
  
  // Apply limit if specified
  if (options?.limit) {
    return rankedFreelancers.slice(0, options.limit);
  }
  
  return rankedFreelancers;
}

/**
 * Recommend freelancers for a specific job
 */
export async function recommendFreelancersForJob(
  jobId: string,
  options?: {
    limit?: number;
    minRating?: number;
  }
): Promise<RankedFreelancer[]> {
  // Fetch the job
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  
  if (jobError || !job) {
    console.error("Error fetching job:", jobError);
    return [];
  }
  
  // Fetch freelancers
  let query = supabase
    .from("freelancers")
    .select("*, profiles!inner(*)");
  
  if (options?.minRating) {
    query = query.gte("rating", options.minRating);
  }
  
  const { data, error } = await query;
  
  if (error || !data) {
    console.error("Error fetching freelancers:", error);
    return [];
  }
  
  // Calculate scores with job context
  type FreelancerWithProfile = FreelancerRow & { profiles: ProfileRow };
  const rankedFreelancers = (data as FreelancerWithProfile[])
    .map((item) => {
      const score = calculateFreelancerScore(item, item.profiles, job);
      return {
        ...item,
        score,
      } as RankedFreelancer;
    })
    .sort((a, b) => b.score.finalScore - a.score.finalScore);
  
  // Apply limit
  const limit = options?.limit || 20;
  return rankedFreelancers.slice(0, limit);
}

/**
 * Find similar freelancers based on skills and category
 */
export async function findSimilarFreelancers(
  freelancerId: string,
  options?: {
    limit?: number;
  }
): Promise<RankedFreelancer[]> {
  // Get the reference freelancer
  const { data: refFreelancer, error: refError } = await supabase
    .from("freelancers")
    .select("*, profiles!inner(*)")
    .eq("id", freelancerId)
    .single();
  
  if (refError || !refFreelancer) {
    console.error("Error fetching reference freelancer:", refError);
    return [];
  }
  
  // Fetch all other freelancers
  const { data: allFreelancers, error } = await supabase
    .from("freelancers")
    .select("*, profiles!inner(*)")
    .neq("id", freelancerId);
  
  if (error || !allFreelancers) {
    console.error("Error fetching freelancers:", error);
    return [];
  }
  
  // Calculate similarity scores
  type FreelancerWithProfile = FreelancerRow & { profiles: ProfileRow };
  const similarFreelancers = (allFreelancers as FreelancerWithProfile[])
    .map((item) => {
      const score = calculateFreelancerScore(item, item.profiles);
      
      // Calculate skill similarity
      const refSkills = refFreelancer.skills || [];
      const candidateSkills = item.skills || [];
      const commonSkills = refSkills.filter(s =>
        candidateSkills.some((cs: string) => cs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(cs.toLowerCase()))
      );
      const skillSimilarity = refSkills.length > 0 ? (commonSkills.length / refSkills.length) * 100 : 0;
      
      // Calculate rate similarity (within 50% range)
      const refRate = refFreelancer.hourly_rate || 0;
      const candidateRate = item.hourly_rate || 0;
      const rateDiff = Math.abs(refRate - candidateRate);
      const rateSimilarity = refRate > 0 ? Math.max(0, 100 - (rateDiff / refRate) * 100) : 50;
      
      // Calculate title similarity
      const titleSimilarity = refFreelancer.title && item.title
        ? (refFreelancer.title.toLowerCase() === item.title.toLowerCase() ? 100 : 50)
        : 25;
      
      // Combined similarity score
      const similarityScore = (skillSimilarity * 0.5 + rateSimilarity * 0.3 + titleSimilarity * 0.2);
      
      // Final score combines similarity and quality
      const combinedScore = similarityScore * 0.6 + score.finalScore * 0.4;
      
      return {
        ...item,
        score: {
          ...score,
          finalScore: combinedScore,
        },
        similarityScore,
      } as RankedFreelancer & { similarityScore: number };
    })
    .sort((a, b) => b.score.finalScore - a.score.finalScore);
  
  // Apply limit
  const limit = options?.limit || 5;
  return similarFreelancers.slice(0, limit);
}

/**
 * Search and rank freelancers with filters
 */
export async function searchAndRankFreelancers(filters: {
  query?: string;
  skills?: string[];
  category?: string;
  minRating?: number;
  maxRate?: number;
  minRate?: number;
  limit?: number;
}): Promise<RankedFreelancer[]> {
  let query = supabase
    .from("freelancers")
    .select("*, profiles!inner(*)");
  
  // Apply rating filter
  if (filters.minRating) {
    query = query.gte("rating", filters.minRating);
  }
  
  // Apply rate filters
  if (filters.maxRate) {
    query = query.lte("hourly_rate", filters.maxRate);
  }
  if (filters.minRate) {
    query = query.gte("hourly_rate", filters.minRate);
  }
  
  const { data, error } = await query;
  
  if (error || !data) {
    console.error("Error searching freelancers:", error);
    return [];
  }
  
  // Filter and score
  type FreelancerWithProfile = FreelancerRow & { profiles: ProfileRow };
  let results = (data as FreelancerWithProfile[]).map((item) => {
    const score = calculateFreelancerScore(item, item.profiles);
    return {
      ...item,
      score,
    } as RankedFreelancer;
  });
  
  // Text search filter
  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter((fl) => {
      const matchesName = fl.profiles?.full_name?.toLowerCase().includes(q);
      const matchesTitle = fl.title?.toLowerCase().includes(q);
      const matchesBio = fl.bio?.toLowerCase().includes(q);
      const matchesSkills = fl.skills?.some((s: string) => s.toLowerCase().includes(q));
      return matchesName || matchesTitle || matchesBio || matchesSkills;
    });
  }
  
  // Skills filter
  if (filters.skills && filters.skills.length > 0) {
    results = results.filter((fl) =>
      filters.skills!.some(skill =>
        fl.skills?.some((s: string) => s.toLowerCase().includes(skill.toLowerCase()))
      )
    );
  }
  
  // Category filter (match in title or skills)
  if (filters.category && filters.category !== 'All Categories') {
    const cat = filters.category.toLowerCase();
    results = results.filter((fl) => {
      const matchesTitle = fl.title?.toLowerCase().includes(cat);
      const matchesSkills = fl.skills?.some((s: string) => s.toLowerCase().includes(cat));
      return matchesTitle || matchesSkills;
    });
  }
  
  // Sort by score
  results.sort((a: RankedFreelancer, b: RankedFreelancer) => b.score.finalScore - a.score.finalScore);
  
  // Apply limit
  if (filters.limit) {
    return results.slice(0, filters.limit);
  }
  
  return results;
}
