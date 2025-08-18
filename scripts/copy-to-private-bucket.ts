import 'dotenv/config';
import {
	S3Client,
	ListObjectsV2Command,
	CopyObjectCommand,
	HeadObjectCommand,
	DeleteObjectCommand
} from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME; // Private bucket
const R2_PUBLIC_BUCKET_NAME = process.env.R2_PUBLIC_BUCKET_NAME; // Public bucket

// Parse command line arguments
const args = process.argv.slice(2);
const shouldDelete = args.includes('--delete-after-copy');
const dryRun = args.includes('--dry-run');

if (dryRun) {
	console.log('🔍 DRY RUN MODE - No files will be copied or deleted\n');
}

// Initialize R2 client
let r2Client: S3Client | null = null;

if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
	r2Client = new S3Client({
		region: 'auto',
		endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY
		},
		forcePathStyle: true
	});
	console.log('✓ R2 client initialized');
} else {
	console.error('✗ R2 credentials not found in environment');
	process.exit(1);
}

async function fileExistsInBucket(bucket: string, key: string): Promise<boolean> {
	if (!r2Client) return false;

	try {
		await r2Client.send(
			new HeadObjectCommand({
				Bucket: bucket,
				Key: key
			})
		);
		return true;
	} catch (error) {
		return false;
	}
}

async function copyFilesToPrivateBucket() {
	if (!r2Client) {
		console.error('R2 client not initialized');
		return;
	}

	if (!R2_PUBLIC_BUCKET_NAME) {
		console.log('ℹ️  No public bucket configured. Nothing to copy.');
		return;
	}

	if (!R2_BUCKET_NAME) {
		console.error('❌ Private bucket (R2_BUCKET_NAME) not configured');
		return;
	}

	console.log(
		`\n📦 Copying files from PUBLIC (${R2_PUBLIC_BUCKET_NAME}) to PRIVATE (${R2_BUCKET_NAME})\n`
	);

	const stats = {
		total: 0,
		copied: 0,
		skipped: 0,
		deleted: 0,
		errors: 0
	};

	try {
		let continuationToken: string | undefined;

		do {
			// List objects in public bucket
			const listCommand = new ListObjectsV2Command({
				Bucket: R2_PUBLIC_BUCKET_NAME,
				ContinuationToken: continuationToken,
				MaxKeys: 100
			});

			const response = await r2Client.send(listCommand);

			if (response.Contents) {
				for (const object of response.Contents) {
					if (!object.Key) continue;

					stats.total++;
					console.log(`\n[${stats.total}] Processing: ${object.Key}`);

					try {
						// Check if file already exists in private bucket
						const existsInPrivate = await fileExistsInBucket(R2_BUCKET_NAME, object.Key);

						if (existsInPrivate) {
							console.log(`  ⚠️  Already exists in private bucket - skipping`);
							stats.skipped++;
							continue;
						}

						if (!dryRun) {
							// Copy to private bucket
							console.log(`  📋 Copying to private bucket...`);
							await r2Client.send(
								new CopyObjectCommand({
									Bucket: R2_BUCKET_NAME,
									Key: object.Key,
									CopySource: `${R2_PUBLIC_BUCKET_NAME}/${object.Key}`
								})
							);
							console.log(`  ✅ Copied successfully`);
							stats.copied++;

							// Delete from public bucket if requested
							if (shouldDelete) {
								console.log(`  🗑️  Deleting from public bucket...`);
								await r2Client.send(
									new DeleteObjectCommand({
										Bucket: R2_PUBLIC_BUCKET_NAME,
										Key: object.Key
									})
								);
								console.log(`  ✅ Deleted from public bucket`);
								stats.deleted++;
							}
						} else {
							console.log(`  [DRY RUN] Would copy to private bucket`);
							if (shouldDelete) {
								console.log(`  [DRY RUN] Would delete from public bucket`);
							}
							stats.copied++;
						}
					} catch (error: any) {
						console.error(`  ❌ Error: ${error.message}`);
						stats.errors++;
					}
				}
			}

			continuationToken = response.NextContinuationToken;
		} while (continuationToken);
	} catch (error: any) {
		console.error('❌ Error listing public bucket:', error.message);
	}

	// Print summary
	console.log('\n' + '='.repeat(60));
	console.log('📊 MIGRATION SUMMARY');
	console.log('='.repeat(60));
	console.log(`📁 Total files found: ${stats.total}`);
	console.log(`✅ Files copied: ${stats.copied}`);
	console.log(`⚠️  Files skipped (already exist): ${stats.skipped}`);
	if (shouldDelete) {
		console.log(`🗑️  Files deleted from public: ${stats.deleted}`);
	}
	console.log(`❌ Errors: ${stats.errors}`);

	if (dryRun) {
		console.log('\n🔍 This was a DRY RUN - no files were actually copied or deleted');
		console.log('Run without --dry-run to perform the actual migration');
	}

	if (!shouldDelete && stats.copied > 0 && !dryRun) {
		console.log(
			'\n💡 TIP: Run with --delete-after-copy to remove files from public bucket after copying'
		);
	}
}

async function main() {
	console.log('🚀 R2 Bucket Migration Tool');
	console.log('===========================\n');

	console.log('Options:');
	console.log(`  --dry-run: ${dryRun ? '✅ Enabled' : '❌ Disabled'}`);
	console.log(`  --delete-after-copy: ${shouldDelete ? '✅ Enabled' : '❌ Disabled'}`);

	await copyFilesToPrivateBucket();

	process.exit(0);
}

main().catch(console.error);
