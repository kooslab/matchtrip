# Email Hash Usage Examples

## Finding Users by Email

### Before (Direct Email Lookup)

```typescript
// This won't work with encrypted emails
const user = await db.select().from(users).where(eq(users.email, searchEmail)).limit(1);
```

### After (Hash-Based Lookup)

```typescript
import { hashEmail } from '$lib/server/emailHash';
import { eq } from 'drizzle-orm';

// This works with encrypted emails
const searchEmail = 'user@example.com';
const emailHash = hashEmail(searchEmail);

const user = await db.select().from(users).where(eq(users.emailHash, emailHash)).limit(1);
```

## Admin User Search

### Update Admin Search Endpoints

```typescript
// src/routes/admin/users/+page.server.ts
import { hashEmail } from '$lib/server/emailHash';

export const load = async ({ url }) => {
	const searchQuery = url.searchParams.get('search');

	if (searchQuery && searchQuery.includes('@')) {
		// It's an email search
		const emailHash = hashEmail(searchQuery);

		const results = await db.select().from(users).where(eq(users.emailHash, emailHash));

		return { users: results };
	}

	// Handle other search types...
};
```

## Sending Emails

### Decrypt Email When Needed

```typescript
import { decrypt } from '$lib/server/encryption';

async function sendEmailToUser(userId: string, subject: string, body: string) {
	const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

	if (!user[0]) throw new Error('User not found');

	// Decrypt email only when needed
	const decryptedEmail = decrypt(user[0].email);

	// Send email
	await sendEmail({
		to: decryptedEmail,
		subject,
		body
	});
}
```

## Email Verification

### Verify Email Ownership

```typescript
import { hashEmail, verifyEmailHash } from '$lib/server/emailHash';

// When user claims to own an email
async function verifyEmailOwnership(userId: string, claimedEmail: string) {
	const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

	if (!user[0]) return false;

	// Verify the claimed email matches the stored hash
	return verifyEmailHash(claimedEmail, user[0].emailHash);
}
```

## Duplicate Email Check

### Check if Email Already Exists

```typescript
async function isEmailTaken(email: string): Promise<boolean> {
	const emailHash = hashEmail(email);

	const existing = await db.select().from(users).where(eq(users.emailHash, emailHash)).limit(1);

	return existing.length > 0;
}
```

## Profile Update

### Update User Email

```typescript
async function updateUserEmail(userId: string, newEmail: string) {
	// Check if new email is already taken
	if (await isEmailTaken(newEmail)) {
		throw new Error('Email already in use');
	}

	// Encrypt new email and generate hash
	const encryptedEmail = encrypt(newEmail);
	const emailHash = hashEmail(newEmail);

	// Update both columns atomically
	await db
		.update(users)
		.set({
			email: encryptedEmail,
			emailHash: emailHash,
			emailVerified: false // Reset verification
		})
		.where(eq(users.id, userId));
}
```

## API Endpoints

### User Lookup API

```typescript
// src/routes/api/users/by-email/+server.ts
import { hashEmail } from '$lib/server/emailHash';

export const GET = async ({ url }) => {
	const email = url.searchParams.get('email');

	if (!email) {
		return json({ error: 'Email required' }, { status: 400 });
	}

	const emailHash = hashEmail(email);

	const user = await db
		.select({
			id: users.id,
			name: users.name,
			role: users.role
			// Don't return the encrypted email
		})
		.from(users)
		.where(eq(users.emailHash, emailHash))
		.limit(1);

	if (!user[0]) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	return json({ user: user[0] });
};
```

## Migration Guide

### Update Existing Code

1. **Search for email queries**: Find all instances of `users.email` in WHERE clauses
2. **Replace with hash lookups**: Use `hashEmail()` and query `users.emailHash` instead
3. **Update email displays**: Decrypt email before displaying (admin panel only)
4. **Test OAuth login**: Ensure Google and Kakao login still work
5. **Test email sending**: Verify emails are decrypted before sending

### Common Patterns to Update

```typescript
// OLD: Direct email comparison
.where(eq(users.email, someEmail))

// NEW: Hash comparison
.where(eq(users.emailHash, hashEmail(someEmail)))

// OLD: LIKE queries (fuzzy search)
.where(like(users.email, `%${searchTerm}%`))

// NEW: Not supported - must use exact match
// Consider alternative search methods (name, phone, etc.)

// OLD: Display email directly
<td>{user.email}</td>

// NEW: Decrypt before display (admin only)
<td>{decrypt(user.email)}</td>
```

## Security Notes

1. **Never expose encrypted emails** to the client
2. **Decrypt emails server-side only** when absolutely necessary
3. **Email hashes are one-way** - cannot reverse to get email
4. **Keep encryption key secure** - losing it means losing email data
5. **Log email operations** for audit trail

## Performance Considerations

- Hash computation is fast (< 1ms)
- Index on `email_hash` ensures O(1) lookups
- Decryption should be done sparingly
- Batch operations should be paginated
