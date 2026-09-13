-- Migration 23: Student Passport & Profile Enhancement Fields
-- Adds structured educational fields and professional links to student_profiles table

ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS college_name VARCHAR(255);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS degree VARCHAR(255);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS branch VARCHAR(255);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_college ON student_profiles(college_name);
