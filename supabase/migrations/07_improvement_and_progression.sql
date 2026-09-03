-- Migration 07: Improvement System, Reassessments, Progress History, and AI Recommendations

-- Improvement Plans table
CREATE TABLE IF NOT EXISTS improvement_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    target_score INTEGER NOT NULL CHECK (target_score >= 0 AND target_score <= 100),
    starting_score INTEGER NOT NULL CHECK (starting_score >= 0 AND starting_score <= 100),
    status improvement_plan_status NOT NULL DEFAULT 'recommended',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Improvement Activities table (Learn -> Practice -> Practical Challenge -> Reassess)
CREATE TABLE IF NOT EXISTS improvement_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    improvement_plan_id UUID NOT NULL REFERENCES improvement_plans(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_type VARCHAR(50) NOT NULL DEFAULT 'learn', -- 'learn', 'practice', 'challenge', 'reassess'
    duration_minutes INTEGER DEFAULT 15,
    order_index INTEGER NOT NULL DEFAULT 1,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ
);

-- Reassessments table (Tracks step-by-step score improvements, e.g., 45 -> 67 -> 81)
CREATE TABLE IF NOT EXISTS reassessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    previous_score INTEGER NOT NULL CHECK (previous_score >= 0 AND previous_score <= 100),
    new_score INTEGER NOT NULL CHECK (new_score >= 0 AND new_score <= 100),
    improvement_plan_id UUID REFERENCES improvement_plans(id) ON DELETE SET NULL,
    assessment_attempt_id UUID REFERENCES assessment_attempts(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Progress History table (Immutable timeline data for historical charts, e.g. 6-month progress)
CREATE TABLE IF NOT EXISTS progress_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    source VARCHAR(50) NOT NULL DEFAULT 'assessment'
);

-- AI Recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    recommendation_type VARCHAR(50) NOT NULL DEFAULT 'skill_gap', -- 'skill_gap', 'learning', 'practice', 'reassessment', 'opportunity', 'readiness_nudge'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ
);
