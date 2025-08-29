# Storage Management Scripts

## Purpose

These scripts manage R2/S3 storage operations, including file migrations, orphaned file cleanup, and storage health checks.

## Storage Policy

- **Private Bucket**: ALL user files (profile images, attachments, etc.)
- **Public Access**: Served through `/api/images/` endpoint with authentication
- **No Public Bucket**: Deprecated - never use

## Scripts

### 🚀 migrate-to-private-bucket.ts

Migrates files from public to private bucket.

**Usage:**

```bash
# Dry run
DRY_RUN=true bun run migrate-to-private-bucket.ts

# Apply migration
bun run migrate-to-private-bucket.ts
```

### 📋 list-r2-contents.ts

Lists contents of R2 buckets for inspection.

**Usage:**

```bash
# List private bucket
BUCKET=private bun run list-r2-contents.ts

# List with prefix filter
PREFIX=profile-images/ bun run list-r2-contents.ts
```

### 🔍 check-orphaned-files.ts

Identifies files in storage that aren't referenced in the database.

**What it checks:**

- Files in R2 not linked to any database record
- Database references to non-existent files
- Duplicate file references

**Usage:**

```bash
# Check for orphans
bun run check-orphaned-files.ts

# With cleanup (careful!)
CLEANUP=true bun run check-orphaned-files.ts
```

**Recommended frequency:** Monthly

### 📁 check-uploads.ts

Verifies file upload integrity and references.

**What it checks:**

- Upload records in database
- Corresponding files in R2
- File size and metadata consistency

**Usage:**

```bash
bun run check-uploads.ts
```

### 🆔 check-file-ids.ts

Validates file ID references across tables.

**What it checks:**

- Products.fileIds arrays
- GuideProfiles.fileIds arrays
- Offers.descriptionImages arrays
- Orphaned file IDs

**Usage:**

```bash
bun run check-file-ids.ts
```

## File Organization

### R2 Bucket Structure

```
private-bucket/
├── profile-images/     # User profile pictures
├── guide-profiles/     # Guide verification documents
├── content/           # General content files
├── product-attachments/ # Product related files
└── offer-images/      # Offer description images
```

### File Naming

- Format: `folder/timestamp_userid_originalname.ext`
- Example: `profile-images/1629384756_123e4567_avatar.jpg`

## Common Operations

### Check Storage Health

```bash
# 1. List bucket contents
bun run list-r2-contents.ts

# 2. Check for orphans
bun run check-orphaned-files.ts

# 3. Verify uploads
bun run check-uploads.ts
```

### Clean Orphaned Files

```bash
# 1. Identify orphans (dry run)
bun run check-orphaned-files.ts

# 2. Review the report

# 3. Clean if safe
CLEANUP=true bun run check-orphaned-files.ts
```

## Important Notes

⚠️ **Before Cleanup:**

- Always run checks in read-only mode first
- Review reports carefully
- Keep backups of file lists
- Never delete during peak hours

⚠️ **R2 Costs:**

- Storage: Monitor total size
- Operations: Batch operations when possible
- Bandwidth: Use CDN for frequently accessed files

## Troubleshooting

### Common Issues

1. **"File not found" errors**
   - Run `check-file-ids.ts` to identify broken references
   - Update database records or restore files

2. **Storage quota warnings**
   - Run `check-orphaned-files.ts` to find cleanup candidates
   - Review large files with `list-r2-contents.ts`

3. **Slow file operations**
   - Check R2 rate limits
   - Use batch operations
   - Consider implementing queue system
