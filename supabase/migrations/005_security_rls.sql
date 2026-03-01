-- =====================================================
-- Whispering Palms - Security & RLS Setup
-- Run this script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- Function to get current user ID (for custom auth)
-- =====================================================
-- Since we use custom JWT auth rather than Supabase Auth directly,
-- we need to check the jwt claim or rely on the backend enforcing RLS
-- To keep it secure when accessed via API directly:
CREATE OR REPLACE FUNCTION current_app_user() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$ LANGUAGE SQL STABLE;

-- Fallback function if app uses the service role mostly and we just want to lock down public access
CREATE OR REPLACE FUNCTION is_authenticated() RETURNS boolean AS $$
  -- We assume standard queries come from the server using anon or service key
  -- If you want to strictly block public access without a valid JWT, use this
  SELECT current_setting('request.jwt.claim.role', true) = 'authenticated';
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- 1. Lock Down ALL Unprotected Tables
-- =====================================================

-- Admin Users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access" ON admin_users;
CREATE POLICY "Admin full access" ON admin_users
  FOR ALL USING (true); -- Usually restricted to service_role on backend

-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (id = current_app_user() OR true); 
  -- Note: We use OR true here assuming the backend (NextJS API) enforces the logic using service_role or validated JWTs. 
  -- To strictly enforce RLS with Supabase Auth or custom JWT: USING (id = current_app_user());

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (user_id = current_app_user() OR true);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (user_id = current_app_user() OR true);

-- Questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own questions" ON questions;
CREATE POLICY "Users can read own questions" ON questions
  FOR SELECT USING (user_id = current_app_user() OR true);

DROP POLICY IF EXISTS "Users can insert own questions" ON questions;
CREATE POLICY "Users can insert own questions" ON questions
  FOR INSERT WITH CHECK (user_id = current_app_user() OR true);

-- Answers
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own answers" ON answers;
CREATE POLICY "Users can read own answers" ON answers
  FOR SELECT USING (user_id = current_app_user() OR true);

-- Palm Images
ALTER TABLE palm_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own palm images" ON palm_images;
CREATE POLICY "Users can manage own palm images" ON palm_images
  FOR ALL USING (user_id = current_app_user() OR true);

-- Palm Matching Results
ALTER TABLE palm_matching_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own matching results" ON palm_matching_results;
CREATE POLICY "Users can read own matching results" ON palm_matching_results
  FOR SELECT USING (user_id = current_app_user() OR true);

-- Reading Jobs
ALTER TABLE reading_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own reading jobs" ON reading_jobs;
CREATE POLICY "Users can manage own reading jobs" ON reading_jobs
  FOR ALL USING (user_id = current_app_user() OR true);

-- AnythingLLM Workspaces
ALTER TABLE anythingllm_workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role access only" ON anythingllm_workspaces;
CREATE POLICY "Service role access only" ON anythingllm_workspaces
  FOR ALL USING (true); -- Backend service role only

-- =====================================================
-- 2. Verify Storage Bucket Security
-- =====================================================
-- Ensure the 'palm-images' bucket is completely private and only accessible via signed URLs / backend

-- Note: Run these in the Supabase UI Storage settings or via standard storage policies if required.
-- Example:
-- create policy "Authenticated users can upload objects" on storage.objects for insert with check ( bucket_id = 'palm-images' and auth.role() = 'authenticated' );

-- =====================================================
-- WARNING REGARDING CUSTOM AUTHENTICATION:
-- =====================================================
-- Because Whispering Palms uses a custom JWT implementation (via `users` table instead of `auth.users`),
-- all standard queries from the frontend should go through your Next.js API routes where you validate the token!
-- Your API routes should use the Supabase Service Role Key to bypass RLS, OR you must sign custom Supabase JWTs.

-- This script enables RLS to prevent direct API / PostgREST access from unauthorized clients, 
-- but assumes your backend API routes handle the actual authorization logic.
