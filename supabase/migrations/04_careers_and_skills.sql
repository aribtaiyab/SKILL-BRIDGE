-- Migration 04: Careers, Skills, and Skill Relationships

-- Career Targets table
CREATE TABLE IF NOT EXISTS career_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'Engineering',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Link student_profiles target_career_id to career_targets
ALTER TABLE student_profiles 
    DROP CONSTRAINT IF EXISTS fk_student_profiles_target_career,
    ADD CONSTRAINT fk_student_profiles_target_career 
    FOREIGN KEY (target_career_id) REFERENCES career_targets(id) ON DELETE SET NULL;

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL DEFAULT 'Technical',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Career Target Skills (Required skills and threshold levels per career)
CREATE TABLE IF NOT EXISTS career_target_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_target_id UUID NOT NULL REFERENCES career_targets(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    required_level INTEGER NOT NULL CHECK (required_level >= 0 AND required_level <= 100),
    importance VARCHAR(50) NOT NULL DEFAULT 'High',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_career_target_skill UNIQUE (career_target_id, skill_id)
);

-- Student Skills (Individual student skill levels and verification status)
CREATE TABLE IF NOT EXISTS student_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    self_declared_level INTEGER NOT NULL DEFAULT 0 CHECK (self_declared_level >= 0 AND self_declared_level <= 100),
    current_level INTEGER NOT NULL DEFAULT 0 CHECK (current_level >= 0 AND current_level <= 100),
    verified_level INTEGER NOT NULL DEFAULT 0 CHECK (verified_level >= 0 AND verified_level <= 100),
    verification_status verification_status NOT NULL DEFAULT 'self_declared',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_skill UNIQUE (student_id, skill_id)
);
