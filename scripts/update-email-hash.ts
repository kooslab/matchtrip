import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';
import { eq, isNull } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Script to update null email_hash values in the users table
 * This will generate a hash for each user's email where email_hash is null
 */

async function hashEmail(email: string): Promise<string> {
	// Create a consistent hash of the email for matching
	// Using SHA-256 for consistency
	return crypto
		.createHash('sha256')
		.update(email.toLowerCase().trim())
		.digest('hex');
}

async function updateEmailHashes() {
	console.log('Starting email_hash update process...');
	
	try {
		// Fetch all users with null email_hash
		const usersWithNullHash = await db
			.select({
				id: users.id,
				email: users.email,
				emailHash: users.emailHash
			})
			.from(users)
			.where(isNull(users.emailHash));
		
		console.log(`Found ${usersWithNullHash.length} users with null email_hash`);
		
		if (usersWithNullHash.length === 0) {
			console.log('No users need updating. Exiting.');
			return;
		}
		
		// Check for potential duplicates before updating
		const emailHashMap = new Map<string, string[]>();
		
		for (const user of usersWithNullHash) {
			const hash = await hashEmail(user.email);
			if (!emailHashMap.has(hash)) {
				emailHashMap.set(hash, []);
			}
			emailHashMap.get(hash)!.push(user.email);
		}
		
		// Check for duplicate hashes
		const duplicates = Array.from(emailHashMap.entries()).filter(([_, emails]) => emails.length > 1);
		
		if (duplicates.length > 0) {
			console.warn('⚠️  Warning: Found duplicate email hashes:');
			duplicates.forEach(([hash, emails]) => {
				console.warn(`  Hash ${hash.substring(0, 10)}... is shared by:`);
				emails.forEach(email => console.warn(`    - ${email}`));
			});
			
			console.log('\nDo you want to continue? The unique constraint will prevent duplicates.');
			console.log('Only the first email for each hash will be updated.');
		}
		
		// Update each user's email_hash
		let successCount = 0;
		let errorCount = 0;
		const errors: Array<{email: string, error: string}> = [];
		
		for (const user of usersWithNullHash) {
			try {
				const hash = await hashEmail(user.email);
				
				// Check if this hash already exists in the database
				const existingUser = await db
					.select({ id: users.id })
					.from(users)
					.where(eq(users.emailHash, hash))
					.limit(1);
				
				if (existingUser.length > 0) {
					console.warn(`⚠️  Skipping ${user.email}: hash already exists`);
					errors.push({ email: user.email, error: 'Hash already exists' });
					errorCount++;
					continue;
				}
				
				// Update the user's email_hash
				await db
					.update(users)
					.set({ emailHash: hash })
					.where(eq(users.id, user.id));
				
				successCount++;
				console.log(`✓ Updated email_hash for ${user.email}`);
			} catch (error) {
				errorCount++;
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				errors.push({ email: user.email, error: errorMessage });
				console.error(`✗ Failed to update ${user.email}: ${errorMessage}`);
			}
		}
		
		// Summary
		console.log('\n========================================');
		console.log('Update process completed!');
		console.log(`✓ Successfully updated: ${successCount} users`);
		if (errorCount > 0) {
			console.log(`✗ Failed to update: ${errorCount} users`);
			console.log('\nFailed updates:');
			errors.forEach(({ email, error }) => {
				console.log(`  - ${email}: ${error}`);
			});
		}
		console.log('========================================');
		
	} catch (error) {
		console.error('Fatal error during update process:', error);
		process.exit(1);
	} finally {
		process.exit(0);
	}
}

// Run the update
updateEmailHashes();