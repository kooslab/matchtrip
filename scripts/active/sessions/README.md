# Session Management Scripts

## Purpose
These scripts manage database sessions, particularly cleaning up orphaned sessions that can accumulate over time and impact performance.

## Scripts

### 🧹 clean-orphaned-sessions.ts
Cleans up orphaned sessions in the development database.

**What it does:**
- Removes sessions older than 30 days
- Cleans sessions for non-existent users
- Removes duplicate sessions

**Usage:**
```bash
# Run cleanup
bun run clean-orphaned-sessions.ts
```

**Recommended frequency:** Weekly

### 🧹 clean-prod-orphaned-sessions.ts
Production version of session cleanup with additional safety checks.

**What it does:**
- Same as development version but with:
  - Confirmation prompts
  - Detailed logging
  - Batch processing for safety

**Usage:**
```bash
# Requires explicit confirmation
CONFIRM=yes bun run clean-prod-orphaned-sessions.ts
```

**Recommended frequency:** Monthly

## Session Lifecycle

1. **Creation**: Sessions created on user login
2. **Renewal**: Sessions renewed on activity (15 days before expiry)
3. **Expiry**: Sessions expire after 30 days
4. **Cleanup**: Orphaned sessions should be cleaned regularly

## Impact

### What gets cleaned:
- Expired sessions (>30 days old)
- Sessions for deleted users
- Duplicate sessions (keeps most recent)

### What's preserved:
- Active sessions
- Recent sessions (<30 days)
- Valid user sessions

## Safety Notes

⚠️ **Production Cleanup:**
- Always run during low-traffic periods
- Monitor active user count before/after
- Keep database backup before major cleanup
- Check logs for any errors

## Monitoring

Check session health:
```sql
-- Count total sessions
SELECT COUNT(*) FROM sessions;

-- Count expired sessions
SELECT COUNT(*) FROM sessions 
WHERE expires_at < NOW();

-- Count orphaned sessions
SELECT COUNT(*) FROM sessions s
LEFT JOIN users u ON s.user_id = u.id
WHERE u.id IS NULL;
```