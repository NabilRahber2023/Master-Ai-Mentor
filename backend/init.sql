-- AI Mentor Database Initialization Script
-- Creates pgvector extension and initial schema

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For text search

-- Create students table (will be populated via CSV ingestion)
CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    district VARCHAR(100),
    family_income FLOAT,
    budget_per_semester FLOAT,
    study_style VARCHAR(50),
    attendance_rate FLOAT,
    hsc_gpa FLOAT,
    english_proficiency INTEGER,
    math_skill INTEGER,
    memory_strength INTEGER,
    stress_management INTEGER,
    study_hours_weekly FLOAT,
    assignment_completion_rate FLOAT,
    class_participation INTEGER,
    project_skill_score INTEGER,
    research_interest_score INTEGER,
    extracurricular_involvement VARCHAR(100),
    current_sgpa FLOAT,
    past_semester_sgpa_1 FLOAT,
    past_semester_sgpa_2 FLOAT,
    next_semester_sgpa FLOAT,
    leadership_indicator INTEGER,
    productivity_score INTEGER,
    initiative_score INTEGER,
    programming_interest INTEGER,
    business_interest INTEGER,
    creative_interest INTEGER,
    hardware_interest INTEGER,
    math_interest INTEGER,
    communication_skill INTEGER,
    analytical_skill INTEGER,
    problem_solving_score INTEGER,
    preferred_department VARCHAR(100),
    personality_type VARCHAR(10),
    tech_score FLOAT,
    business_score FLOAT,
    creative_score FLOAT,
    research_score FLOAT,
    work_style VARCHAR(50),
    soft_skill_score FLOAT,
    career_orientation VARCHAR(100),
    preferred_career_path VARCHAR(100),
    performance_score INTEGER,
    potential_score INTEGER,
    nine_box_position VARCHAR(50),
    -- Extra features required by the single-student ML models for CSV mode
    ssc_gpa FLOAT,
    father_education VARCHAR(20),
    mother_education VARCHAR(20),
    part_time_hours FLOAT,
    parental_support VARCHAR(10),
    active_participation VARCHAR(10),
    public_speaking INTEGER,
    internship_experience_months INTEGER,
    projects_completed INTEGER,
    preferred_work_environment VARCHAR(20),
    interest_area VARCHAR(50),
    teamwork_score INTEGER,
    learning_agility INTEGER,
    adaptability INTEGER,
    career_motivation INTEGER,
    embedding VECTOR(384),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes for students table
-- B-tree index on name for exact matches
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

-- GIN index on name for fuzzy text search (trigram)
CREATE INDEX IF NOT EXISTS idx_students_name_gin ON students USING gin(name gin_trgm_ops);

-- B-tree index on student_id (primary key already indexed, but explicit)
CREATE INDEX IF NOT EXISTS idx_students_id ON students(student_id);

-- ivfflat index on embedding for vector similarity search
-- Using cosine distance operator
CREATE INDEX IF NOT EXISTS idx_students_embedding ON students USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_students_dept_sgpa ON students(preferred_department, current_sgpa);

-- Create chat_sessions table with conversation memory
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    selected_student_id VARCHAR(50),
    last_resolved_student_id VARCHAR(50),
    pending_fields JSONB DEFAULT '{}',
    last_intent VARCHAR(50),
    last_tool_called VARCHAR(50),
    last_tool_summary TEXT,
    context JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for chat_sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_id ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_student ON chat_sessions(selected_student_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updated_at);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

-- Analyze tables for query optimization
ANALYZE students;
ANALYZE chat_sessions;

