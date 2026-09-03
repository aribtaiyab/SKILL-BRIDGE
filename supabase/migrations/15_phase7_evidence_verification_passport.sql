-- Migration 15: Phase 7 Evidence, Proof, Verification & Intelligent Skill Passport

-- ─── Evidence Table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    evidence_type VARCHAR(50) NOT NULL DEFAULT 'project'
        CHECK (evidence_type IN ('project', 'github_repo', 'live_demo', 'certification', 'internship', 'academic_project', 'competition', 'practical_work', 'other')),
    url TEXT,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'under_review', 'verified', 'rejected', 'needs_clarification', 'archived')),
    reviewer_feedback TEXT,
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_evidence_student ON evidence(student_id);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence(status);
CREATE INDEX IF NOT EXISTS idx_evidence_created ON evidence(created_at DESC);

-- ─── Evidence Skills Relationship ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS evidence_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    student_claimed_level INTEGER CHECK (student_claimed_level >= 0 AND student_claimed_level <= 100),
    student_claim_description TEXT,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'rejected', 'unverified')),
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_evidence_skill UNIQUE (evidence_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_skills_evidence ON evidence_skills(evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_skills_skill ON evidence_skills(skill_id);

-- ─── Passport Settings Table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS passport_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    share_token VARCHAR(64) NOT NULL UNIQUE,
    is_public BOOLEAN NOT NULL DEFAULT false,
    headline VARCHAR(255),
    bio TEXT,
    show_skills BOOLEAN NOT NULL DEFAULT true,
    show_projects BOOLEAN NOT NULL DEFAULT true,
    show_certifications BOOLEAN NOT NULL DEFAULT true,
    show_readiness BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_passport_settings_token ON passport_settings(share_token);
CREATE INDEX IF NOT EXISTS idx_passport_settings_student ON passport_settings(student_id);

-- ─── RLS: evidence ─────────────────────────────────────────────────────────

ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

-- Students manage their own evidence
CREATE POLICY "evidence_student_select"
    ON evidence FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "evidence_student_insert"
    ON evidence FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "evidence_student_update"
    ON evidence FOR UPDATE
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "evidence_student_delete"
    ON evidence FOR DELETE
    USING (auth.uid() = student_id AND status IN ('draft', 'archived'));

-- Authorized reviewers (academicians, institution coordinators) can view submitted evidence
CREATE POLICY "evidence_reviewer_select"
    ON evidence FOR SELECT
    USING (
        status IN ('submitted', 'under_review', 'verified', 'rejected', 'needs_clarification')
        AND (
            EXISTS (
                SELECT 1 FROM academician_profiles ap
                JOIN student_profiles sp ON sp.institution_id = ap.institution_id
                WHERE ap.profile_id = auth.uid()
                AND sp.profile_id = evidence.student_id
            )
            OR
            EXISTS (
                SELECT 1 FROM institution_profiles ip
                JOIN student_profiles sp ON sp.institution_id = ip.institution_id
                WHERE ip.profile_id = auth.uid()
                AND sp.profile_id = evidence.student_id
            )
        )
    );

-- ─── RLS: evidence_skills ──────────────────────────────────────────────────

ALTER TABLE evidence_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence_skills_student_select"
    ON evidence_skills FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM evidence e
            WHERE e.id = evidence_skills.evidence_id
            AND e.student_id = auth.uid()
        )
    );

CREATE POLICY "evidence_skills_student_insert"
    ON evidence_skills FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM evidence e
            WHERE e.id = evidence_skills.evidence_id
            AND e.student_id = auth.uid()
        )
    );

CREATE POLICY "evidence_skills_student_update"
    ON evidence_skills FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM evidence e
            WHERE e.id = evidence_skills.evidence_id
            AND e.student_id = auth.uid()
        )
    );

CREATE POLICY "evidence_skills_student_delete"
    ON evidence_skills FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM evidence e
            WHERE e.id = evidence_skills.evidence_id
            AND e.student_id = auth.uid()
            AND e.status IN ('draft', 'archived')
        )
    );

CREATE POLICY "evidence_skills_reviewer_select"
    ON evidence_skills FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM evidence e
            WHERE e.id = evidence_skills.evidence_id
            AND e.status IN ('submitted', 'under_review', 'verified', 'rejected', 'needs_clarification')
        )
    );

-- ─── RLS: passport_settings ─────────────────────────────────────────────────

ALTER TABLE passport_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "passport_settings_student_all"
    ON passport_settings FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "passport_settings_public_select"
    ON passport_settings FOR SELECT
    USING (is_public = true);
