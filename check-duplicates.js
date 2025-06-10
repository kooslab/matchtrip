import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function checkDuplicates() {
	try {
		console.log('🔍 Checking for duplicate cities in destinations table...\n');

		const duplicates = await sql`
      SELECT city, country, COUNT(*) as count
      FROM destinations 
      GROUP BY city, country
      HAVING COUNT(*) > 1
      ORDER BY count DESC, city;
    `;

		if (duplicates.length === 0) {
			console.log('✅ No duplicate cities found!');
			return;
		}

		console.log(`❌ Found ${duplicates.length} sets of duplicate cities:`);
		duplicates.forEach((dup) => {
			console.log(`  - "${dup.city}" in ${dup.country}: ${dup.count} entries`);
		});

		console.log('\nDetailed view of duplicates:');
		for (const dup of duplicates) {
			const entries = await sql`
        SELECT id, city, country, created_at 
        FROM destinations 
        WHERE city = ${dup.city} AND country = ${dup.country}
        ORDER BY created_at;
      `;

			console.log(`\n"${dup.city}" in ${dup.country}:`);
			entries.forEach((entry, i) => {
				console.log(`  ${i + 1}. ID: ${entry.id}, Created: ${entry.created_at}`);
			});
		}
	} catch (error) {
		console.error('❌ Error:', error);
	} finally {
		await sql.end();
	}
}

checkDuplicates();
