-- Migration 21: Student Self-Ratings
-- Stores student-declared skill confidence labels, completely separate from
-- verified skill scores (student_skills / skill_scores). These are opinions,
-- not measurements, and must never be queried interchangeably with verified data.

CREATE TABLE IF NOT EXISTS student_self_ratings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    career_target_id UUID NOT NULL,  -- soft reference; career targets may be deleted
    skill_id        TEXT NOT NULL,   -- TEXT to accommodate both UUID and slug-based skill IDs
    self_rating_label VARCHAR(20) NOT NULL
        CHECK (self_rating_label IN ('never_used', 'basic', 'comfortable', 'strong')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- One rating per student per skill per career target; upsert-safe
    CONSTRAINT uq_student_career_skill_rating
        UNIQUE (student_id, career_target_id, skill_id)
);

-- Index for the GET /api/student/self-ratings/:career_target_id query
CREATE INDEX IF NOT EXISTS idx_self_ratings_student_career
    ON student_self_ratings (student_id, career_target_id);

-- RLS: students can only read/write their own ratings
ALTER TABLE student_self_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own self ratings"
    ON student_self_ratings
    FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);
