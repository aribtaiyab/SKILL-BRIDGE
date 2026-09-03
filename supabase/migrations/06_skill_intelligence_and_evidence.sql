-- Migration 06: Skill Intelligence, Evidence, Verification, Projects, and Certifications

-- Documents table (metadata for uploaded files / credentials)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL DEFAULT 'certificate',
    file_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size INTEGER,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Skill Scores table (Historical log of all skill evaluations)
CREATE TABLE IF NOT EXISTS skill_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL DEFAULT 'assessment', -- 'assessment', 'practical', 'evidence', 'institution', 'manual'
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    assessment_attempt_id UUID REFERENCES assessment_attempts(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Skill Gaps table (Calculated gaps for students against their target career)
CREATE TABLE IF NOT EXISTS skill_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    career_target_id UUID NOT NULL REFERENCES career_targets(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    required_score INTEGER NOT NULL CHECK (required_score >= 0 AND required_score <= 100),
    current_score INTEGER NOT NULL CHECK (current_score >= 0 AND current_score <= 100),
    gap_score INTEGER NOT NULL CHECK (gap_score >= 0),
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium', -- 'Critical', 'High', 'Medium', 'Low'
    status gap_status NOT NULL DEFAULT 'needs_improvement',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_career_skill_gap UNIQUE (student_id, career_target_id, skill_id)
);

-- Skill Evidence table (Projects, practical tasks, code repositories, certs)
CREATE TABLE IF NOT EXISTS skill_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL DEFAULT 'project', -- 'project', 'github', 'practical_task', 'certificate', 'institution'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    verification_status verification_status NOT NULL DEFAULT 'self_declared',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Verification Records table (Skill Passport audit trail)
CREATE TABLE IF NOT EXISTS verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES skill_evidence(id) ON DELETE SET NULL,
    verification_type VARCHAR(50) NOT NULL DEFAULT 'practical',
    verified_level INTEGER NOT NULL CHECK (verified_level >= 0 AND verified_level <= 100),
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verification_source VARCHAR(100) NOT NULL DEFAULT 'SkillBridge Assessment Engine',
    notes TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_url TEXT,
    github_url TEXT,
    technologies TEXT[] DEFAULT '{}',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Project Skills link table
CREATE TABLE IF NOT EXISTS project_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_project_skill UNIQUE (project_id, skill_id)
);

-- Certifications table
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    credential_url TEXT,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    verification_status verification_status NOT NULL DEFAULT 'self_declared',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
