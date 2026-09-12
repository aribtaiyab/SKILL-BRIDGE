-- ==============================================================================
-- SkillBridge Connect - Live Student-to-Academia Supabase Verification Schema
-- ==============================================================================

-- 1. Create Verification Requests Table
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_email TEXT,
    department TEXT DEFAULT 'Computer Science & Engineering',
    skill_name TEXT NOT NULL,
    verification_tier TEXT NOT NULL CHECK (verification_tier IN ('Assessment Verified', 'Practical Verified', 'Evidence Verified', 'Institution Verified')),
    score NUMERIC DEFAULT 0,
    proof_url TEXT,
    proof_notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    faculty_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create Student Skills Table (if not existing)
CREATE TABLE IF NOT EXISTS public.student_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    score NUMERIC DEFAULT 0,
    verification_level TEXT NOT NULL DEFAULT 'Self-Declared' 
      CHECK (verification_level IN ('Self-Declared', 'Assessment Verified', 'Practical Verified', 'Evidence Verified', 'Institution Verified')),
    last_evaluated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, skill_name)
);

-- 3. Row Level Security Policies
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for demo" ON public.verification_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert for demo" ON public.verification_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for demo" ON public.verification_requests FOR UPDATE USING (true);

CREATE POLICY "Allow public read skills" ON public.student_skills FOR SELECT USING (true);
CREATE POLICY "Allow public upsert skills" ON public.student_skills FOR ALL USING (true);

-- 4. Initial Seed Verification Tickets for Quick Testing
INSERT INTO public.verification_requests (student_id, student_name, student_email, department, skill_name, verification_tier, score, proof_url, proof_notes, status)
VALUES 
  ('std-2026-001', 'Aarav Mehta', 'aarav.mehta@dtu.ac.in', 'Computer Science & Engineering', 'Node.js & Express', 'Practical Verified', 88, 'https://github.com/aaravmehta/scalable-express-api', 'Implemented cluster workers, JWT auth middleware, and comprehensive unit tests with 94% code coverage.', 'pending'),
  ('std-2026-002', 'Sneha Patel', 'sneha.patel@dtu.ac.in', 'Computer Science & Engineering', 'REST API Architecture', 'Assessment Verified', 92, 'https://github.com/snehapatel/rest-ecommerce-backend', 'Achieved 92/100 on official benchmarking assessment.', 'pending')
ON CONFLICT DO NOTHING;
