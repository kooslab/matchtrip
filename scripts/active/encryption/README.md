# Encryption Management Scripts

## Purpose

These scripts manage data encryption for sensitive user information, ensuring PII (Personally Identifiable Information) is properly protected.

## Encryption Standard

- **Algorithm**: AES-256-GCM
- **Key Management**: Environment variable `ENCRYPTION_KEY`
- **Fields Encrypted**:
  - `users.name` - User names
  - `users.phone` - Phone numbers
  - `users.email` - NOT encrypted (used for authentication)

## Scripts

### 🔐 encrypt-existing-data.ts

Encrypts unencrypted sensitive data in the database.

**What it does:**

- Identifies unencrypted PII fields
- Applies encryption using standard format
- Validates encryption success
- Creates backup before operation

**Usage:**

```bash
# Dry run (check what needs encryption)
DRY_RUN=true bun run encrypt-existing-data.ts

# Apply encryption
bun run encrypt-existing-data.ts
```

### ✅ test-encryption-consistency.ts

Tests encryption/decryption consistency across the application.

**What it tests:**

- Encryption key validity
- Encrypt/decrypt round-trip
- Cross-table consistency
- Special character handling

**Usage:**

```bash
# Run all tests
bun run test-encryption-consistency.ts

# Test specific table
TABLE=users bun run test-encryption-consistency.ts
```

**Recommended frequency:** After any encryption-related changes

### 🔍 check-encryption.ts

Audits current encryption status of sensitive fields.

**What it checks:**

- Encrypted vs unencrypted records
- Malformed encrypted data
- Encryption coverage percentage
- Double-encryption detection

**Usage:**

```bash
# Full encryption audit
bun run check-encryption.ts

# Check specific table
TABLE=users bun run check-encryption.ts
```

**Output:**

```
Encryption Status Report:
- Users table: 95% encrypted (950/1000)
- Unencrypted records: 50
- Malformed: 0
- Double-encrypted: 0
```

## Encryption Format

### Encrypted Data Structure

```
encrypted:base64(iv):base64(authTag):base64(encryptedData)
```

Example:

```
encrypted:aBcD123...:xYz456...:QwErTy789...
```

### Detection Patterns

- **Encrypted**: Starts with `encrypted:`
- **Unencrypted**: Plain text without prefix
- **Double-encrypted**: Contains nested `encrypted:` prefixes

## Common Operations

### Initial Encryption Setup

```bash
# 1. Check current status
bun run check-encryption.ts

# 2. Encrypt unencrypted data
DRY_RUN=true bun run encrypt-existing-data.ts
bun run encrypt-existing-data.ts

# 3. Verify encryption
bun run test-encryption-consistency.ts
```

### Regular Maintenance

```bash
# Weekly: Check encryption health
bun run check-encryption.ts

# After deployments: Test consistency
bun run test-encryption-consistency.ts
```

### Troubleshooting Encryption Issues

```bash
# 1. Identify problematic records
bun run check-encryption.ts

# 2. Test specific records
RECORD_ID=xxx bun run test-encryption-consistency.ts

# 3. Re-encrypt if needed
bun run encrypt-existing-data.ts
```

## Key Management

### Environment Variable

```bash
# .env file
ENCRYPTION_KEY=your-256-bit-key-here
```

### Key Requirements

- **Length**: 32 bytes (256 bits)
- **Format**: Hex string (64 characters)
- **Storage**: Never commit to repository
- **Rotation**: Plan and test key rotation carefully

### Key Generation

```bash
# Generate new key
openssl rand -hex 32
```

## Security Best Practices

1. **Never log** encrypted or decrypted PII
2. **Always backup** before encryption operations
3. **Test encryption** in development first
4. **Monitor for** unencrypted data regularly
5. **Rotate keys** according to security policy
6. **Audit access** to encryption scripts

## Migration Between Keys

### Key Rotation Process

1. Keep old key available
2. Add new key to environment
3. Decrypt with old key
4. Encrypt with new key
5. Verify all records
6. Remove old key

## Important Notes

⚠️ **Critical Warnings:**

- Never run encryption scripts without backup
- Test key availability before operations
- Monitor for double-encryption
- Keep encryption key secure
- Document all encryption changes

⚠️ **Performance Impact:**

- Encryption adds ~10-20ms per operation
- Bulk operations should be batched
- Index encrypted fields carefully

## Compliance Notes

### PII Fields Requiring Encryption

- Full names
- Phone numbers
- Addresses (if collected)
- Government IDs (if collected)
- Payment details (handled by payment provider)

### Fields NOT Encrypted

- Email addresses (needed for login)
- User IDs
- Timestamps
- Non-PII metadata
