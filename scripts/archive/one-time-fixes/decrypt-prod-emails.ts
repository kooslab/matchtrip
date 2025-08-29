/**
 * Script to decrypt existing encrypted emails in PRODUCTION database
 * Run with: DATABASE_URL="prod_url" bun run scripts/decrypt-prod-emails.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../src/lib/server/db/schema';
import { isEncrypted, decrypt } from '../src/lib/server/encryption';
import { eq } from 'drizzle-orm';

async function decryptProdEmails() {
	// Use production database URL from environment or .env.prod
	const DATABASE_URL =
		process.env.DATABASE_URL ||
		'postgresql://dev_owner:npg_JyqW5RA0ZePO@ep-frosty-mud-a2r43wg5-pooler.eu-central-1.aws.neon.tech/dev?sslmode=require&channel_binding=require';

	console.log('🔓 Decrypting existing encrypted emails in PRODUCTION database...\n');
	console.log('📡 Database URL:', DATABASE_URL.replace(/:[^:@]*@/, ':****@'));

	const client = postgres(DATABASE_URL);
	const db = drizzle(client);

	try {
		// Get all users with encrypted emails
		const allUsers = await db.select().from(users);

		let processedCount = 0;
		let errorCount = 0;

		for (const user of allUsers) {
			if (user.email && isEncrypted(user.email)) {
				try {
					console.log(`🔓 Decrypting email for user ${user.id}...`);
					const decryptedEmail = decrypt(user.email);

					// Update the user with decrypted email
					await db
						.update(users)
						.set({
							email: decryptedEmail,
							updatedAt: new Date()
						})
						.where(eq(users.id, user.id));

					console.log(`  ✅ Successfully decrypted email for user ${user.id}`);
					processedCount++;
				} catch (error) {
					console.log(`  ❌ Failed to decrypt email for user ${user.id}: ${error.message}`);
					console.log(`     Corrupted email: ${user.email}`);
					errorCount++;
				}
			}
		}

		console.log(`\n📊 Summary:`);
		console.log(`  - Total users: ${allUsers.length}`);
		console.log(`  - Successfully decrypted: ${processedCount}`);
		console.log(`  - Errors (corrupted data): ${errorCount}`);

		if (errorCount > 0) {
			console.log(
				`\n⚠️  ${errorCount} users have corrupted encrypted emails that need manual deletion.`
			);
		}

		console.log('\n✨ PRODUCTION email decryption process completed!');
	} catch (error) {
		console.error('Fatal error:', error);
		process.exit(1);
	} finally {
		await client.end();
	}

	process.exit(0);
}

// Run the script
decryptProdEmails();
