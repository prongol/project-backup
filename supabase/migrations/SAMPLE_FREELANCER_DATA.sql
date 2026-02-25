-- Sample freelancer data for testing
-- Run this in your Supabase SQL Editor to populate the database with test freelancers

-- First, ensure we have some profiles (these should already exist from auth)
-- You'll need to replace these IDs with actual profile IDs from your auth.users table

-- Sample freelancer 1
INSERT INTO freelancers (
  id,
  profile_id, 
  username, 
  title, 
  bio, 
  skills, 
  hourly_rate, 
  total_earned, 
  completed_jobs, 
  rating, 
  total_reviews, 
  status, 
  portfolio_url, 
  github_url, 
  linkedin_url
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE role = 'freelancer' LIMIT 1 OFFSET 0),
  'sarah_webdev',
  'Full Stack Web Developer',
  'Experienced full stack developer with 5+ years in React, Node.js, and modern web technologies. I specialize in building scalable web applications and have worked with startups and enterprises.',
  ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
  75.00,
  45000.00,
  28,
  4.9,
  25,
  'online',
  'https://sarahwebdev.portfolio.com',
  'https://github.com/sarahwebdev',
  'https://linkedin.com/in/sarahwebdev'
) ON CONFLICT (profile_id) DO NOTHING;

-- Sample freelancer 2  
INSERT INTO freelancers (
  id,
  profile_id,
  username,
  title,
  bio,
  skills,
  hourly_rate,
  total_earned,
  completed_jobs,
  rating,
  total_reviews,
  status,
  portfolio_url,
  github_url
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE role = 'freelancer' LIMIT 1 OFFSET 1),
  'alex_designer',
  'UI/UX Designer & Frontend Developer',
  'Creative UI/UX designer with strong frontend development skills. I create beautiful, user-friendly interfaces and can implement them with pixel-perfect precision.',
  ARRAY['UI/UX Design', 'Figma', 'React', 'CSS', 'Adobe Creative Suite'],
  65.00,
  32000.00,
  22,
  4.8,
  20,
  'online',
  'https://alexdesigns.com',
  'https://github.com/alexdesigner'
) ON CONFLICT (profile_id) DO NOTHING;

-- Sample freelancer 3
INSERT INTO freelancers (
  id,
  profile_id,
  username,
  title,
  bio,
  skills,
  hourly_rate,
  total_earned,
  completed_jobs,
  rating,
  total_reviews,
  status,
  portfolio_url
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE role = 'freelancer' LIMIT 1 OFFSET 2),
  'mike_mobile',
  'Mobile App Developer (iOS & Android)',
  'Native and cross-platform mobile developer with expertise in React Native, Flutter, and Swift. I build high-performance mobile apps for both iOS and Android.',
  ARRAY['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase'],
  80.00,
  55000.00,
  32,
  4.9,
  30,
  'online',
  'https://mikemobile.dev'
) ON CONFLICT (profile_id) DO NOTHING;

-- Sample freelancer 4
INSERT INTO freelancers (
  id,
  profile_id,
  username,
  title,
  bio,
  skills,
  hourly_rate,
  total_earned,
  completed_jobs,
  rating,
  total_reviews,
  status
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE role = 'freelancer' LIMIT 1 OFFSET 3),
  'emma_writer',
  'Content Writer & SEO Specialist',
  'Professional content writer with SEO expertise. I create engaging blog posts, web copy, and marketing content that drives traffic and conversions.',
  ARRAY['Content Writing', 'SEO', 'Copywriting', 'Marketing', 'Research'],
  45.00,
  28000.00,
  45,
  4.7,
  42,
  'offline'
) ON CONFLICT (profile_id) DO NOTHING;

-- Sample freelancer 5
INSERT INTO freelancers (
  id,
  profile_id,
  username,
  title,
  bio,
  skills,
  hourly_rate,
  total_earned,
  completed_jobs,
  rating,
  total_reviews,
  status,
  github_url,
  linkedin_url
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE role = 'freelancer' LIMIT 1 OFFSET 4),
  'david_backend',
  'Backend Engineer & DevOps',
  'Senior backend engineer specializing in scalable APIs, microservices, and cloud infrastructure. Expert in Python, Go, and AWS.',
  ARRAY['Python', 'Go', 'AWS', 'Docker', 'Kubernetes'],
  90.00,
  65000.00,
  25,
  4.9,
  22,
  'online',
  'https://github.com/davidbackend',
  'https://linkedin.com/in/davidbackend'
) ON CONFLICT (profile_id) DO NOTHING;

-- If you need to create some basic freelancer profiles manually:
-- (Only run this if you don't have freelancer profiles in your auth.users table)

/*
-- Create basic profiles for testing (replace emails with your test emails)
INSERT INTO profiles (id, email, full_name, role) VALUES
  (gen_random_uuid(), 'sarah@example.com', 'Sarah Johnson', 'freelancer'),
  (gen_random_uuid(), 'alex@example.com', 'Alex Chen', 'freelancer'),
  (gen_random_uuid(), 'mike@example.com', 'Mike Rodriguez', 'freelancer'),
  (gen_random_uuid(), 'emma@example.com', 'Emma Davis', 'freelancer'),
  (gen_random_uuid(), 'david@example.com', 'David Wilson', 'freelancer')
ON CONFLICT (email) DO NOTHING;
*/

-- Verify the data was inserted
SELECT 
  f.username, 
  f.title, 
  f.hourly_rate, 
  f.rating,
  f.status,
  p.full_name,
  p.email
FROM freelancers f
JOIN profiles p ON f.profile_id = p.id
ORDER BY f.created_at DESC;