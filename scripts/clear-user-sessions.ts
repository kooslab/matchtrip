/**
 * Script to clear all sessions for users with corrupted encrypted data
 * Run with: bun run scripts/clear-user-sessions.ts
 */

import { db } from '../src/lib/server/db';
import { sessions } from '../src/lib/server/db/schema';
import { isEncrypted, decrypt } from '../src/lib/server/encryption';

async function clearCorruptedUserSessions() {
	console.log('🔍 Finding and clearing sessions with corrupted encrypted data...\n');

	try {
		// Get all sessions
		const allSessions = await db.select().from(sessions);
		
		let totalSessions = allSessions.length;
		let corruptedSessions = 0;
		let deletedSessions = 0;

		console.log(`Checking ${totalSessions} sessions...\n`);

		for (const session of allSessions) {
			let hasCorruptedData = false;

			// Check if the session user data contains corrupted encrypted values
			if (session.userId) {
				// Look for sessions with the specific corrupted email pattern
				const sessionDataStr = JSON.stringify(session);
				
				// Check for the corrupted email pattern from the logs
				if (sessionDataStr.includes('encrypted:jtjrqlhrwmsxnl3aqkyqlg==:9kg/catoadmj3iberx6vfg==:4ssqm9mzsnxocpibhcoir1cbnu1i')) {
					console.log(`Found session with corrupted email data: ${session.id}`);
					hasCorruptedData = true;
				}

				// Check for other malformed encrypted data (wrong format)
				const encryptedMatches = sessionDataStr.match(/encrypted:[^:]+:[^:]+:[^"'\s,}]+/g);
				if (encryptedMatches) {
					for (const match of encryptedMatches) {
						const parts = match.split(':');
						if (parts.length !== 4) {
							console.log(`Malformed encrypted data in session ${session.id}: ${match}`);
							hasCorruptedData = true;
						} else {
							// Try to decrypt to see if it's corrupted
							try {
								decrypt(match);
							} catch (error) {
								console.log(`Cannot decrypt data in session ${session.id}: ${match.substring(0, 50)}...`);
								hasCorruptedData = true;
							}
						}
					}
				}
			}

			if (hasCorruptedData) {
				corruptedSessions++;
				
				// Delete the corrupted session
				await db.delete(sessions).where({ id: session.id } as any);
				deletedSessions++;
				console.log(`✅ Deleted corrupted session: ${session.id}`);
			}
		}

		console.log('\n📊 Summary:');
		console.log(`Total sessions checked: ${totalSessions}`);
		console.log(`Corrupted sessions found: ${corruptedSessions}`);
		console.log(`Sessions deleted: ${deletedSessions}`);

		if (corruptedSessions === 0) {
			console.log('\n✨ No corrupted sessions found!');
		} else {
			console.log('\n✨ All corrupted sessions have been cleared!');
			console.log('Users with cleared sessions will need to log in again.');
		}

	} catch (error) {
		console.error('Fatal error:', error);
		process.exit(1);
	}

	process.exit(0);
}

// Run the script
clearCorruptedUserSessions();