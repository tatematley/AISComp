-- Migration: 001_initial_schema
-- Description: Complete initial database schema for AIS HR Comp
-- Run this on a fresh database to set up all tables

-- ============================================
-- LOOKUP TABLES (no dependencies)
-- ============================================

CREATE TABLE IF NOT EXISTS user_roles (
    user_role_id SERIAL PRIMARY KEY,
    user_role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS department (
    department_id SERIAL PRIMARY KEY,
    department_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS location (
    location_id SERIAL PRIMARY KEY,
    location_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS education (
    education_id SERIAL PRIMARY KEY,
    education_level TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pronoun (
    pronoun_id SERIAL PRIMARY KEY,
    pronouns TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS skill_category (
    skill_category_id SERIAL PRIMARY KEY,
    skill_category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_status (
    job_status_id SERIAL PRIMARY KEY,
    job_status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS candidate_status (
    candidate_status INTEGER PRIMARY KEY,
    candidate_status_description TEXT NOT NULL
);

-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS app_user (
    user_id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    user_role_id INTEGER NOT NULL REFERENCES user_roles(user_role_id),
    password TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS skill (
    skill_id SERIAL PRIMARY KEY,
    skill_name TEXT NOT NULL,
    skill_category_id INTEGER REFERENCES skill_category(skill_category_id)
);

CREATE TABLE IF NOT EXISTS candidate (
    candidate_id SERIAL PRIMARY KEY,
    currentrole TEXT,
    department_id INTEGER REFERENCES department(department_id),
    location_id INTEGER REFERENCES location(location_id),
    years_exp INTEGER,
    availability_hours INTEGER,
    education_level_id INTEGER REFERENCES education(education_id),
    start_date DATE,
    current_candidate BOOLEAN NOT NULL DEFAULT TRUE,
    candidate_status INTEGER
);

CREATE TABLE IF NOT EXISTS candidate_information (
    candidate_id INTEGER PRIMARY KEY REFERENCES candidate(candidate_id),
    name TEXT NOT NULL,
    profile_photo TEXT,
    date_of_birth DATE,
    age INTEGER,
    "position" TEXT,
    email TEXT,
    phone_number TEXT,
    internal BOOLEAN,
    pronouns_id INTEGER REFERENCES pronoun(pronoun_id),
    application_date DATE
);

CREATE TABLE IF NOT EXISTS internal_candidate (
    candidate_id INTEGER PRIMARY KEY REFERENCES candidate(candidate_id),
    pip BOOLEAN,
    tenure NUMERIC(4,1),
    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5)
);

CREATE TABLE IF NOT EXISTS candidate_skill (
    candidate_skill_id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidate(candidate_id),
    skill_id INTEGER REFERENCES skill(skill_id),
    proficiency_level INTEGER,
    UNIQUE(candidate_id, skill_id)
);

CREATE TABLE IF NOT EXISTS job (
    job_id SERIAL PRIMARY KEY,
    job_title TEXT NOT NULL,
    job_category TEXT,
    job_description TEXT,
    department INTEGER REFERENCES department(department_id),
    job_status_id INTEGER REFERENCES job_status(job_status_id),
    min_years_experience INTEGER,
    education_req INTEGER REFERENCES education(education_id),
    job_salary NUMERIC,
    job_location INTEGER REFERENCES location(location_id),
    work_status TEXT,
    start_date DATE,
    job_group CHARACTER(1) NOT NULL
);

CREATE TABLE IF NOT EXISTS job_skill (
    jobskill_id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES job(job_id),
    skill_id INTEGER REFERENCES skill(skill_id),
    required_level INTEGER,
    importance_weight NUMERIC(4,2)
);

-- ============================================
-- ML TRAINING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS candidate_application (
    application_id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidate(candidate_id),
    job_id INTEGER REFERENCES job(job_id),
    outcome INTEGER NOT NULL,
    applied_date DATE
);

-- ============================================
-- DEFAULT DATA
-- ============================================

INSERT INTO candidate_status (candidate_status, candidate_status_description)
VALUES (0, 'Rejected'), (1, 'Applied'), (2, 'Interviewing'), (3, 'Hired')
ON CONFLICT (candidate_status) DO NOTHING;
