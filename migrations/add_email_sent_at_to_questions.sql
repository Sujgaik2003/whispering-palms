-- Migration: Add email_sent_at column to questions table
-- This column tracks when the answer email was successfully sent to the user

-- Add email_sent_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'questions' 
    AND column_name = 'email_sent_at'
  ) THEN
    ALTER TABLE questions 
    ADD COLUMN email_sent_at TIMESTAMP WITH TIME ZONE;
    
    -- Add comment
    COMMENT ON COLUMN questions.email_sent_at IS 'Timestamp when the answer email was successfully sent to the user';
    
    RAISE NOTICE 'Column email_sent_at added to questions table';
  ELSE
    RAISE NOTICE 'Column email_sent_at already exists in questions table';
  END IF;
END $$;

-- Update status values: 'pending' -> 'sent' when email_sent_at is set
-- This ensures existing data is consistent
UPDATE questions
SET status = 'sent'
WHERE email_sent_at IS NOT NULL 
  AND status != 'sent';
