-- Migration 20: Career Navigator Sessions, Decisions, and RLS Policies

CREATE TABLE IF NOT EXISTS career_navigator_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'Career Analysis',
    active_intent VARCHAR(50) NOT NULL DEFAULT 'CAREER_COMPARISON',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS career_navigator_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES career_navigator_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    intent VARCHAR(50) NOT NULL,
    recommended_career_slug VARCHAR(100),
    recommended_career_name VARCHAR(255),
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    comparison_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    why_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    market_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_career_nav_sessions_student ON career_navigator_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_career_nav_decisions_student ON career_navigator_decisions(student_id);
CREATE INDEX IF NOT EXISTS idx_career_nav_decisions_session ON career_navigator_decisions(session_id);

-- Enable RLS
ALTER TABLE career_navigator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_navigator_decisions ENABLE ROW LEVEL SECURITY;

-- Students manage only their own sessions and decisions
CREATE POLICY "Students manage own career navigator sessions"
    ON career_navigator_sessions FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students manage own career navigator decisions"
    ON career_navigator_decisions FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);
