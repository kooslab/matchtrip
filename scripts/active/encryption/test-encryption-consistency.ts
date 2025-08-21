#!/usr/bin/env bun
/**
 * Test Encryption Consistency
 * 
 * This script validates that encryption is consistent across both apps
 * and follows the encryption standard.
 */

import { config } from 'dotenv';
import { encrypt, decrypt, isEncrypted, validateEncryptedFormat, isLegacyEncrypted } from '../src/lib/server/encryption';

// Load environment variables
config();

console.log('🔐 Testing Encryption Consistency\n');
console.log('='.repeat(50));

// Test data
const testCases = [
	'Hello, World!',
	'김철수',
	'user@example.com',
	'+82-10-1234-5678',
	'Special chars: !@#$%^&*()',
	'Multi\nline\ntext',
	'Unicode: 😀 🎉 ♥️',
	''
];

let allPassed = true;

for (const testData of testCases) {
	console.log(`\nTesting: "${testData || '(empty string)'}"`);
	console.log('-'.repeat(30));
	
	try {
		// Test encryption
		const encrypted = encrypt(testData);
		
		if (testData && !encrypted) {
			console.error('❌ Encryption returned null for non-empty string');
			allPassed = false;
			continue;
		}
		
		if (!testData && encrypted !== null) {
			console.error('❌ Encryption should return null for empty string');
			allPassed = false;
			continue;
		}
		
		if (testData) {
			console.log(`Encrypted: ${encrypted?.substring(0, 50)}...`);
			
			// Validate format
			if (!validateEncryptedFormat(encrypted!)) {
				console.error('❌ Encrypted format does not match standard!');
				allPassed = false;
				continue;
			}
			
			// Check prefix
			if (!encrypted!.startsWith('encrypted:')) {
				console.error('❌ Missing or incorrect prefix');
				allPassed = false;
				continue;
			}
			
			// Check structure
			const parts = encrypted!.slice('encrypted:'.length).split(':');
			if (parts.length !== 3) {
				console.error(`❌ Expected 3 parts, got ${parts.length}`);
				allPassed = false;
				continue;
			}
			
			// Check base64 encoding
			const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
			for (let i = 0; i < parts.length; i++) {
				if (!base64Regex.test(parts[i])) {
					console.error(`❌ Part ${i + 1} is not valid base64: ${parts[i]}`);
					allPassed = false;
					continue;
				}
			}
			
			// Test decryption
			const decrypted = decrypt(encrypted);
			
			if (decrypted !== testData) {
				console.error(`❌ Decryption failed!`);
				console.error(`   Expected: "${testData}"`);
				console.error(`   Got: "${decrypted}"`);
				allPassed = false;
				continue;
			}
			
			// Test isEncrypted
			if (!isEncrypted(encrypted)) {
				console.error('❌ isEncrypted() returned false for encrypted data');
				allPassed = false;
				continue;
			}
			
			console.log('✅ Encryption/Decryption successful');
		} else {
			console.log('✅ Empty string handled correctly');
		}
		
	} catch (error) {
		console.error(`❌ Error: ${error}`);
		allPassed = false;
	}
}

// Test null/undefined handling
console.log('\n' + '='.repeat(50));
console.log('Testing null/undefined handling:');
console.log('-'.repeat(30));

const nullResult = encrypt(null);
const undefinedResult = encrypt(undefined);

if (nullResult !== null) {
	console.error('❌ encrypt(null) should return null');
	allPassed = false;
} else {
	console.log('✅ null handled correctly');
}

if (undefinedResult !== undefined) {
	console.error('❌ encrypt(undefined) should return undefined');
	allPassed = false;
} else {
	console.log('✅ undefined handled correctly');
}

// Test legacy detection
console.log('\n' + '='.repeat(50));
console.log('Testing legacy encryption detection:');
console.log('-'.repeat(30));

const legacyFormats = [
	'ENC:abc:def:ghi',
	'enc:abc:def:ghi',
	'ENCRYPTED:abc:def:ghi'
];

for (const legacy of legacyFormats) {
	if (!isLegacyEncrypted(legacy)) {
		console.error(`❌ isLegacyEncrypted() should detect legacy format: ${legacy}`);
		allPassed = false;
	} else {
		console.log(`✅ Detected legacy format: ${legacy.split(':')[0]}:`);
	}
}

// Final result
console.log('\n' + '='.repeat(50));
if (allPassed) {
	console.log('✅ All encryption tests passed!');
	console.log('📋 Encryption follows the standard correctly.');
} else {
	console.log('❌ Some tests failed!');
	console.log('⚠️  Please fix the issues to ensure consistency.');
	process.exit(1);
}

// Instructions for cross-app testing
console.log('\n' + '='.repeat(50));
console.log('📝 Cross-App Testing Instructions:');
console.log('='.repeat(50));
console.log('1. Run this script in the main app');
console.log('2. Copy one of the encrypted values above');
console.log('3. Create a test script in admin app that decrypts it');
console.log('4. Verify the decrypted value matches the original');
console.log('\nExample encrypted value to test:');
const crossAppTest = encrypt('Cross-app test 123');
console.log(crossAppTest);
console.log('\nThis should decrypt to: "Cross-app test 123"');