# Encryption Standard for MatchTrip Platform

## ⚠️ CRITICAL: This standard MUST be followed by ALL applications in the MatchTrip ecosystem

This document defines the encryption standard that MUST be consistently used across:
- Main MatchTrip application
- Admin MatchTrip application  
- Any future applications that access the shared database
- All scripts and utilities

## 🔐 Encryption Algorithm

### Standard: AES-256-GCM
- **Algorithm**: `aes-256-gcm`
- **Key Size**: 32 bytes (256 bits)
- **IV Length**: 16 bytes
- **Auth Tag Length**: 16 bytes
- **Encoding**: Base64 for all components

## 🔑 Encryption Key

### Key Format
- **Storage**: Environment variable `ENCRYPTION_KEY`
- **Format**: Base64-encoded 32-byte key
- **Generation**: Use a cryptographically secure random generator

### Key Generation Example
```bash
# Generate a secure 32-byte key and encode as base64
openssl rand -base64 32
```

### Key Validation
```typescript
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
```

## 📦 Encrypted Data Format

### Format Structure
```
encrypted:<iv_base64>:<auth_tag_base64>:<encrypted_data_base64>
```

### Components
1. **Prefix**: Always `encrypted:` (lowercase, with colon)
2. **IV**: Initialization Vector encoded as base64
3. **Auth Tag**: Authentication tag encoded as base64
4. **Encrypted Data**: The encrypted content encoded as base64
5. **Separator**: Colon `:` between each component

### Example
```
encrypted:Rb3Xz2K4H6M8P0Q2S4U6V8==:A1B2C3D4E5F6G7H8I9J0K1L2==:M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8==
```

## 🔒 Encryption Implementation

### Standard Encryption Function
```typescript
import { createCipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const ENCRYPTED_PREFIX = 'encrypted:';

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
```

### Standard Decryption Function
```typescript
import { createDecipheriv } from 'crypto';

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

## ✅ Required Practices

### ALWAYS:
1. **Use the exact same encryption module** across all apps
2. **Test encryption/decryption compatibility** between apps
3. **Validate the encryption key** is 32 bytes
4. **Use cryptographically secure random** for IV generation
5. **Include the auth tag** for GCM mode
6. **Handle null/undefined** values gracefully
7. **Log errors** but never log sensitive data

## 🔄 Migration Guidelines

### Handling Legacy Data
If you encounter data with old encryption formats (e.g., `ENC:` prefix):
1. **DO NOT** try to support multiple encryption methods
2. **DO** create a migration script to re-encrypt with the standard
3. **DO** notify users if their data needs to be reset
4. **DO** use the `reset-double-encrypted-names.ts` script as a reference

### Detection Function
```typescript
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

## 📋 Checklist for Implementation

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

## 🔍 Testing Compatibility

### Test Script
Create a test to ensure compatibility:

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

## 📝 Implementation Files

### Current Implementation Locations
- **Main App**: `/matchtrip/src/lib/server/encryption.ts`
- **Admin App**: `/admin-matchtrip/src/lib/server/encryption.ts`
- **Scripts**: Must import from the main app encryption module

### Required Updates
Both files MUST be kept in sync. Consider using a shared package or copying the exact implementation.

## ⚠️ Emergency Procedures

### If Double Encryption Occurs Again:
1. **STOP** all encryption operations immediately
2. **CHECK** both apps are using identical encryption modules
3. **RUN** detection scripts to identify affected records
4. **USE** `reset-double-encrypted-names.ts` pattern to fix
5. **DOCUMENT** the root cause and update this standard

## 📅 Version History

- **v1.0.0** (2024-12-23): Initial standard definition
  - Established after fixing double encryption issue
  - Standardized on `encrypted:` prefix with base64 encoding
  - AES-256-GCM with 32-byte keys

---

**Remember**: Consistency is critical. One small deviation in encryption implementation can corrupt user data and require complex recovery procedures.