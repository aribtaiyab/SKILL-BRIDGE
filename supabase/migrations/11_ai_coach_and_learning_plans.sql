-- Migration 11: AI Skill Coach, Learning Plans, Practice Sessions, and AI Recommendations

-- Learning Plans table
CREATE TABLE IF NOT EXISTS learning_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    career_target_id UUID REFERENCES career_targets(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    initial_score INTEGER NOT NULL CHECK (initial_score >= 0 AND initial_score <= 100),
    target_score INTEGER NOT NULL CHECK (target_score >= 0 AND target_score <= 100),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'archived'
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Learning Plan Steps table
CREATE TABLE IF NOT EXISTS learning_plan_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_plan_id UUID NOT NULL REFERENCES learning_plans(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- 'understand', 'learn', 'practice', 'build', 'reassess'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    estimated_minutes INTEGER DEFAULT 30,
    action_type VARCHAR(50) DEFAULT 'reading', -- 'reading', 'exercise', 'project', 'assessment'
    action_payload JSONB DEFAULT '{}'::jsonb,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Practice Sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    subskill VARCHAR(150),
    difficulty VARCHAR(50) NOT NULL DEFAULT 'Intermediate', -- 'Beginner', 'Developing', 'Intermediate', 'Advanced'
    question_type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice', 'code_reasoning', 'debugging', 'architecture'
    question_text TEXT NOT NULL,
    options JSONB, -- For MCQ: [{ id, text }]
    server_correct_answer TEXT, -- Kept server-side
    student_answer TEXT,
    is_correct BOOLEAN,
    feedback_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ
);

-- AI Recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    career_target_id REFERENCES career_targets(id) ON DELETE SET NULL,
    recommendation_type VARCHAR(50) NOT NULL, -- 'priority_gap', 'practice', 'reassessment', 'career_alignment', 'evidence'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'High',
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_plans_student ON learning_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_plan_steps_plan ON learning_plan_steps(learning_plan_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_student ON practice_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_student ON ai_recommendations(student_id);

-- Enable RLS
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Students can manage own learning plans" ON learning_plans;
CREATE POLICY "Students can manage own learning plans"
    ON learning_plans FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can manage own learning plan steps" ON learning_plan_steps;
CREATE POLICY "Students can manage own learning plan steps"
    ON learning_plan_steps FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM learning_plans
            WHERE learning_plans.id = learning_plan_steps.learning_plan_id
            AND learning_plans.student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students can manage own practice sessions" ON practice_sessions;
CREATE POLICY "Students can manage own practice sessions"
    ON practice_sessions FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can manage own recommendations" ON ai_recommendations;
CREATE POLICY "Students can manage own recommendations"
    ON ai_recommendations FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);
