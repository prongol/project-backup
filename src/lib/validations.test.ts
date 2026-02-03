import { describe, it, expect } from 'vitest';
import {
  signInSchema,
  signUpSchema,
  createJobSchema,
  createProposalSchema,
} from './validations';

describe('Validation Schemas', () => {
  describe('signInSchema', () => {
    it('should validate correct email and password', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = signInSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('should reject empty password', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });
  });

  describe('signUpSchema', () => {
    it('should validate correct signup data', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'StrongPass123!',
        name: 'John Doe',
        role: 'freelancer',
      });
      expect(result.success).toBe(true);
    });

    it('should reject weak password', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: '123',
        name: 'John Doe',
        role: 'freelancer',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });

    it('should reject invalid role', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'StrongPass123!',
        name: 'John Doe',
        role: 'admin',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createJobSchema', () => {
    it('should validate correct job data', () => {
      const result = createJobSchema.safeParse({
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Build a Website',
        description: 'Need a professional website for my business',
        category: 'Web Development',
        budget: 5000,
        duration: '1-3 months',
        skills: ['React', 'Node.js'],
        experienceLevel: 'intermediate',
      });
      expect(result.success).toBe(true);
    });

    it('should reject title less than 10 characters', () => {
      const result = createJobSchema.safeParse({
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Short',
        description: 'Need a professional website for my business',
        category: 'Web Development',
        budget: 5000,
        duration: '1-3 months',
        skills: ['React'],
        experienceLevel: 'intermediate',
      });
      expect(result.success).toBe(false);
    });

    it('should reject budget less than $5', () => {
      const result = createJobSchema.safeParse({
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Build a Website',
        description: 'Need a professional website',
        category: 'Web Development',
        budget: 2,
        duration: '1-3 months',
        skills: ['React'],
        experienceLevel: 'intermediate',
      });
      expect(result.success).toBe(false);
    });

    it('should require at least one skill', () => {
      const result = createJobSchema.safeParse({
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Build a Website',
        description: 'Need a professional website',
        category: 'Web Development',
        budget: 5000,
        duration: '1-3 months',
        skills: [],
        experienceLevel: 'intermediate',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createProposalSchema', () => {
    it('should validate correct proposal data', () => {
      const result = createProposalSchema.safeParse({
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        freelancerId: '123e4567-e89b-12d3-a456-426614174001',
        coverLetter: 'I am excited to work on this project because...',
        proposedRate: 100,
        estimatedDuration: '2 weeks',
      });
      expect(result.success).toBe(true);
    });

    it('should reject cover letter less than 50 characters', () => {
      const result = createProposalSchema.safeParse({
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        freelancerId: '123e4567-e89b-12d3-a456-426614174001',
        coverLetter: 'Too short',
        proposedRate: 100,
        estimatedDuration: '2 weeks',
      });
      expect(result.success).toBe(false);
    });

    it('should reject rate less than $5', () => {
      const result = createProposalSchema.safeParse({
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        freelancerId: '123e4567-e89b-12d3-a456-426614174001',
        coverLetter: 'I am excited to work on this project because I have extensive experience',
        proposedRate: 2,
        estimatedDuration: '2 weeks',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('emailSchema', () => {
    it('should validate correct email', () => {
      const emails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com',
      ];
      
      emails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
      ];
      
      invalidEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });
    });
  });
});
