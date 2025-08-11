import 'dotenv/config';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME; // Private bucket
const R2_PUBLIC_BUCKET_NAME = process.env.R2_PUBLIC_BUCKET_NAME; // Public bucket (if exists)

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

async function listBucketContents(bucketName: string, bucketType: string) {
	if (!r2Client) return;
	
	console.log(`\n${'='.repeat(60)}`);
	console.log(`📦 ${bucketType} BUCKET: ${bucketName}`);
	console.log('='.repeat(60));
	
	try {
		let continuationToken: string | undefined;
		let totalFiles = 0;
		const folderCounts: Record<string, number> = {};
		const fileSizes: Record<string, number> = {};
		
		do {
			const command = new ListObjectsV2Command({
				Bucket: bucketName,
				ContinuationToken: continuationToken,
				MaxKeys: 1000
			});
			
			const response = await r2Client.send(command);
			
			if (response.Contents) {
				for (const object of response.Contents) {
					if (object.Key) {
						totalFiles++;
						
						// Extract folder from key
						const folder = object.Key.includes('/') 
							? object.Key.split('/')[0] 
							: 'root';
						
						folderCounts[folder] = (folderCounts[folder] || 0) + 1;
						fileSizes[folder] = (fileSizes[folder] || 0) + (object.Size || 0);
						
						// Show first few files as examples
						if (totalFiles <= 5) {
							console.log(`  📄 ${object.Key} (${formatSize(object.Size || 0)})`);
						}
					}
				}
			}
			
			continuationToken = response.NextContinuationToken;
		} while (continuationToken);
		
		if (totalFiles > 5) {
			console.log(`  ... and ${totalFiles - 5} more files`);
		}
		
		console.log(`\n📊 Summary by folder:`);
		for (const [folder, count] of Object.entries(folderCounts)) {
			const size = fileSizes[folder];
			console.log(`  📁 ${folder}/: ${count} files (${formatSize(size)})`);
		}
		
		console.log(`\n✅ Total: ${totalFiles} files`);
		
		return { totalFiles, folderCounts };
	} catch (error: any) {
		if (error.name === 'NoSuchBucket') {
			console.log('❌ Bucket does not exist');
		} else if (error.$metadata?.httpStatusCode === 403) {
			console.log('❌ Access denied to bucket');
		} else {
			console.error('❌ Error listing bucket:', error.message);
		}
		return { totalFiles: 0, folderCounts: {} };
	}
}

function formatSize(bytes: number): string {
	if (bytes < 1024) return bytes + ' B';
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
	if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

async function main() {
	console.log('🔍 R2 Bucket Contents Inspector');
	console.log('================================\n');
	
	console.log('Configuration:');
	console.log(`  Account ID: ${R2_ACCOUNT_ID}`);
	console.log(`  Private Bucket: ${R2_BUCKET_NAME || 'NOT CONFIGURED'}`);
	console.log(`  Public Bucket: ${R2_PUBLIC_BUCKET_NAME || 'NOT CONFIGURED'}`);
	
	// List private bucket
	if (R2_BUCKET_NAME) {
		const privateStats = await listBucketContents(R2_BUCKET_NAME, 'PRIVATE');
		
		// Check for specific folder patterns
		if (privateStats.folderCounts['content']) {
			console.log('\n✅ Found "content" folder in private bucket');
		}
		if (privateStats.folderCounts['product_attachment']) {
			console.log('✅ Found "product_attachment" folder in private bucket');
		}
	}
	
	// List public bucket if it exists
	if (R2_PUBLIC_BUCKET_NAME) {
		const publicStats = await listBucketContents(R2_PUBLIC_BUCKET_NAME, 'PUBLIC');
		
		// Check for files that should be migrated
		if (publicStats.totalFiles > 0) {
			console.log('\n⚠️  PUBLIC BUCKET HAS FILES - Consider migrating to private bucket');
		}
	}
	
	console.log('\n' + '='.repeat(60));
	console.log('📌 RECOMMENDATIONS:');
	console.log('='.repeat(60));
	console.log('1. All product images should be in PRIVATE bucket');
	console.log('2. Files should maintain their folder structure (content/, etc.)');
	console.log('3. Database URLs should use /api/images/ format');
	console.log('4. Public bucket can be emptied after migration');
	
	process.exit(0);
}

main().catch(console.error);