-- Whispering Palms Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE palm_type_enum AS ENUM ('right_front', 'left_front', 'right_side', 'left_side');
CREATE TYPE matching_status_enum AS ENUM ('pending', 'matched', 'mismatch', 'flagged');
CREATE TYPE matching_result_status_enum AS ENUM ('pending', 'verified', 'rejected', 'manual_review');
CREATE TYPE subscription_plan_enum AS ENUM ('spark', 'flame');
CREATE TYPE subscription_status_enum AS ENUM ('trial', 'active', 'past_due', 'canceled', 'expired');
CREATE TYPE question_source_enum AS ENUM ('deep_outlook', 'subscription');
CREATE TYPE question_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE reading_job_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE transaction_type_enum AS ENUM ('deep_outlook', 'subscription', 'renewal');
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE payment_provider_enum AS ENUM ('stripe', 'razorpay');
CREATE TYPE admin_role_enum AS ENUM ('super_admin', 'moderator', 'support');
CREATE TYPE question_category_enum AS ENUM ('love', 'career', 'family', 'spiritual', 'money', 'general');

-- Users table
-- Note: password_hash is nullable because we use Supabase Auth for authentication
-- If you want to use custom JWT auth instead, make this NOT NULL and hash passwords
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Nullable: Using Supabase Auth, passwords stored in auth.users
    name VARCHAR(255),
    country VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50),
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    time_of_birth TIME,
    place_of_birth VARCHAR(255),
    birth_timezone VARCHAR(50),
    astropalm_profile_text TEXT,
    consent_flags JSONB DEFAULT '{"images": false, "data_usage": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Palm images table
CREATE TABLE palm_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    palm_type palm_type_enum NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    public_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    matching_score FLOAT,
    matching_status matching_status_enum DEFAULT 'pending',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_palm_images_user_id ON palm_images(user_id);
CREATE INDEX idx_palm_images_matching_status ON palm_images(matching_status);

-- Palm matching results table
CREATE TABLE palm_matching_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    right_palm_id UUID REFERENCES palm_images(id) ON DELETE SET NULL,
    left_palm_id UUID REFERENCES palm_images(id) ON DELETE SET NULL,
    matching_confidence FLOAT CHECK (matching_confidence >= 0 AND matching_confidence <= 1),
    feature_vector JSONB,
    status matching_result_status_enum DEFAULT 'pending',
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_palm_matching_results_user_id ON palm_matching_results(user_id);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type subscription_plan_enum NOT NULL,
    status subscription_status_enum DEFAULT 'trial',
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,
    stripe_subscription_id VARCHAR(255),
    razorpay_subscription_id VARCHAR(255),
    provider payment_provider_enum,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Daily quotas table
CREATE TABLE daily_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    plan_type subscription_plan_enum NOT NULL,
    max_questions INTEGER NOT NULL,
    remaining_questions INTEGER NOT NULL,
    reset_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_quotas_user_date ON daily_quotas(user_id, date);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    source question_source_enum NOT NULL,
    text_original TEXT NOT NULL,
    text_internal_en TEXT,
    language_detected VARCHAR(10),
    category question_category_enum DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status question_status_enum DEFAULT 'pending'
);

CREATE INDEX idx_questions_user_id ON questions(user_id);
CREATE INDEX idx_questions_status ON questions(status);

-- Answers table
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    text_internal_en TEXT,
    safety_flags JSONB,
    reviewed BOOLEAN DEFAULT false,
    flagged BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    llm_model_used VARCHAR(100),
    tokens_used INTEGER
);

CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_user_id ON answers(user_id);
CREATE INDEX idx_answers_flagged ON answers(flagged);

-- Reading jobs table (Deep Outlook)
CREATE TABLE reading_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status reading_job_status_enum DEFAULT 'pending',
    questions JSONB NOT NULL,
    generated_content TEXT,
    payment_transaction_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

CREATE INDEX idx_reading_jobs_user_id ON reading_jobs(user_id);
CREATE INDEX idx_reading_jobs_status ON reading_jobs(status);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type transaction_type_enum NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    provider payment_provider_enum,
    provider_payment_id VARCHAR(255),
    status transaction_status_enum DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- AnythingLLM workspaces table
CREATE TABLE anythingllm_workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    workspace_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_anythingllm_workspaces_user_id ON anythingllm_workspaces(user_id);

-- Admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role admin_role_enum DEFAULT 'support',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_quotas_updated_at BEFORE UPDATE ON daily_quotas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anythingllm_workspaces_updated_at BEFORE UPDATE ON anythingllm_workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
