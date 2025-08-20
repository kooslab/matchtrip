# Email Encryption with Hash-Based Lookups

## Overview

This implementation provides a secure way to encrypt email addresses at rest while maintaining the ability to:
- Perform fast lookups for authentication (OAuth and regular login)
- Search for users by email
- Keep email addresses encrypted in the database

## Architecture

### Dual-Column Approach

The implementation uses two columns in the `users` table:

1. **`email`** - Stores the encrypted email address
2. **`email_hash`** - Stores a SHA-256 hash of the lowercase email (for lookups)

### Why This Works

- **OAuth Login**: OAuth providers (Google, Kakao) provide the email in plaintext during authentication. We hash this email and look up the user by `email_hash`.
- **Search Queries**: Admin searches hash the search term and query the `email_hash` column directly.
- **Email Sending**: When we need to send emails, we decrypt the `email` column.
- **Performance**: Hash lookups are O(1) with proper indexing.

## Implementation Steps

### 1. Database Migration

First, run the migration to add the `email_hash` column:

```bash
# Generate migration
bun run db:generate

# Apply migration to database
bun run db:migrate
```

This adds:
- `email_hash` column (text, unique)
- Index on `email_hash` for fast lookups

### 2. Populate Email Hashes

For existing users, populate the `email_hash` column:

```bash
# Dry run to see what will be updated
bun run scripts/populate-email-hash.ts --dry-run

# Actually populate the hashes
bun run scripts/populate-email-hash.ts
```

### 3. Encrypt Email Addresses

Once all users have email hashes, encrypt the email column:

```bash
# Dry run to see what will be encrypted
bun run scripts/encrypt-emails.ts --dry-run

# Actually encrypt the emails
bun run scripts/encrypt-emails.ts
```

## How It Works

### Authentication Flow

1. **OAuth Login**:
   - User logs in with Google/Kakao
   - OAuth provider returns email in plaintext
   - System hashes the email: `SHA256(email.toLowerCase())`
   - Looks up user by `email_hash`
   - Creates session

2. **New User Registration**:
   - OAuth provides email
   - System stores:
     - `email`: encrypted email
     - `email_hash`: SHA256 hash
   - Both are saved atomically

### Search Operations

```typescript
// Admin searching for a user
const searchEmail = "user@example.com";
const searchHash = hashEmail(searchEmail);

const user = await db.select()
  .from(users)
  .where(eq(users.emailHash, searchHash))
  .limit(1);
```

### Email Operations

```typescript
// When sending emails
const user = await getUser(userId);
const decryptedEmail = decrypt(user.email);
await sendEmail(decryptedEmail, subject, body);
```

## Security Considerations

### Advantages

1. **PII Protection**: Emails are encrypted at rest
2. **No Performance Impact**: Hash lookups are as fast as plaintext
3. **OAuth Compatible**: Works seamlessly with OAuth providers
4. **Reversible**: Can decrypt emails when needed (e.g., sending emails)

### Limitations

1. **No Fuzzy Search**: Can only do exact email matches (no LIKE queries)
2. **Case Sensitivity**: Emails are normalized to lowercase before hashing
3. **Hash Collisions**: Theoretically possible but extremely unlikely with SHA-256

## Files Created

- `/src/lib/server/emailHash.ts` - Hashing utilities
- `/src/lib/server/authAdapter.ts` - Custom auth adapter with hash support
- `/scripts/populate-email-hash.ts` - Script to add hashes to existing users
- `/scripts/encrypt-emails.ts` - Script to encrypt email column
- `/drizzle/0028_*.sql` - Migration to add email_hash column

## Rollback Plan

If you need to rollback:

1. **Decrypt emails** (if you have the encryption key):
   ```typescript
   // Update all users to decrypt emails
   const allUsers = await db.select().from(users);
   for (const user of allUsers) {
     if (isEncrypted(user.email)) {
       await db.update(users)
         .set({ email: decrypt(user.email) })
         .where(eq(users.id, user.id));
     }
   }
   ```

2. **Remove email_hash column** (optional):
   ```sql
   ALTER TABLE users DROP COLUMN email_hash;
   DROP INDEX users_email_hash_idx;
   ```

3. **Revert auth configuration** to use direct email lookups

## Testing

### Test OAuth Login

1. Start the development server: `bun run dev`
2. Try logging in with Google
3. Try logging in with Kakao
4. Verify sessions are created correctly

### Test Admin Search

1. Go to admin panel
2. Search for users by email
3. Verify search returns correct results

### Verify Encryption

```sql
-- Check that emails are encrypted
SELECT id, 
       substring(email, 1, 10) as email_sample,
       substring(email_hash, 1, 10) as hash_sample
FROM users 
LIMIT 5;
```

## Maintenance

### Adding New Users

New users created through OAuth will automatically have:
- Encrypted email
- Email hash
- Proper authentication

### Email Changes

When a user changes their email:
1. Encrypt the new email
2. Generate new email hash
3. Update both columns atomically

### Key Rotation

If you need to rotate encryption keys:
1. Decrypt all emails with old key
2. Re-encrypt with new key
3. Email hashes remain unchanged (no impact on auth)

## Environment Variables

Ensure these are set:

```bash
# Encryption key for email encryption
ENCRYPTION_KEY=your-32-byte-encryption-key

# OAuth credentials (for testing)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
KAKAO_REST_API_KEY=...
KAKAO_CLIENT_SECRET=...
```

## Troubleshooting

### "Email not found" during OAuth login

- Check that email_hash was properly populated
- Verify the email normalization (lowercase)

### Cannot decrypt email

- Ensure ENCRYPTION_KEY hasn't changed
- Check if email was already encrypted

### Search not working

- Verify email_hash index exists
- Check that search queries are hashing the input

## Performance Impact

- **Lookup Performance**: No change (hash index is as fast as email index)
- **Write Performance**: Minimal impact (one extra hash calculation)
- **Storage**: ~64 bytes per user for the hash column

## Compliance

This implementation helps with:
- **GDPR**: Emails are encrypted (data protection)
- **Security Audits**: PII is not stored in plaintext
- **Data Breaches**: Encrypted emails are useless without the key