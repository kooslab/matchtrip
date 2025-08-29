#!/usr/bin/env bun
import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';
import { hashEmail } from '../src/lib/server/emailHash';
import { eq, isNull } from 'drizzle-orm';

/**
 * Script to populate email_hash column for existing users
 * Run with: bun run scripts/populate-email-hash.ts
 */

async function populateEmailHashes() {
	console.log('Starting email hash population...\n');
	console.log('='.repeat(50));

	try {
		// Fetch all users without email_hash
		const usersWithoutHash = await db.select().from(users).where(isNull(users.emailHash));

		console.log(`Found ${usersWithoutHash.length} users without email hash\n`);

		let successCount = 0;
		let errorCount = 0;

		for (const user of usersWithoutHash) {
			try {
				// Generate hash for the email
				const emailHash = hashEmail(user.email);

				// Update user with email hash
				await db.update(users).set({ emailHash }).where(eq(users.id, user.id));

				console.log(`✓ User ${user.id}: Email hash added`);
				successCount++;
			} catch (error) {
				console.error(`✗ User ${user.id}: Failed to add email hash`, error);
				errorCount++;
			}
		}

		console.log('\n' + '='.repeat(50));
		console.log('Email Hash Population Summary:');
		console.log('='.repeat(50));
		console.log(`Total users processed: ${usersWithoutHash.length}`);
		console.log(`Successfully updated: ${successCount}`);
		console.log(`Errors: ${errorCount}`);
		console.log('='.repeat(50) + '\n');

		if (errorCount > 0) {
			console.error('⚠️  Some users failed to update. Check the errors above.');
			process.exit(1);
		} else if (successCount === 0) {
			console.log('ℹ️  All users already have email hashes.');
		} else {
			console.log('✅ Email hash population completed successfully!');
		}
	} catch (error) {
		console.error('Fatal error during email hash population:', error);
		process.exit(1);
	}
}

// Dry run mode to preview what would be updated
async function dryRun() {
	console.log('DRY RUN MODE - No changes will be made\n');
	console.log('='.repeat(50));

	try {
		const usersWithoutHash = await db.select().from(users).where(isNull(users.emailHash));

		const usersWithHash = await db.select().from(users).where(eq(users.emailHash, users.emailHash));

		console.log(`Users without email hash: ${usersWithoutHash.length}`);
		console.log(`Users with email hash: ${usersWithHash.length}`);

		if (usersWithoutHash.length > 0) {
			console.log('\nSample of users that would be updated:');
			usersWithoutHash.slice(0, 5).forEach((user) => {
				console.log(`  - User ${user.id}: ${user.email.substring(0, 3)}***`);
			});
		}

		console.log('\n' + '='.repeat(50));
		console.log('DRY RUN Summary:');
		console.log('='.repeat(50));
		console.log(`Would update: ${usersWithoutHash.length} users`);
		console.log('='.repeat(50) + '\n');
	} catch (error) {
		console.error('Error during dry run:', error);
		process.exit(1);
	}
}

// Main execution
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

if (isDryRun) {
	dryRun();
} else {
	console.log('⚠️  WARNING: This will populate email_hash for all users.');
	console.log('Run with --dry-run flag to preview changes.\n');
	console.log('Starting in 3 seconds... Press Ctrl+C to cancel.\n');

	setTimeout(() => {
		populateEmailHashes();
	}, 3000);
}
