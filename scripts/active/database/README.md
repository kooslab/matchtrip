# Database Management Scripts

## Purpose
These scripts handle database maintenance, migrations, backups, and schema management for the MatchTrip application.

## Scripts

### 💾 create-backup.ts
Creates full database backups with timestamps.

**Usage:**
```bash
# Create backup (saves to backups/ directory)
bun run create-backup.ts

# With custom name
BACKUP_NAME=pre-migration bun run create-backup.ts
```

**Output:** `backups/backup_YYYY-MM-DD_HH-MM-SS.sql`

### 🛡️ safe-migration.ts
Applies database migrations with safety checks and rollback capability.

**Features:**
- Pre-migration backup
- Validation checks
- Rollback on failure
- Detailed logging

**Usage:**
```bash
# Apply migrations safely
bun run safe-migration.ts

# Skip backup (not recommended)
SKIP_BACKUP=true bun run safe-migration.ts
```

### 📝 apply-single-migration.ts
Applies a specific migration file.

**Usage:**
```bash
# Apply specific migration
MIGRATION=0024_add_display_ids.sql bun run apply-single-migration.ts
```

### 🔧 fix-migration-history.ts
Repairs migration history inconsistencies.

**What it fixes:**
- Duplicate migration entries
- Missing migration records
- Out-of-order migrations
- Failed migration cleanup

**Usage:**
```bash
# Check and fix migration history
bun run fix-migration-history.ts
```

### ↩️ rollback-migration.ts
Rolls back the last applied migration.

**Usage:**
```bash
# Rollback last migration
CONFIRM=yes bun run rollback-migration.ts

# Rollback specific migration
MIGRATION=0024 CONFIRM=yes bun run rollback-migration.ts
```

### 📏 check-column-lengths.ts
Validates column lengths and data integrity.

**What it checks:**
- Text column max lengths
- Encrypted field sizes
- VARCHAR capacity usage
- Potential truncation risks

**Usage:**
```bash
bun run check-column-lengths.ts
```

### 🔒 fix-column-constraints.ts
Fixes column constraint issues.

**What it fixes:**
- Missing NOT NULL constraints
- Invalid foreign keys
- Incorrect default values
- Index optimization

**Usage:**
```bash
# Dry run
DRY_RUN=true bun run fix-column-constraints.ts

# Apply fixes
bun run fix-column-constraints.ts
```

## Migration Workflow

### Standard Migration Process
```bash
# 1. Create backup
bun run create-backup.ts

# 2. Generate migration
bun run db:generate

# 3. Review migration file
cat drizzle/00XX_migration_name.sql

# 4. Apply migration
bun run safe-migration.ts

# 5. Verify
bun run check-column-lengths.ts
```

### Emergency Rollback
```bash
# 1. Stop application
# 2. Rollback migration
CONFIRM=yes bun run rollback-migration.ts

# 3. Or restore from backup
psql $DATABASE_URL < backups/backup_YYYY-MM-DD.sql
```

## Database Schema

### Key Tables
- `users` - User accounts (encrypted PII)
- `sessions` - Authentication sessions
- `products` - Guide products
- `offers` - Trip offers
- `payments` - Payment records
- `trips` - Traveler trip requests

### Migrations Directory
```
drizzle/
├── 0001_initial_schema.sql
├── 0002_add_encryption.sql
├── ...
└── meta/
    └── _journal.json
```

## Best Practices

### Before Migrations
1. **Always backup** production database
2. **Test in development** first
3. **Review migration** SQL carefully
4. **Check for locks** on production
5. **Schedule during** low traffic

### After Migrations
1. **Verify schema** matches expectations
2. **Test critical** operations
3. **Monitor performance** for changes
4. **Keep backup** for 7 days minimum

## Monitoring

### Health Checks
```sql
-- Check migration status
SELECT * FROM drizzle_migrations 
ORDER BY created_at DESC LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT count(*) FROM pg_stat_activity;
```

## Troubleshooting

### Common Issues

1. **"Migration already applied"**
   - Check `drizzle_migrations` table
   - Run `fix-migration-history.ts`

2. **"Column too small for encrypted data"**
   - Run `check-column-lengths.ts`
   - Increase column size in schema

3. **"Foreign key violation"**
   - Check referenced records exist
   - Fix orphaned records first

4. **"Lock timeout"**
   - Check active queries
   - Retry during low traffic

## Important Notes

⚠️ **Production Operations:**
- Always backup before schema changes
- Test migrations in staging first
- Monitor application logs during migration
- Have rollback plan ready
- Document all changes