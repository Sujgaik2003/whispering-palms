# Database Schema Updates for Subscription Plans

## Required Updates

### 1. Update `daily_quotas` table

Add support for `basic` plan type:

```sql
-- Update plan_type enum to include 'basic'
ALTER TABLE daily_quotas 
ALTER COLUMN plan_type TYPE VARCHAR(20);

-- Or if using enum type, recreate it:
-- DROP TYPE IF EXISTS plan_type_enum;
-- CREATE TYPE plan_type_enum AS ENUM ('basic', 'spark', 'flame');
-- ALTER TABLE daily_quotas ALTER COLUMN plan_type TYPE plan_type_enum USING plan_type::text::plan_type_enum;
```

### 2. Update `subscriptions` table

Add support for `basic` plan type:

```sql
-- Similar update for subscriptions table
ALTER TABLE subscriptions 
ALTER COLUMN plan_type TYPE VARCHAR(20);
```

### 3. Update `user_profiles` table

Ensure `subscription_plan` column supports all three plans:

```sql
-- Check current column type
-- If it's enum, update it:
ALTER TABLE user_profiles 
ALTER COLUMN subscription_plan TYPE VARCHAR(20);

-- Set default to 'basic'
ALTER TABLE user_profiles 
ALTER COLUMN subscription_plan SET DEFAULT 'basic';
```

### 4. Add `email_metadata` column to `answers` table

Store email delivery information:

```sql
ALTER TABLE answers 
ADD COLUMN IF NOT EXISTS email_metadata JSONB;

-- Example structure:
-- {
--   "user_email": "user@example.com",
--   "plan_type": "flame",
--   "delivery_time": "2024-01-01T12:00:00Z",
--   "audio_url": "/audio/answer_123.wav",
--   "status": "pending" | "sent",
--   "sent_at": "2024-01-01T13:00:00Z"
-- }
```

## Migration Script

Run this SQL script in Supabase SQL Editor:

```sql
-- 1. Update daily_quotas
ALTER TABLE daily_quotas 
ALTER COLUMN plan_type TYPE VARCHAR(20);

-- 2. Update subscriptions  
ALTER TABLE subscriptions 
ALTER COLUMN plan_type TYPE VARCHAR(20);

-- 3. Update user_profiles
ALTER TABLE user_profiles 
ALTER COLUMN subscription_plan TYPE VARCHAR(20);
ALTER TABLE user_profiles 
ALTER COLUMN subscription_plan SET DEFAULT 'basic';

-- 4. Add email_metadata to answers
ALTER TABLE answers 
ADD COLUMN IF NOT EXISTS email_metadata JSONB;

-- 5. Update existing records to use 'basic' if null
UPDATE user_profiles 
SET subscription_plan = 'basic' 
WHERE subscription_plan IS NULL;

UPDATE daily_quotas 
SET plan_type = 'basic' 
WHERE plan_type IS NULL;
```

## Verification

After running migrations, verify:

```sql
-- Check plan types
SELECT DISTINCT plan_type FROM daily_quotas;
SELECT DISTINCT plan_type FROM subscriptions;
SELECT DISTINCT subscription_plan FROM user_profiles;

-- Check email_metadata column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'answers' AND column_name = 'email_metadata';
```
