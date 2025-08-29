# Archive Directory

## ⚠️ WARNING

These scripts are archived for historical reference only. They represent completed operations, fixes that have already been applied, or deprecated approaches.

**DO NOT RUN THESE SCRIPTS** unless you fully understand their purpose and implications. Running them could:

- Corrupt data that has already been fixed
- Revert completed migrations
- Cause data inconsistencies
- Break current functionality

## Directory Structure

### 📁 one-time-fixes/

Contains scripts that fixed specific issues at a point in time. These issues have been resolved and the scripts should never be run again.

Examples:

- Double encryption fixes
- Specific user deletions
- Data corruption repairs
- Email hash migrations

### 📁 migrations-completed/

Contains migration scripts that have already been successfully applied. Re-running these could cause:

- Duplicate data
- Lost data
- Schema conflicts

Examples:

- Image URL migrations
- Storage bucket migrations
- Profile image migrations

### 📁 deprecated/

Contains old approaches or tools that have been replaced with better solutions.

Examples:

- Old test utilities
- Superseded migration approaches
- Legacy SQL scripts

## Why Keep These?

1. **Historical Context**: Understanding what issues occurred and how they were fixed
2. **Audit Trail**: Compliance and debugging reference
3. **Learning**: Examples of past solutions and patterns
4. **Emergency Reference**: In rare cases, understanding old fixes helps with new issues

## If You Need to Reference These

1. **Read the code** carefully to understand what it did
2. **Check the commit history** for when and why it was created
3. **Look for related issues** in project documentation
4. **Never run directly** - adapt the logic if needed for new scripts
5. **Test thoroughly** in development if adapting old code

## Maintenance

- Archive scripts older than 6 months can be moved to cold storage
- Scripts older than 1 year can be deleted if well-documented
- Keep critical migration scripts indefinitely for reference
