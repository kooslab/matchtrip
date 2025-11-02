-- Migration: Create user_deletions table for tracking account deletions
-- This table logs all user account deletions with original data for admin analytics

DO $$
BEGIN
    -- Create user_deletions table
    CREATE TABLE IF NOT EXISTS user_deletions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        original_email TEXT NOT NULL,
        original_name TEXT,
        original_phone TEXT,
        user_role TEXT,
        reason TEXT,
        details TEXT,
        deleted_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    -- Create indexes for efficient querying
    CREATE INDEX IF NOT EXISTS idx_user_deletions_deleted_at ON user_deletions(deleted_at DESC);
    CREATE INDEX IF NOT EXISTS idx_user_deletions_user_id ON user_deletions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_deletions_user_role ON user_deletions(user_role);

    RAISE NOTICE 'user_deletions table created successfully';

EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE 'user_deletions table already exists, skipping';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating user_deletions table: %', SQLERRM;
END $$;
