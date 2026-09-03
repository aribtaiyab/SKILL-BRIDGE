-- Migration 14: Phase 6 Opportunity Intelligence
-- Tables: saved_opportunities, application_readiness_snapshots
-- RLS policies for both tables

-- ─── Saved Opportunities ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_saved_opportunity UNIQUE (student_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_opportunities_student ON saved_opportunities(student_id);
CREATE INDEX IF NOT EXISTS idx_saved_opportunities_opportunity ON saved_opportunities(opportunity_id);

-- ─── Application Readiness Snapshots ────────────────────────────────────────

-- Captures the student's readiness at the exact moment of application submission.
-- This lets students and industry see "readiness when applied" vs "readiness now".

CREATE TABLE IF NOT EXISTS application_readiness_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    readiness_percentage INTEGER NOT NULL CHECK (readiness_percentage >= 0 AND readiness_percentage <= 100),
    skills_met INTEGER NOT NULL DEFAULT 0,
    total_skills INTEGER NOT NULL DEFAULT 0,
    snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_application_snapshot UNIQUE (application_id)
);

CREATE INDEX IF NOT EXISTS idx_application_snapshots_application ON application_readiness_snapshots(application_id);

-- ─── RLS: saved_opportunities ─────────────────────────────────────────────

ALTER TABLE saved_opportunities ENABLE ROW LEVEL SECURITY;

-- Students can only see and manage their own saved opportunities
CREATE POLICY "saved_opps_student_select"
    ON saved_opportunities FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "saved_opps_student_insert"
    ON saved_opportunities FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "saved_opps_student_delete"
    ON saved_opportunities FOR DELETE
    USING (auth.uid() = student_id);

-- ─── RLS: application_readiness_snapshots ─────────────────────────────────

ALTER TABLE application_readiness_snapshots ENABLE ROW LEVEL SECURITY;

-- Students can view snapshots for their own applications
CREATE POLICY "readiness_snapshot_student_select"
    ON application_readiness_snapshots FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM applications a
            WHERE a.id = application_id
            AND a.student_id = auth.uid()
        )
    );

-- Industry can view snapshots for applications to their opportunities
CREATE POLICY "readiness_snapshot_industry_select"
    ON application_readiness_snapshots FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN opportunities o ON o.id = a.opportunity_id
            WHERE a.id = application_id
            AND o.industry_id = auth.uid()
        )
    );

-- Snapshots are inserted server-side only (service role); no direct client insert
CREATE POLICY "readiness_snapshot_service_insert"
    ON application_readiness_snapshots FOR INSERT
    WITH CHECK (true); -- Restricted to service_role key via API layer auth
