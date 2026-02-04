-- Horoscope Cache Table
-- Stores daily horoscope predictions to avoid regenerating for the same user on the same day
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS horoscope_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  horoscope_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for faster lookups
  CONSTRAINT unique_cache_key UNIQUE (cache_key)
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_horoscope_cache_user_id ON horoscope_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_horoscope_cache_created ON horoscope_cache(created_at);

-- RLS Policies
ALTER TABLE horoscope_cache ENABLE ROW LEVEL SECURITY;

-- Users can read their own horoscope cache
CREATE POLICY "Users can read own horoscope" ON horoscope_cache
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert/update horoscope cache
CREATE POLICY "Service can manage horoscope cache" ON horoscope_cache
  FOR ALL USING (true);

-- Clean up old cache entries (older than 2 days)
-- Run this periodically or set up a cron job
-- DELETE FROM horoscope_cache WHERE created_at < NOW() - INTERVAL '2 days';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON horoscope_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON horoscope_cache TO service_role;
