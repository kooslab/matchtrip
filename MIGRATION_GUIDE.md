# Display ID Migration Guide

This guide explains how to safely migrate the database from `main` branch to `dev` branch, which introduces unique display IDs for products, offers, and payments.

## Overview of Changes

The `dev` branch introduces:
- **Display ID System**: Human-readable unique identifiers (e.g., `PRD-2412-ABC123`)
- **Product Sequences Table**: For generating sequential numbers
- **Additional Tables**: Refund management, webhooks, cancellations
- **New Columns**: Various enhancements to existing tables

## Migration Scripts

### 1. Safe Migration Script (`scripts/safe-migration.ts`)
Main script that handles the entire migration process with safety checks.

**Features:**
- Automatic database backup
- Phased migration approach
- Display ID population
- Verification checks
- NOT NULL constraint application

**Usage:**
```bash
# For development database
bun run scripts/safe-migration.ts

# For production database
bun --env-file=.env.prod run scripts/safe-migration.ts
```

### 2. Verification Script (`scripts/verify-display-ids.ts`)
Checks the status and validity of display IDs in the database.

**Features:**
- Validates display ID format
- Checks for duplicates
- Verifies prefixes
- Reports missing IDs
- Constraint status

**Usage:**
```bash
# For development database
bun run scripts/verify-display-ids.ts

# For production database
bun --env-file=.env.prod run scripts/verify-display-ids.ts
```

### 3. Rollback Script (`scripts/rollback-migration.ts`)
Emergency rollback in case of issues.

**Features:**
- Remove display ID changes only
- Full database restore from backup
- Transaction-safe operations

**Usage:**
```bash
# Interactive mode
bun run scripts/rollback-migration.ts

# Restore from specific backup
bun run scripts/rollback-migration.ts backups/backup_2024-12-20T10-30-00.sql
```

## Step-by-Step Migration Process

### Prerequisites
1. Ensure you have PostgreSQL client tools installed (`pg_dump`, `psql`)
2. Have database credentials ready (`.env` for dev, `.env.prod` for production)
3. Ensure sufficient disk space for backup

### Migration Steps

#### 1. **Switch to dev branch**
```bash
git checkout dev
git pull origin dev
```

#### 2. **Install dependencies**
```bash
bun install
```

#### 3. **Run the safe migration script**
```bash
# For development
bun run scripts/safe-migration.ts

# For production (BE VERY CAREFUL!)
bun --env-file=.env.prod run scripts/safe-migration.ts
```

The script will:
- Create a backup in `./backups/` directory
- Check current migration status
- Apply migrations 0023-0025 (nullable columns)
- Run `populate-display-ids.ts` to fill existing records
- Verify all records have display IDs
- Apply migration 0026 (NOT NULL constraints)

#### 4. **Verify the migration**
```bash
bun run scripts/verify-display-ids.ts
```

Check that:
- All tables have 100% display ID coverage
- No invalid formats
- No duplicates
- Correct prefixes

#### 5. **Deploy application code**
Once database is migrated, deploy the application code that uses display IDs.

## Display ID Format

Display IDs follow this pattern: `PREFIX-YYMM-XXXXXX`

- **PREFIX**: Entity type identifier
  - `PRD` - Products
  - `OFFER` - Trip offers
  - `POFFER` - Product offers
  - `ORD` - Trip orders (payments)
  - `PORD` - Product orders (payments)
- **YYMM**: Year and month (e.g., `2412` for December 2024)
- **XXXXXX**: 6-character random string (uppercase letters and numbers, excluding similar-looking characters)

Example: `PRD-2412-K7N3P9`

## Troubleshooting

### Issue: Migration fails midway

**Solution:**
1. Check error message in console
2. Run verification script to see current state
3. If needed, use rollback script
4. Fix the issue and retry

### Issue: Some records missing display IDs

**Solution:**
1. Run `populate-display-ids.ts` manually:
   ```bash
   bun run scripts/populate-display-ids.ts
   ```
2. Verify again with verification script

### Issue: Duplicate display IDs

**Solution:**
1. This shouldn't happen with proper random generation
2. If it does, manually update duplicates in database
3. Re-run verification

### Issue: Need to rollback everything

**Solution:**
1. Use the rollback script with a backup file:
   ```bash
   bun run scripts/rollback-migration.ts backups/[your-backup-file].sql
   ```

## Important Notes

### For Production Migration

⚠️ **CRITICAL WARNINGS:**
1. **Always test on development first**
2. **Schedule during low-traffic period**
3. **Have a rollback plan ready**
4. **Monitor application logs after migration**
5. **Keep backup for at least 7 days**

### Database URLs

- **Development**: Uses `.env` file (ep-damp-term-a29u8zfr)
- **Production**: Uses `.env.prod` file (ep-frosty-mud-a2r43wg5)

### Migration Files

The following SQL migrations are involved:
- `0023_product_sequences.sql` - Creates sequence table
- `0024_redundant_marauders.sql` - Adds refund/webhook tables
- `0025_funny_loa.sql` - Adds display_id columns (nullable)
- `0026_add_not_null_display_ids.sql` - Makes display_id NOT NULL

## Post-Migration Checklist

- [ ] All display IDs populated
- [ ] Verification script shows no issues
- [ ] Application runs without errors
- [ ] Admin panel shows display IDs correctly
- [ ] Create new records successfully with display IDs
- [ ] Backup file saved securely
- [ ] Document migration completion date

## Support

If you encounter issues:
1. Check this guide first
2. Run verification script for diagnostics
3. Review application logs
4. Contact development team with error details

---

**Last Updated**: December 2024
**Migration Version**: Display ID System v1.0