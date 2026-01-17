-- =====================================================
-- Whispering Palms - Complete Database Setup
-- Run this script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. Update plan_type columns to support all plans
-- =====================================================

-- Update daily_quotas table
ALTER TABLE daily_quotas 
ALTER COLUMN plan_type TYPE VARCHAR(20);

-- Update subscriptions table
ALTER TABLE subscriptions 
ALTER COLUMN plan_type TYPE VARCHAR(20);

-- Update user_profiles table
ALTER TABLE user_profiles 
ALTER COLUMN subscription_plan TYPE VARCHAR(20);
ALTER TABLE user_profiles 
ALTER COLUMN subscription_plan SET DEFAULT 'basic';

-- Update existing records to use 'basic' if null
UPDATE user_profiles 
SET subscription_plan = 'basic' 
WHERE subscription_plan IS NULL;

UPDATE daily_quotas 
SET plan_type = 'basic' 
WHERE plan_type IS NULL;

-- =====================================================
-- 2. Add email_metadata column to answers table
-- =====================================================

ALTER TABLE answers 
ADD COLUMN IF NOT EXISTS email_metadata JSONB;

-- Add comment for documentation
COMMENT ON COLUMN answers.email_metadata IS 'Stores email delivery information: {user_email, plan_type, delivery_time, audio_url, status, sent_at}';

-- =====================================================
-- 3. Create indexes for better performance
-- =====================================================

-- Index for daily_quotas lookups
CREATE INDEX IF NOT EXISTS idx_daily_quotas_user_date ON daily_quotas(user_id, date);

-- Index for questions by user and status
CREATE INDEX IF NOT EXISTS idx_questions_user_status ON questions(user_id, status);

-- Index for answers by question_id
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);

-- Index for email_metadata queries
CREATE INDEX IF NOT EXISTS idx_answers_email_metadata ON answers USING GIN (email_metadata);

-- =====================================================
-- 4. Add constraints and validations
-- =====================================================

-- Ensure plan_type values are valid
ALTER TABLE daily_quotas 
ADD CONSTRAINT check_plan_type_daily_quotas 
CHECK (plan_type IN ('basic', 'spark', 'flame', 'superflame'));

ALTER TABLE subscriptions 
ADD CONSTRAINT check_plan_type_subscriptions 
CHECK (plan_type IN ('basic', 'spark', 'flame', 'superflame'));

ALTER TABLE user_profiles 
ADD CONSTRAINT check_subscription_plan 
CHECK (subscription_plan IN ('basic', 'spark', 'flame', 'superflame'));

-- =====================================================
-- 5. Create function to reset daily quotas (for cron jobs)
-- =====================================================

CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS void AS $$
BEGIN
  -- Reset quotas for all users where reset_at has passed
  UPDATE daily_quotas
  SET 
    remaining_questions = max_questions,
    reset_at = (CURRENT_DATE + INTERVAL '1 day')::timestamp
  WHERE 
    reset_at < NOW()
    AND plan_type != 'superflame'; -- SuperFlame doesn't need reset
  
  -- For SuperFlame, ensure unlimited quota
  UPDATE daily_quotas
  SET 
    max_questions = 999999,
    remaining_questions = 999999
  WHERE 
    plan_type = 'superflame'
    AND (max_questions < 999999 OR remaining_questions < 999999);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Create view for subscription summary
-- =====================================================

CREATE OR REPLACE VIEW subscription_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.name,
  COALESCE(up.subscription_plan, 'basic') as current_plan,
  s.status as subscription_status,
  s.start_date,
  s.end_date,
  s.next_billing_date,
  dq.max_questions,
  dq.remaining_questions,
  dq.date as quota_date
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN daily_quotas dq ON u.id = dq.user_id AND dq.date = CURRENT_DATE;

-- =====================================================
-- 7. Grant permissions (if using Row Level Security)
-- =====================================================

-- Enable RLS on daily_quotas if not already enabled
ALTER TABLE daily_quotas ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own quotas
DROP POLICY IF EXISTS "Users can view own quotas" ON daily_quotas;
CREATE POLICY "Users can view own quotas" ON daily_quotas
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own quotas (for quota consumption)
DROP POLICY IF EXISTS "Users can update own quotas" ON daily_quotas;
CREATE POLICY "Users can update own quotas" ON daily_quotas
  FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 8. Sample data for testing (optional - comment out in production)
-- =====================================================

-- Uncomment below to create test subscription records
/*
INSERT INTO subscriptions (user_id, plan_type, status, start_date, end_date, next_billing_date, provider)
SELECT 
  id,
  'basic',
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 month',
  CURRENT_DATE + INTERVAL '1 month',
  'stripe'
FROM users
WHERE id NOT IN (SELECT user_id FROM subscriptions WHERE status = 'active')
LIMIT 1;
*/

-- =====================================================
-- 9. Verification queries
-- =====================================================

-- Check plan types are updated correctly
SELECT 
  'daily_quotas' as table_name,
  plan_type,
  COUNT(*) as count
FROM daily_quotas
GROUP BY plan_type
UNION ALL
SELECT 
  'subscriptions' as table_name,
  plan_type,
  COUNT(*) as count
FROM subscriptions
GROUP BY plan_type
UNION ALL
SELECT 
  'user_profiles' as table_name,
  subscription_plan as plan_type,
  COUNT(*) as count
FROM user_profiles
GROUP BY subscription_plan;

-- Check email_metadata column exists
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'answers' 
  AND column_name = 'email_metadata';

-- =====================================================
-- Setup Complete!
-- =====================================================
-- All tables are now ready to support:
-- - Basic plan (free, 2 questions/day)
-- - Spark plan ($10/month, $80/year, 5 questions/day)
-- - Flame plan ($25/month, $200/year, 8 questions/day)
-- - SuperFlame plan ($35/month, $280/year, unlimited questions)
-- =====================================================
