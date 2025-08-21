#!/usr/bin/env bun
/**
 * Migration script to encrypt existing user data in the database
 * This script will encrypt name and phone fields for all users
 * Note: emails are kept as plaintext for authentication
 */

import { config } from 'dotenv';
import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, isEncrypted } from '../src/lib/server/encryption';

// Load environment variables
config();

// Verify encryption key is set
if (!process.env.ENCRYPTION_KEY) {
	console.error('❌ ENCRYPTION_KEY environment variable is not set');
	console.error('Generate a key with: openssl rand -base64 32');
	process.exit(1);
}

interface MigrationStats {
	total: number;
	encrypted: number;
	skipped: number;
	failed: number;
	errors: Array<{ userId: string; error: string }>;
}

async function migrateUsers(): Promise<MigrationStats> {
	const stats: MigrationStats = {
		total: 0,
		encrypted: 0,
		skipped: 0,
		failed: 0,
		errors: []
	};

	const batchSize = 100;
	let offset = 0;
	let hasMore = true;

	console.log('🔐 Starting user data encryption migration...');
	console.log('⚠️  This process will encrypt user names and phone numbers');
	console.log('📝 Note: Emails will remain plaintext for authentication');
	console.log('');

	while (hasMore) {
		try {
			// Fetch batch of users
			const userBatch = await db
				.select({
					id: users.id,
					name: users.name,
					email: users.email,
					phone: users.phone
				})
				.from(users)
				.limit(batchSize)
				.offset(offset);

			if (userBatch.length === 0) {
				hasMore = false;
				break;
			}

			console.log(
				`\n📦 Processing batch ${Math.floor(offset / batchSize) + 1} (${userBatch.length} users)...`
			);

			for (const user of userBatch) {
				stats.total++;

				try {
					// Check if already encrypted
					if (isEncrypted(user.name) && (!user.phone || isEncrypted(user.phone))) {
						console.log(`⏭️  User ${user.id}: Already encrypted, skipping`);
						stats.skipped++;
						continue;
					}

					// Prepare encrypted data
					const updates: Record<string, any> = {};
					let needsUpdate = false;

					// Encrypt name if not already encrypted
					if (user.name && !isEncrypted(user.name)) {
						updates.name = encrypt(user.name);
						needsUpdate = true;
					}

					// Note: We no longer encrypt emails - they remain plaintext for authentication

					// Encrypt phone if exists and not already encrypted
					if (user.phone && !isEncrypted(user.phone)) {
						updates.phone = encrypt(user.phone);
						needsUpdate = true;
					}

					// Update user if needed
					if (needsUpdate) {
						await db.update(users).set(updates).where(eq(users.id, user.id));

						console.log(`✅ User ${user.id}: Encrypted successfully`);
						stats.encrypted++;
					} else {
						console.log(`⏭️  User ${user.id}: No encryption needed`);
						stats.skipped++;
					}
				} catch (error) {
					console.error(`❌ User ${user.id}: Failed to encrypt`, error);
					stats.failed++;
					stats.errors.push({
						userId: user.id,
						error: error instanceof Error ? error.message : String(error)
					});
				}
			}

			offset += batchSize;

			// Progress update
			console.log(`\n📊 Progress: ${stats.total} users processed`);
			console.log(`   - Encrypted: ${stats.encrypted}`);
			console.log(`   - Skipped: ${stats.skipped}`);
			console.log(`   - Failed: ${stats.failed}`);
		} catch (error) {
			console.error('\n❌ Batch processing error:', error);
			hasMore = false;
		}
	}

	return stats;
}

// Verification function to check if migration was successful
async function verifyMigration(): Promise<void> {
	console.log('\n🔍 Verifying migration...');

	// Check a sample of users
	const sampleUsers = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			phone: users.phone,
			emailHash: users.emailHash
		})
		.from(users)
		.limit(10);

	let allEncrypted = true;
	let allHaveHashes = true;

	for (const user of sampleUsers) {
		if (user.name && !isEncrypted(user.name)) {
			console.log(`⚠️  User ${user.id}: name is not encrypted`);
			allEncrypted = false;
		}
		if (user.email && !isEncrypted(user.email)) {
			console.log(`⚠️  User ${user.id}: email is not encrypted`);
			allEncrypted = false;
		}
		if (user.phone && !isEncrypted(user.phone)) {
			console.log(`⚠️  User ${user.id}: phone is not encrypted`);
			allEncrypted = false;
		}
		if (user.email && !user.emailHash) {
			console.log(`⚠️  User ${user.id}: missing email hash`);
			allHaveHashes = false;
		}
	}

	if (allEncrypted && allHaveHashes) {
		console.log(
			'✅ Sample verification passed: All checked users have encrypted data and email hashes'
		);
	} else {
		console.log('⚠️  Sample verification found issues - please review above warnings');
	}
}

// Main execution
async function main() {
	console.log('========================================');
	console.log('   User Data Encryption Migration');
	console.log('========================================');
	console.log('');

	// Prompt for confirmation in production
	if (process.env.NODE_ENV === 'production') {
		console.log('⚠️  WARNING: Running in PRODUCTION mode');
		console.log('This will modify production data. Are you sure you want to continue?');
		console.log('Press Ctrl+C to abort, or wait 10 seconds to continue...');
		await new Promise((resolve) => setTimeout(resolve, 10000));
	}

	try {
		// Run migration
		const stats = await migrateUsers();

		// Print final statistics
		console.log('\n========================================');
		console.log('   Migration Complete');
		console.log('========================================');
		console.log(`📊 Final Statistics:`);
		console.log(`   - Total users processed: ${stats.total}`);
		console.log(`   - Successfully encrypted: ${stats.encrypted}`);
		console.log(`   - Already encrypted (skipped): ${stats.skipped}`);
		console.log(`   - Failed: ${stats.failed}`);

		if (stats.errors.length > 0) {
			console.log('\n❌ Errors encountered:');
			for (const error of stats.errors) {
				console.log(`   - User ${error.userId}: ${error.error}`);
			}
		}

		// Run verification
		await verifyMigration();

		// Exit with appropriate code
		if (stats.failed > 0) {
			console.log('\n⚠️  Migration completed with errors. Please review failed users.');
			process.exit(1);
		} else {
			console.log('\n✅ Migration completed successfully!');
			process.exit(0);
		}
	} catch (error) {
		console.error('\n❌ Migration failed:', error);
		process.exit(1);
	}
}

// Run the migration
main().catch(console.error);
