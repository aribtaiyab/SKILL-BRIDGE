-- Migration 03: Core Profiles and Role-Specific Tables

-- Central Profiles table linked to Supabase Auth (auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    phone VARCHAR(50),
    bio TEXT,
    location VARCHAR(255),
    language VARCHAR(50) NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL DEFAULT 'en',
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    opportunity_notifications BOOLEAN NOT NULL DEFAULT true,
    readiness_notifications BOOLEAN NOT NULL DEFAULT true,
    privacy_visibility VARCHAR(50) NOT NULL DEFAULT 'public',
    accessibility_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Student Profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    education VARCHAR(255),
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    graduation_year INTEGER CHECK (graduation_year >= 1990 AND graduation_year <= 2100),
    experience_level VARCHAR(50) DEFAULT 'Student',
    target_career_id UUID,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Industry Profiles table
CREATE TABLE IF NOT EXISTS industry_profiles (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    organization_name VARCHAR(255) NOT NULL,
    industry_type VARCHAR(100) NOT NULL DEFAULT 'Technology',
    organization_size VARCHAR(50) DEFAULT '50-200',
    location VARCHAR(255),
    website VARCHAR(255),
    description TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Academician Profiles table
CREATE TABLE IF NOT EXISTS academician_profiles (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(100) DEFAULT 'Professor',
    teaching_area VARCHAR(255),
    mentorship_interest BOOLEAN NOT NULL DEFAULT true,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Institution Profiles table
CREATE TABLE IF NOT EXISTS institution_profiles (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    institution_name VARCHAR(255) NOT NULL,
    institution_type VARCHAR(100) NOT NULL DEFAULT 'University',
    location VARCHAR(255),
    website VARCHAR(255),
    description TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
