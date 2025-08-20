-- Script to fix database column length constraints for encrypted data
-- Run with: psql [DATABASE_URL] -f scripts/fix-column-lengths.sql

-- Check current column types
\d users

-- Ensure email, name, and phone columns are TEXT (unlimited) not VARCHAR
ALTER TABLE users ALTER COLUMN email TYPE TEXT;
ALTER TABLE users ALTER COLUMN name TYPE TEXT;  
ALTER TABLE users ALTER COLUMN phone TYPE TEXT;

-- Verify the changes
\d users

-- Show any existing truncated encrypted data
SELECT 
    id,
    email,
    name,
    phone,
    LENGTH(email) as email_len,
    LENGTH(name) as name_len,
    LENGTH(phone) as phone_len
FROM users 
WHERE 
    (email LIKE 'encrypted:%' AND LENGTH(email) < 100) OR
    (name LIKE 'encrypted:%' AND LENGTH(name) < 70) OR  
    (phone LIKE 'encrypted:%' AND LENGTH(phone) < 70)
ORDER BY created_at DESC;