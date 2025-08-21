# Scripts Directory Guide

## Overview
This directory contains maintenance and utility scripts for the MatchTrip application. Scripts are organized by their purpose and current status.

## Directory Structure

### 📂 Active Scripts
Currently used scripts for regular maintenance and operations.

- **`active/display-ids/`** - Display ID format management (PRD-YYMM-XXXXX)
- **`active/sessions/`** - Database session cleanup utilities
- **`active/storage/`** - R2/S3 storage and file operations
- **`active/database/`** - Database maintenance and migration tools
- **`active/encryption/`** - Data encryption management

### 📦 Archive
Historical scripts kept for reference. 
⚠️ **WARNING**: DO NOT RUN these scripts unless you fully understand their purpose and implications!

- **`archive/one-time-fixes/`** - Completed one-time operations
- **`archive/migrations-completed/`** - Finished data migrations
- **`archive/deprecated/`** - Old approaches no longer in use

## Quick Reference Guide

### Regular Maintenance Schedule

| Frequency | Task | Script Location |
|-----------|------|-----------------|
| Weekly | Clean orphaned sessions | `active/sessions/clean-orphaned-sessions.ts` |
| Monthly | Check for orphaned files | `active/storage/check-orphaned-files.ts` |
| As needed | Database backup | `active/database/create-backup.ts` |
| As needed | Display ID migration | `active/display-ids/migrate-display-ids-*.ts` |

### Common Operations

#### 🔄 Display ID Management
```bash
# Check current display ID format
bun run scripts/active/display-ids/verify-display-ids.ts

# Migrate to new format (dev)
DRY_RUN=true bun run scripts/active/display-ids/migrate-display-ids-dev.ts
```

#### 🧹 Session Cleanup
```bash
# Clean development sessions
bun run scripts/active/sessions/clean-orphaned-sessions.ts

# Clean production sessions (use with caution)
bun run scripts/active/sessions/clean-prod-orphaned-sessions.ts
```

#### 💾 Database Operations
```bash
# Create backup
bun run scripts/active/database/create-backup.ts

# Apply single migration
bun run scripts/active/database/apply-single-migration.ts
```

## Important Notes

1. **Always run with DRY_RUN=true first** for any migration or cleanup script
2. **Production scripts** require explicit confirmation flags
3. **Backup before major operations** using the backup script
4. **Check logs** - Many scripts create detailed logs in the `logs/` directory
5. **Never run archived scripts** without understanding their historical context

## Environment Variables

Most scripts respect these environment variables:
- `DRY_RUN=true` - Preview changes without applying them
- `CONFIRM_PRODUCTION=yes` - Required for production operations
- `CREATE_BACKUP=true` - Create backups before operations

## Support

For questions about specific scripts, check the README in each subdirectory or refer to the inline documentation in the script files.