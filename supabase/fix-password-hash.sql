-- Migration: Make password_hash nullable for Supabase Auth
-- Run this in Supabase SQL Editor if you already created the users table

-- Make password_hash nullable (we use Supabase Auth, so passwords are stored in auth.users)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Optional: Add a comment explaining why it's nullable
COMMENT ON COLUMN users.password_hash IS 'Nullable when using Supabase Auth. Passwords are stored in auth.users table.';
