-- Migration to remove displayId column after consolidating with orderId
-- First ensure all orderId values match displayId values (run migrate-displayid-to-orderid.ts first)

-- Drop the index on displayId
DROP INDEX IF EXISTS "payments_display_id_idx";

-- Drop the displayId column
ALTER TABLE "payments" DROP COLUMN IF EXISTS "display_id";

-- Note: The orderId column already has a unique constraint and index, so no need to add them