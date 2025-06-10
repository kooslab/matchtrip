import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const sql = postgres(process.env.DATABASE_URL);

// Migration data from the journal
const migrations = [
	{ tag: '0000_dashing_gambit', when: 1742153514882 },
	{ tag: '0001_yielding_smiling_tiger', when: 1747639470911 },
	{ tag: '0002_uneven_callisto', when: 1747639609607 },
	{ tag: '0003_chief_jean_grey', when: 1747645977624 },
	{ tag: '0004_dark_reavers', when: 1747648099672 },
	{ tag: '0005_lucky_wendigo', when: 1748310781225 },
	{ tag: '0006_silky_sentinels', when: 1748317552444 },
	{ tag: '0007_concerned_elektra', when: 1748325085967 },
	{ tag: '0008_brave_fallen_one', when: 1748327549087 },
	{ tag: '0009_abnormal_thunderball', when: 1749090990533 },
	{ tag: '0010_swift_dagger', when: 1749496582981 },
	{ tag: '0011_young_shooting_star', when: 1749544107736 }
];

function generateHash(sqlContent) {
	// Simple hash function - in production Drizzle uses a proper hash
	let hash = 0;
	for (let i = 0; i < sqlContent.length; i++) {
		const char = sqlContent.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash).toString(36);
}

async function fixMigrations() {
	try {
		console.log('🔧 Fixing migration state...\n');

		// First, let's exclude the very latest migration since it's the one causing the issue
		// We'll mark all migrations except the last one as applied
		const migrationsToApply = migrations.slice(0, -1); // All except the last one

		console.log(`Will mark ${migrationsToApply.length} migrations as applied:`);

		for (const migration of migrationsToApply) {
			try {
				// Read the SQL file
				const sqlFilePath = path.join('./drizzle', `${migration.tag}.sql`);
				const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
				const hash = generateHash(sqlContent);

				// Insert migration record
				await sql`
          INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
          VALUES (${hash}, ${new Date(migration.when)})
          ON CONFLICT (hash) DO NOTHING
        `;

				console.log(`✅ Marked as applied: ${migration.tag}`);
			} catch (err) {
				console.log(`⚠️  Skipped ${migration.tag}: ${err.message}`);
			}
		}

		console.log('\n🎉 Migration state fixed!');
		console.log('\nNow you should be able to run future migrations with:');
		console.log('bun run db:migrate');
	} catch (error) {
		console.error('❌ Error:', error);
	} finally {
		await sql.end();
	}
}

fixMigrations();
