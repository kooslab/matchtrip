#!/usr/bin/env bun

import { config } from 'dotenv';
import { resolve } from 'path';

// Test loading .env.prod
const envPath = resolve(process.cwd(), '.env.prod');
console.log(`Loading environment from: ${envPath}`);
const result = config({ path: envPath, override: true });

if (result.error) {
	console.error('Error loading .env.prod:', result.error);
} else {
	console.log('Successfully loaded .env.prod');
	console.log('DATABASE_URL:', process.env.DATABASE_URL);

	// Check which database it's pointing to
	if (process.env.DATABASE_URL?.includes('frosty-mud')) {
		console.log('✅ Correctly pointing to PRODUCTION (frosty-mud)');
	} else if (process.env.DATABASE_URL?.includes('damp-term')) {
		console.log('❌ ERROR: Pointing to DEV (damp-term) instead of production!');
	} else {
		console.log('⚠️  Unknown database endpoint');
	}
}
