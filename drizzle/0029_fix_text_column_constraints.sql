-- Migration to fix column constraints for encrypted data
-- Ensure email, name, and phone columns are unlimited TEXT type

-- Check current column types and show any constraints
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    character_octet_length
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
    AND column_name IN ('email', 'name', 'phone')
ORDER BY column_name;

-- Explicitly alter columns to ensure they are TEXT (unlimited)
ALTER TABLE "users" ALTER COLUMN "email" TYPE TEXT;
ALTER TABLE "users" ALTER COLUMN "name" TYPE TEXT;
ALTER TABLE "users" ALTER COLUMN "phone" TYPE TEXT;

-- Verify the changes
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    character_octet_length
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
    AND column_name IN ('email', 'name', 'phone')
ORDER BY column_name;