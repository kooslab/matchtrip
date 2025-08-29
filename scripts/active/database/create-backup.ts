#!/usr/bin/env bun
/**
 * Create Database Backup
 * Simple script to create a backup of the database
 *
 * Usage:
 * - For dev: bun run scripts/create-backup.ts
 * - For prod: bun --env-file=.env.prod run scripts/create-backup.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Colors for output
const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	cyan: '\x1b[36m'
};

async function createBackup() {
	const dbUrl = process.env.DATABASE_URL;

	if (!dbUrl) {
		console.error(`${colors.red}❌ DATABASE_URL not found in environment variables${colors.reset}`);
		process.exit(1);
	}

	// Determine environment from database URL
	const isProduction = dbUrl.includes('ep-frosty-mud');
	const environment = isProduction ? 'PRODUCTION' : 'DEVELOPMENT';

	// Create timestamp for backup filename
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_');
	const backupDir = path.join(process.cwd(), 'backups');

	// Create backups directory if it doesn't exist
	if (!fs.existsSync(backupDir)) {
		fs.mkdirSync(backupDir, { recursive: true });
		console.log(`${colors.cyan}📁 Created backups directory${colors.reset}`);
	}

	const backupFile = path.join(backupDir, `${environment.toLowerCase()}_backup_${timestamp}.sql`);

	console.log(`${colors.yellow}📦 Creating ${environment} database backup...${colors.reset}`);
	console.log(`${colors.cyan}📍 Database: ${dbUrl.split('@')[1]?.split('/')[0]}${colors.reset}`);
	console.log(`${colors.cyan}📁 Backup file: ${backupFile}${colors.reset}`);
	console.log('');

	try {
		console.log('⏳ This may take a minute...');

		// Run pg_dump
		await execAsync(`pg_dump "${dbUrl}" > "${backupFile}"`);

		// Check if file was created and get its size
		const stats = fs.statSync(backupFile);
		const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

		console.log('');
		console.log(`${colors.green}✅ Backup created successfully!${colors.reset}`);
		console.log(`${colors.cyan}📊 Size: ${sizeMB} MB${colors.reset}`);
		console.log(`${colors.cyan}📍 Location: ${backupFile}${colors.reset}`);
		console.log('');

		// Quick verification - check if backup contains expected content
		const { stdout } = await execAsync(`head -20 "${backupFile}"`);
		if (stdout.includes('PostgreSQL database dump')) {
			console.log(
				`${colors.green}✅ Backup file verified - contains PostgreSQL dump${colors.reset}`
			);
		}

		// Count tables in backup
		const { stdout: tableCount } = await execAsync(
			`grep -c "CREATE TABLE" "${backupFile}" || true`
		);
		if (tableCount) {
			console.log(`${colors.cyan}📊 Tables found in backup: ${tableCount.trim()}${colors.reset}`);
		}

		console.log('');
		console.log(`${colors.green}🎉 Backup completed successfully!${colors.reset}`);
		console.log(
			`${colors.yellow}⚠️  Keep this backup safe: ${path.basename(backupFile)}${colors.reset}`
		);
	} catch (error) {
		console.error(`${colors.red}❌ Backup failed!${colors.reset}`);
		console.error(error);

		// Check if pg_dump is installed
		try {
			await execAsync('which pg_dump');
		} catch {
			console.error(
				`${colors.red}❌ pg_dump not found. Please install PostgreSQL client tools:${colors.reset}`
			);
			console.error(`${colors.cyan}   For macOS: brew install postgresql${colors.reset}`);
			console.error(
				`${colors.cyan}   For Ubuntu: sudo apt-get install postgresql-client${colors.reset}`
			);
		}

		process.exit(1);
	}
}

// Run the backup
createBackup().catch(console.error);
