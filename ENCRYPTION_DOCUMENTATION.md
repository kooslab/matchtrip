# MatchTrip Platform Encryption Documentation

## ⚠️ CRITICAL: This standard MUST be followed by ALL applications in the MatchTrip ecosystem

This document consolidates all encryption-related documentation for the MatchTrip platform, including:
- Main MatchTrip application
- Admin MatchTrip application  
- Any future applications that access the shared database
- All scripts and utilities

## 🔐 Core Encryption Standard

### Algorithm: AES-256-GCM
- **Algorithm**: `aes-256-gcm`
- **Key Size**: 32 bytes (256 bits)
- **IV Length**: 16 bytes
- **Auth Tag Length**: 16 bytes
- **Encoding**: Base64 for all components

### Encryption Key
- **Storage**: Environment variable `ENCRYPTION_KEY`
- **Format**: Base64-encoded 32-byte key
- **Generation**: 
  ```bash
  # Generate a secure 32-byte key and encode as base64
  openssl rand -base64 32
  ```

### Encrypted Data Format
```
encrypted:<iv_base64>:<auth_tag_base64>:<encrypted_data_base64>
```

**Components**:
1. **Prefix**: Always `encrypted:` (lowercase, with colon)
2. **IV**: Initialization Vector encoded as base64
3. **Auth Tag**: Authentication tag encoded as base64
4. **Encrypted Data**: The encrypted content encoded as base64
5. **Separator**: Colon `:` between each component

**Example**:
```
encrypted:Rb3Xz2K4H6M8P0Q2S4U6V8==:A1B2C3D4E5F6G7H8I9J0K1L2==:M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8==
```

## 🔒 Implementation

### Standard Encryption Functions

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const ENCRYPTED_PREFIX = 'encrypted:';

// Key validation
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    
    const keyBuffer = Buffer.from(key, 'base64');
    
    if (keyBuffer.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (256 bits)');
    }
    
    return keyBuffer;
}

// Encryption
export function encrypt(plainText: string | null | undefined): string | null {
    if (!plainText) return plainText as any;
    
    try {
        const key = getEncryptionKey();
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv(ALGORITHM, key, iv);
        
        const encrypted = Buffer.concat([
            cipher.update(plainText, 'utf8'),
            cipher.final()
        ]);
        
        const authTag = cipher.getAuthTag();
        
        // CRITICAL: Always use this exact format
        return `${ENCRYPTED_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

// Decryption
export function decrypt(encryptedData: string | null | undefined): string | null {
    if (!encryptedData) return encryptedData as any;
    
    // Check if data is encrypted
    if (!encryptedData.startsWith(ENCRYPTED_PREFIX)) {
        // Return as-is if not encrypted (for migration compatibility)
        return encryptedData;
    }
    
    try {
        // Remove prefix and split parts
        const withoutPrefix = encryptedData.slice(ENCRYPTED_PREFIX.length);
        const parts = withoutPrefix.split(':');
        
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }
        
        const [ivBase64, authTagBase64, encryptedBase64] = parts;
        
        const key = getEncryptionKey();
        const iv = Buffer.from(ivBase64, 'base64');
        const authTag = Buffer.from(authTagBase64, 'base64');
        const encrypted = Buffer.from(encryptedBase64, 'base64');
        
        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
        
        return decrypted.toString('utf8');
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

// Detection functions
export function isEncrypted(value: string | null | undefined): boolean {
    if (!value) return false;
    return value.startsWith(ENCRYPTED_PREFIX);
}

export function isLegacyEncrypted(value: string | null | undefined): boolean {
    if (!value) return false;
    // Add any legacy prefixes here for detection only
    return value.startsWith('ENC:') || value.startsWith('enc:');
}
```

### Implementation Locations
- **Main App**: `/matchtrip/src/lib/server/encryption.ts`
- **Admin App**: `/admin-matchtrip/src/lib/server/encryption.ts`
- **Core Logic**: Both apps use identical `encryption-core.ts` files
- **Scripts**: Must import from the main app encryption module

## 📧 Email Encryption with Hash-Based Lookups

### Overview
Emails are encrypted at rest while maintaining fast lookup capabilities for authentication and search operations using a dual-column approach.

### Database Schema
The `users` table contains:
1. **`email`** - Stores the encrypted email address
2. **`email_hash`** - Stores a SHA-256 hash of the lowercase email (for lookups)

### Why This Works
- **OAuth Login**: OAuth providers provide plaintext email → hash it → lookup by `email_hash`
- **Search Queries**: Hash search terms and query the `email_hash` column
- **Email Sending**: Decrypt the `email` column when needed
- **Performance**: Hash lookups are O(1) with proper indexing

### Email Hash Implementation

```typescript
import { createHash } from 'crypto';

// Hash email for lookups
export function hashEmail(email: string): string {
    return createHash('sha256')
        .update(email.toLowerCase().trim())
        .digest('hex');
}

// Verify email against hash
export function verifyEmailHash(email: string, hash: string): boolean {
    return hashEmail(email) === hash;
}
```

### Common Email Operations

#### Finding Users by Email
```typescript
import { hashEmail } from '$lib/server/emailHash';

// Hash-based lookup (works with encrypted emails)
const searchEmail = "user@example.com";
const emailHash = hashEmail(searchEmail);

const user = await db.select()
    .from(users)
    .where(eq(users.emailHash, emailHash))
    .limit(1);
```

#### Sending Emails
```typescript
async function sendEmailToUser(userId: string, subject: string, body: string) {
    const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
    
    if (!user[0]) throw new Error('User not found');
    
    // Decrypt email only when needed
    const decryptedEmail = decrypt(user[0].email);
    
    await sendEmail({
        to: decryptedEmail,
        subject,
        body
    });
}
```

#### Updating User Email
```typescript
async function updateUserEmail(userId: string, newEmail: string) {
    // Check if new email is already taken
    const emailHash = hashEmail(newEmail);
    const existing = await db.select()
        .from(users)
        .where(eq(users.emailHash, emailHash))
        .limit(1);
    
    if (existing.length > 0) {
        throw new Error('Email already in use');
    }
    
    // Encrypt new email and generate hash
    const encryptedEmail = encrypt(newEmail);
    
    // Update both columns atomically
    await db.update(users)
        .set({
            email: encryptedEmail,
            emailHash: emailHash,
            emailVerified: false
        })
        .where(eq(users.id, userId));
}
```

## 🚫 Prohibited Practices

### NEVER DO:
1. **NEVER use different encryption prefixes** (e.g., `ENC:`, `enc:`, `ENCRYPTED:`)
2. **NEVER use different encoding** (always use base64, never hex or URL-safe base64)
3. **NEVER change the separator** (always use `:`)
4. **NEVER use different algorithms** (always AES-256-GCM)
5. **NEVER store keys in code** (always use environment variables)
6. **NEVER use different IV or auth tag lengths**
7. **NEVER implement custom encryption** - use the standard functions
8. **NEVER expose encrypted emails** to the client
9. **NEVER support multiple encryption methods**

## ✅ Required Practices

### ALWAYS:
1. **Use the exact same encryption module** across all apps
2. **Test encryption/decryption compatibility** between apps
3. **Validate the encryption key** is 32 bytes
4. **Use cryptographically secure random** for IV generation
5. **Include the auth tag** for GCM mode
6. **Handle null/undefined** values gracefully
7. **Log errors** but never log sensitive data
8. **Decrypt emails server-side only** when absolutely necessary
9. **Keep both apps' core modules identical**

## 📋 Implementation Checklist

Before deploying any encryption changes:

- [ ] Encryption key is exactly 32 bytes when decoded from base64
- [ ] Using `encrypted:` prefix (lowercase with colon)
- [ ] Using base64 encoding for IV, auth tag, and encrypted data
- [ ] Using colons `:` as separators
- [ ] Using AES-256-GCM algorithm
- [ ] Auth tag is included and verified
- [ ] Null/undefined values are handled
- [ ] Tested encryption in one app can be decrypted in another
- [ ] No hardcoded keys in source code
- [ ] Error handling doesn't expose sensitive information
- [ ] Email hashes are properly generated for lookups
- [ ] OAuth login flows work with encrypted emails

## 🔍 Testing

### Compatibility Test Script
```typescript
// test-encryption-compatibility.ts
import { encrypt, decrypt } from './encryption';

const testData = 'Hello, World!';
const encrypted = encrypt(testData);
console.log('Encrypted:', encrypted);

const decrypted = decrypt(encrypted);
console.log('Decrypted:', decrypted);

// Test the exact format
const formatRegex = /^encrypted:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/;
if (!formatRegex.test(encrypted)) {
    throw new Error('Encrypted format does not match standard!');
}

if (decrypted !== testData) {
    throw new Error('Decryption failed!');
}

console.log('✅ Encryption standard validated');
```

### Test OAuth Login
1. Start the development server: `bun run dev`
2. Try logging in with Google
3. Try logging in with Kakao
4. Verify sessions are created correctly

### Verify Database Encryption
```sql
-- Check that emails are encrypted
SELECT id, 
       substring(email, 1, 10) as email_sample,
       substring(email_hash, 1, 10) as hash_sample
FROM users 
LIMIT 5;
```

## 🔄 Migration & Recovery

### Migration Guidelines

#### For Legacy Data (e.g., `ENC:` prefix):
1. **DO NOT** try to support multiple encryption methods
2. **DO** create a migration script to re-encrypt with the standard
3. **DO** notify users if their data needs to be reset
4. **DO** use the `reset-double-encrypted-names.ts` script as a reference

#### Populate Email Hashes for Existing Users:
```bash
# Dry run to see what will be updated
bun run scripts/populate-email-hash.ts --dry-run

# Actually populate the hashes
bun run scripts/populate-email-hash.ts
```

#### Encrypt Email Addresses:
```bash
# Dry run to see what will be encrypted
bun run scripts/encrypt-emails.ts --dry-run

# Actually encrypt the emails
bun run scripts/encrypt-emails.ts
```

### Emergency Procedures

#### If Double Encryption Occurs:
1. **STOP** all encryption operations immediately
2. **CHECK** both apps are using identical encryption modules
3. **RUN** detection scripts to identify affected records
4. **USE** `reset-double-encrypted-names.ts` pattern to fix
5. **DOCUMENT** the root cause and update this standard

#### Key Rotation:
1. Decrypt all data with old key
2. Re-encrypt with new key
3. Email hashes remain unchanged (no impact on auth)

## 🛡️ Security Considerations

### Advantages
1. **PII Protection**: All sensitive data encrypted at rest
2. **No Performance Impact**: Hash lookups as fast as plaintext
3. **OAuth Compatible**: Works seamlessly with OAuth providers
4. **Reversible**: Can decrypt when needed (e.g., sending emails)
5. **Audit Trail**: All encryption operations logged

### Limitations
1. **No Fuzzy Search**: Can only do exact email matches (no LIKE queries)
2. **Case Sensitivity**: Emails normalized to lowercase before hashing
3. **Key Management**: Losing encryption key means losing data

### Compliance
This implementation helps with:
- **GDPR**: PII encrypted (data protection)
- **Security Audits**: No plaintext PII storage
- **Data Breaches**: Encrypted data useless without key

## 📅 Version History

### v2.0.0 (2024-12-23): Consolidated Documentation
- Merged all encryption-related documentation
- Includes email encryption with hash-based lookups
- Complete implementation guide

### v1.0.0 (2024-12-23): Initial Standard
- Established after fixing double encryption issue
- Standardized on `encrypted:` prefix with base64 encoding
- AES-256-GCM with 32-byte keys

## ✅ Implementation Status

### Successfully Implemented:
- Consistent encryption across all applications
- Email encryption with hash-based lookups
- Resolution of double encryption issues
- Cross-app compatibility validated

### Migration Complete:
- All legacy encrypted data migrated
- Email hashes populated for all users
- Consistent `encrypted:` prefix format
- OAuth authentication working with encrypted emails

---

**Remember**: Consistency is critical. One small deviation in encryption implementation can corrupt user data and require complex recovery procedures. Always follow this standard exactly.