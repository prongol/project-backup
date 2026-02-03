import { z } from 'zod';

// ==========================================
// EMAIL VALIDATION HELPERS
// ==========================================

// List of common disposable email domains to block
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'throwaway.email', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'trashmail.com', 'temp-mail.org', 'fakeinbox.com',
  'yopmail.com', 'getnada.com', 'maildrop.cc', 'mintemail.com'
];

// Enhanced email validation function
function validateEmail(email: string): boolean {
  // Basic format check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;

  // Extract domain
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  // Check for disposable email
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) return false;

  // Check for valid TLD (at least 2 characters)
  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) return false;

  // Additional checks
  if (email.includes('..')) return false; // No consecutive dots
  if (email.startsWith('.') || email.endsWith('.')) return false;
  if (email.includes(' ')) return false; // No spaces

  return true;
}

// Custom email refinement for Zod
const emailValidation = z
  .string()
  .min(1, 'Email address is required')
  .email('Please enter a valid email address')
  .toLowerCase()
  .refine(
    (email) => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email);
    },
    { message: 'Please enter a properly formatted email address' }
  )
  .refine(
    (email) => {
      const domain = email.split('@')[1]?.toLowerCase();
      return domain && !DISPOSABLE_EMAIL_DOMAINS.includes(domain);
    },
    { message: 'Disposable email addresses are not allowed. Please use a real email address' }
  )
  .refine(
    (email) => !email.includes('..'),
    { message: 'Email address cannot contain consecutive dots' }
  )
  .refine(
    (email) => {
      const localPart = email.split('@')[0];
      return localPart && localPart.length > 0 && localPart.length <= 64;
    },
    { message: 'Email address format is invalid' }
  )
  .refine(
    (email) => {
      const domain = email.split('@')[1];
      return domain && domain.length <= 255;
    },
    { message: 'Email domain is too long' }
  );

// ==========================================
// AUTH VALIDATIONS
// ==========================================

export const signInSchema = z.object({
  email: emailValidation,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signUpSchema = z.object({
  email: emailValidation,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name is too long'),
  role: z.enum(['client', 'freelancer']),
  // Freelancer specific fields
  username: z.string().min(3, 'Username must be at least 3 characters').max(50).optional(),
  skills: z.array(z.string()).max(20, 'Maximum 20 skills allowed').optional(),
  hourlyRate: z.number().positive('Hourly rate must be positive').max(10000, 'Hourly rate is too high').optional(),
  bio: z.string().max(1000, 'Bio is too long').optional(),
  title: z.string().max(100, 'Title is too long').optional(),
  // Client specific fields
  companyName: z.string().max(100, 'Company name is too long').optional(),
  companyDescription: z.string().max(1000, 'Company description is too long').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  location: z.string().max(100, 'Location is too long').optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailValidation,
});

// Export validation function for client-side use
export { validateEmail };

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ==========================================
// JOB VALIDATIONS
// ==========================================

export const createJobSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title is too long'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000, 'Description is too long'),
  budget: z.number().positive('Budget must be greater than 0').max(1000000, 'Budget is too high'),
  category: z.string().min(1, 'Category is required'),
  skills: z.array(z.string()).min(1, 'At least one skill is required').max(15, 'Maximum 15 skills allowed'),
  deadline: z.string().datetime().optional().nullable(),
});

export const updateJobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title is too long').optional(),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000, 'Description is too long').optional(),
  budget: z.number().positive('Budget must be greater than 0').max(1000000, 'Budget is too high').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  skills: z.array(z.string()).min(1, 'At least one skill is required').max(15, 'Maximum 15 skills allowed').optional(),
  deadline: z.string().datetime().optional().nullable(),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
});

// ==========================================
// PROPOSAL VALIDATIONS
// ==========================================

export const createProposalSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  freelancerId: z.string().uuid('Invalid freelancer ID'),
  coverLetter: z.string().min(100, 'Cover letter must be at least 100 characters').max(2000, 'Cover letter is too long'),
  proposedBudget: z.number().positive('Budget must be greater than 0').max(1000000, 'Budget is too high'),
  estimatedDuration: z.string().min(1, 'Estimated duration is required').max(50, 'Duration description is too long'),
});

export const updateProposalSchema = z.object({
  coverLetter: z.string().min(100, 'Cover letter must be at least 100 characters').max(2000, 'Cover letter is too long').optional(),
  proposedBudget: z.number().positive('Budget must be greater than 0').max(1000000, 'Budget is too high').optional(),
  estimatedDuration: z.string().min(1, 'Estimated duration is required').max(50, 'Duration description is too long').optional(),
  status: z.enum(['pending', 'accepted', 'rejected']).optional(),
});

// ==========================================
// FREELANCER PROFILE VALIDATIONS
// ==========================================

export const updateFreelancerProfileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username is too long').optional(),
  title: z.string().max(100, 'Title is too long').optional(),
  bio: z.string().max(1000, 'Bio is too long').optional(),
  skills: z.array(z.string()).max(20, 'Maximum 20 skills allowed').optional(),
  hourlyRate: z.number().positive('Hourly rate must be positive').max(10000, 'Hourly rate is too high').optional(),
  portfolioUrl: z.string().url('Invalid portfolio URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  status: z.enum(['available', 'busy', 'unavailable']).optional(),
});

// ==========================================
// CLIENT PROFILE VALIDATIONS
// ==========================================

export const updateClientProfileSchema = z.object({
  companyName: z.string().max(100, 'Company name is too long').optional(),
  companyDescription: z.string().max(1000, 'Company description is too long').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  location: z.string().max(100, 'Location is too long').optional(),
});

// ==========================================
// CONTRACT VALIDATIONS
// ==========================================

export const createContractSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  freelancerId: z.string().uuid('Invalid freelancer ID'),
  clientId: z.string().uuid('Invalid client ID'),
  budget: z.number().positive('Budget must be greater than 0').max(1000000, 'Budget is too high'),
  terms: z.string().min(50, 'Contract terms must be at least 50 characters').max(5000, 'Contract terms are too long'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date').optional().nullable(),
});

export const updateContractSchema = z.object({
  status: z.enum(['active', 'completed', 'cancelled', 'disputed']).optional(),
  endDate: z.string().datetime('Invalid end date').optional().nullable(),
});

// ==========================================
// QUERY PARAMETER VALIDATIONS
// ==========================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const jobFilterSchema = z.object({
  clientId: z.string().uuid().optional(),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
  category: z.string().optional(),
  minBudget: z.number().positive().optional(),
  maxBudget: z.number().positive().optional(),
  skills: z.array(z.string()).optional(),
  search: z.string().max(200).optional(),
});

// ==========================================
// HELPER TYPE EXPORTS
// ==========================================

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
export type UpdateFreelancerProfileInput = z.infer<typeof updateFreelancerProfileSchema>;
export type UpdateClientProfileInput = z.infer<typeof updateClientProfileSchema>;
export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type JobFilterInput = z.infer<typeof jobFilterSchema>;
