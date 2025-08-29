/**
 * Script to check encryption configuration
 * Run with: bun run scripts/check-encryption.ts
 */

import { encrypt, decrypt, isEncrypted } from '../src/lib/server/encryption';

async function checkEncryption() {
	console.log('🔐 Checking Encryption Configuration\n');

	// Check if ENCRYPTION_KEY is set
	const hasKey = !!process.env.ENCRYPTION_KEY;
	console.log(`ENCRYPTION_KEY environment variable: ${hasKey ? '✅ Set' : '❌ Not set'}`);

	if (!hasKey) {
		console.error('\n❌ ENCRYPTION_KEY is not set. Encryption will not work.');
		console.log('Please set the ENCRYPTION_KEY environment variable in your .env file.');
		console.log('You can generate a key with: openssl rand -base64 32');
		process.exit(1);
	}

	// Test encryption
	console.log('\n🧪 Testing encryption...');

	const testCases = [
		'John Doe',
		'test@example.com',
		'카카오유저', // Korean text
		'', // Empty string
		'A very long name that might be used by someone with a really long name in the system'
	];

	let allPassed = true;

	for (const testCase of testCases) {
		console.log(`\nTesting: "${testCase}"`);

		try {
			// Test encryption
			const encrypted = encrypt(testCase);

			if (testCase === '') {
				if (encrypted === null) {
					console.log('  ✅ Empty string returns null (expected behavior)');
					continue;
				} else {
					console.log('  ❌ Empty string should return null');
					allPassed = false;
					continue;
				}
			}

			if (!encrypted) {
				console.log('  ❌ Encryption returned null or undefined');
				allPassed = false;
				continue;
			}

			console.log(`  Encrypted: ${encrypted.substring(0, 50)}...`);

			// Check if it's marked as encrypted
			if (!isEncrypted(encrypted)) {
				console.log('  ❌ Encrypted value not recognized as encrypted');
				allPassed = false;
				continue;
			}

			// Test decryption
			const decrypted = decrypt(encrypted);

			if (decrypted !== testCase) {
				console.log(`  ❌ Decryption failed. Expected: "${testCase}", Got: "${decrypted}"`);
				allPassed = false;
				continue;
			}

			console.log('  ✅ Encryption and decryption successful');
		} catch (error) {
			console.log(`  ❌ Error: ${error}`);
			allPassed = false;
		}
	}

	console.log('\n' + '='.repeat(50));
	if (allPassed) {
		console.log('✅ All encryption tests passed!');
	} else {
		console.log('❌ Some encryption tests failed. Please check your configuration.');
	}
}

// Run the script
checkEncryption();
