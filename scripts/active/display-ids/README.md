# Display ID Management Scripts

## Purpose
These scripts manage the display ID format across the application. Display IDs are human-readable identifiers used for products, orders, offers, and other entities.

## Current Format
- **Products**: `PRD-YYMM-XXXXX` (e.g., PRD-2508-A7B2C)
- **Orders (Offer-based)**: `ORD-YYMM-XXXXX`
- **Orders (Product-based)**: `PORD-YYMM-XXXXX`
- **Offers**: `OFFER-YYMM-XXXXX`
- **Product Offers**: `POFFER-YYMM-XXXXX`

Where:
- `YY` = Year (last 2 digits)
- `MM` = Month (01-12)
- `XXXXX` = 5-character random alphanumeric (excluding confusing characters: 0, O, I, 1, L)

## Scripts

### 🔄 migrate-display-ids-dev.ts
Migrates display IDs from old format to new format in development environment.

**Usage:**
```bash
# Dry run (preview changes)
DRY_RUN=true bun run migrate-display-ids-dev.ts

# Apply migration
bun run migrate-display-ids-dev.ts
```

### 🔄 migrate-display-ids-prod.ts
Production-safe migration with enhanced safety features:
- Requires explicit confirmation
- Creates automatic backups
- Transaction-based updates
- Detailed logging

**Usage:**
```bash
# Dry run (ALWAYS do this first!)
DRY_RUN=true CONFIRM_PRODUCTION=yes bun run migrate-display-ids-prod.ts

# Apply migration with backup
DRY_RUN=false CONFIRM_PRODUCTION=yes CREATE_BACKUP=true bun run migrate-display-ids-prod.ts
```

### ✂️ shorten-display-ids.ts
Shortens display ID suffixes from 6 to 5 characters.

**Usage:**
```bash
# Dry run
DRY_RUN=true CONFIRM=yes bun run shorten-display-ids.ts

# Apply shortening
DRY_RUN=false CONFIRM=yes bun run shorten-display-ids.ts
```

### ↩️ rollback-display-ids.ts
Restores display IDs from backup tables (requires backup was created).

**Usage:**
```bash
# Dry run
DRY_RUN=true CONFIRM_ROLLBACK=yes bun run rollback-display-ids.ts

# Apply rollback
DRY_RUN=false CONFIRM_ROLLBACK=yes bun run rollback-display-ids.ts
```

### ➕ populate-display-ids.ts
Populates missing display IDs for records that don't have them.

**Usage:**
```bash
bun run populate-display-ids.ts
```

### ✅ verify-display-ids.ts
Verifies the current state of display IDs in the database.

**Usage:**
```bash
bun run verify-display-ids.ts
```

## Migration Process

1. **Always backup first** (automatic in prod script)
2. **Run dry run** to preview changes
3. **Review logs** (created in `logs/` directory)
4. **Apply migration** if dry run looks good
5. **Verify** using verify-display-ids.ts
6. **Rollback if needed** using rollback script

## Important Notes

- Display IDs are unique constraints in the database
- Old format used timestamps: `PRODUCT_1755676035754_p2yptgpln`
- New format is more readable and compact
- Migration preserves chronological order when possible