# Display ID Migration Scripts

## Overview

These scripts migrate display IDs from the old format to the new format across all relevant tables.

### Old Formats
- `PRODUCT_1755676035754_p2yptgpln` (timestamp-based)
- `ORDER_1755748358423_mxo1i5jmd` (timestamp-based)

### New Formats
- **Products**: `PRD-YYMM-XXXXX` (e.g., `PRD-2508-YAA8R`)
- **Offers**: `OFFER-YYMM-XXXXX` (e.g., `OFFER-2508-NSVAT`)
- **Orders (Offer-based)**: `ORD-YYMM-XXXXX` (e.g., `ORD-2508-CN447`)
- **Orders (Product-based)**: `PORD-YYMM-XXXXX` (e.g., `PORD-2508-XM2VP`)
- **Product Offers**: `POFFER-YYMM-XXXXX` (e.g., `POFFER-2508-58KE7`)

## Scripts

### 1. `migrate-display-ids-dev.ts` - Development Migration

Use this for development/staging environments.

```bash
# Dry run (preview changes without modifying database)
DRY_RUN=true bun run scripts/migrate-display-ids-dev.ts

# Actual migration
bun run scripts/migrate-display-ids-dev.ts
```

### 2. `migrate-display-ids-prod.ts` - Production Migration

Use this for production environment with enhanced safety features.

**Features:**
- Requires explicit confirmation
- Creates backup tables automatically
- Transaction-based updates
- Detailed logging to file
- Validation of all new IDs

```bash
# Dry run (STRONGLY RECOMMENDED first)
DRY_RUN=true CONFIRM_PRODUCTION=yes bun run scripts/migrate-display-ids-prod.ts

# Actual production migration (after reviewing dry run)
DRY_RUN=false CONFIRM_PRODUCTION=yes CREATE_BACKUP=true bun run scripts/migrate-display-ids-prod.ts

# Skip backup creation (NOT RECOMMENDED)
DRY_RUN=false CONFIRM_PRODUCTION=yes CREATE_BACKUP=false bun run scripts/migrate-display-ids-prod.ts
```

**Log files** are created in the `logs/` directory with timestamp.

### 3. `rollback-display-ids.ts` - Rollback Script

Use this to restore old display IDs from backup tables (only works if backup was created).

```bash
# Dry run (check what would be restored)
DRY_RUN=true CONFIRM_ROLLBACK=yes bun run scripts/rollback-display-ids.ts

# Actual rollback
DRY_RUN=false CONFIRM_ROLLBACK=yes bun run scripts/rollback-display-ids.ts
```

## Migration Process

### Recommended Steps for Production:

1. **Test in Development First**
   ```bash
   # On development environment
   DRY_RUN=true bun run scripts/migrate-display-ids-dev.ts
   bun run scripts/migrate-display-ids-dev.ts
   ```

2. **Backup Production Database**
   - Create a full database backup before migration
   - The script also creates table-specific backups

3. **Run Dry Run on Production**
   ```bash
   DRY_RUN=true CONFIRM_PRODUCTION=yes bun run scripts/migrate-display-ids-prod.ts
   ```
   - Review the log file in `logs/` directory
   - Verify the migration plan looks correct

4. **Perform Production Migration**
   ```bash
   DRY_RUN=false CONFIRM_PRODUCTION=yes CREATE_BACKUP=true bun run scripts/migrate-display-ids-prod.ts
   ```
   - Monitor the progress
   - Check the log file for any errors

5. **Verify Migration**
   - Check a few records in each table
   - Ensure application works correctly with new IDs

6. **If Rollback Needed**
   ```bash
   DRY_RUN=false CONFIRM_ROLLBACK=yes bun run scripts/rollback-display-ids.ts
   ```

## Important Notes

### Affected Tables
- `products` - Product display IDs
- `offers` - Offer display IDs  
- `payments` - Order/Payment display IDs
- `product_offers` - Product offer display IDs

### Backup Tables
When `CREATE_BACKUP=true`, the following backup tables are created:
- `products_display_id_backup`
- `offers_display_id_backup`
- `payments_display_id_backup`
- `product_offers_display_id_backup`

These contain: `id`, `display_id`, `backup_date`

### ID Generation Logic
- Uses the timestamp from old IDs when available (preserves chronological order)
- Falls back to `created_at` field if timestamp extraction fails
- Generates 5-character alphanumeric suffix using safe alphabet (excludes confusing characters like 0, O, I, 1, L)

### Safety Features in Production Script
1. **Explicit Confirmation Required**: Must set `CONFIRM_PRODUCTION=yes`
2. **Default Dry Run**: Defaults to dry run unless explicitly set to false
3. **Automatic Backups**: Creates backup tables before migration
4. **Transaction-based Updates**: Uses database transactions for consistency
5. **Duplicate Prevention**: Ensures all new IDs are unique
6. **Validation**: Validates format of all new IDs before applying
7. **Detailed Logging**: Creates timestamped log files
8. **10-second Countdown**: Gives time to cancel before starting

## Troubleshooting

### Common Issues

1. **Duplicate Key Error**
   - The script generates unique IDs and checks for duplicates
   - If this occurs, check if manual IDs were added

2. **Permission Denied**
   - Ensure database user has CREATE TABLE permissions (for backups)
   - Ensure write permissions for logs directory

3. **Migration Partially Completed**
   - Check log files for specific errors
   - Can safely re-run migration (it only migrates records needing update)
   - Or use rollback script to restore original IDs

4. **Rollback Fails**
   - Ensure backup tables exist
   - Check if backup tables have been dropped or modified

## Environment Variables

- `DRY_RUN` - Set to `true` for preview, `false` for actual migration
- `CONFIRM_PRODUCTION` - Must be `yes` for production script to run
- `CREATE_BACKUP` - Set to `false` to skip backup creation (not recommended)
- `CONFIRM_ROLLBACK` - Must be `yes` for rollback script to run

## Support

If you encounter issues:
1. Check the log files in `logs/` directory
2. Verify database connectivity
3. Ensure all environment variables are set correctly
4. Review dry run output before actual migration