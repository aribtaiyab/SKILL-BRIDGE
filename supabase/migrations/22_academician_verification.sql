-- Migration 22: Academician Skill Verification Module
-- Authoritative Human Verification Layer for Student Skills

-- 1. Verification Requests Table
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    academician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    skill_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'request_sent'
        CHECK (status IN ('not_requested', 'request_sent', 'accepted', 'scheduled', 'in_progress', 'verified', 'rejected', 'reassessment_required', 'reschedule_required')),
    supporting_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    rejection_reason VARCHAR(255),
    rejection_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_student ON verification_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_academician ON verification_requests(academician_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);

-- 2. Verification Sessions (Live Video & Test Scheduling)
CREATE TABLE IF NOT EXISTS verification_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    verification_methods JSONB NOT NULL DEFAULT '["live_video", "skill_test"]'::jsonb,
    meeting_link VARCHAR(255),
    verification_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_verification_sessions_request ON verification_sessions(request_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_status ON verification_sessions(status);

-- 3. Academic Tests & Questions
CREATE TABLE IF NOT EXISTS academic_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    passing_score INTEGER NOT NULL DEFAULT 75,
    difficulty VARCHAR(50) NOT NULL DEFAULT 'intermediate',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS academic_test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES academic_tests(id) ON DELETE CASCADE,
    question_type VARCHAR(50) NOT NULL DEFAULT 'conceptual'
        CHECK (question_type IN ('conceptual', 'practical', 'debugging', 'project_based')),
    question_text TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INTEGER NOT NULL DEFAULT 25
);

CREATE INDEX IF NOT EXISTS idx_academic_test_questions_test ON academic_test_questions(test_id);

-- 4. Academic Test Attempts
CREATE TABLE IF NOT EXISTS academic_test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES academic_tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    score INTEGER NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT false,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Skill Verifications (Authoritative Record of Verified Badge)
CREATE TABLE IF NOT EXISTS skill_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES verification_requests(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    academician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    verification_method VARCHAR(100) NOT NULL DEFAULT 'Live Video Verification + Skill Test',
    academic_test_score INTEGER NOT NULL DEFAULT 0,
    evidence_score INTEGER NOT NULL DEFAULT 0,
    platform_assessment_score INTEGER NOT NULL DEFAULT 0,
    verification_notes TEXT,
    evidence_reviewed JSONB NOT NULL DEFAULT '[]'::jsonb,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'academically_verified',
    CONSTRAINT uq_student_skill_verification UNIQUE (student_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_skill_verifications_student ON skill_verifications(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_verifications_academician ON skill_verifications(academician_id);

-- 6. Row Level Security
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_verifications ENABLE ROW LEVEL SECURITY;

-- Students view/insert own requests
CREATE POLICY "Students manage own verification requests" ON verification_requests
    FOR ALL USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

-- Academicians view assigned or open requests
CREATE POLICY "Academicians view and update requests" ON verification_requests
    FOR ALL USING (
        academician_id = auth.uid() OR
        EXISTS (SELECT 1 FROM academician_profiles WHERE profile_id = auth.uid())
    );

-- Skill Verifications: Students & Academicians view; Public/Industry view public verification badges
CREATE POLICY "Anyone can view verified skill badges" ON skill_verifications
    FOR SELECT USING (true);

CREATE POLICY "Academicians issue skill verifications" ON skill_verifications
    FOR INSERT WITH CHECK (academician_id = auth.uid());
