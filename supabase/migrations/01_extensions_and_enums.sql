-- Migration 01: Extensions and Custom Enums for SkillBridge Connect

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'industry', 'academician', 'institution');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verification status enum
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'self_declared',
        'assessment_verified',
        'practical_verified',
        'evidence_verified',
        'institution_verified'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Assessment type enum
DO $$ BEGIN
    CREATE TYPE assessment_type AS ENUM ('knowledge', 'practical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Assessment attempt status enum
DO $$ BEGIN
    CREATE TYPE attempt_status AS ENUM ('in_progress', 'completed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Skill gap status enum
DO $$ BEGIN
    CREATE TYPE gap_status AS ENUM ('critical', 'needs_improvement', 'ready');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Improvement plan status enum
DO $$ BEGIN
    CREATE TYPE improvement_plan_status AS ENUM ('recommended', 'active', 'completed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Opportunity status enum
DO $$ BEGIN
    CREATE TYPE opportunity_status AS ENUM ('draft', 'published', 'closed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Work mode enum
DO $$ BEGIN
    CREATE TYPE work_mode AS ENUM ('remote', 'onsite', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Application status enum
DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('applied', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Mentorship status enum
DO $$ BEGIN
    CREATE TYPE mentorship_status AS ENUM ('requested', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
