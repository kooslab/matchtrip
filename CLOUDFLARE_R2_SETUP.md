# Cloudflare R2 Storage Setup Guide

This guide will help you set up Cloudflare R2 storage for handling file uploads in your MatchTrip application.

## Why Cloudflare R2?

- **Cost-effective**: $0.015/GB/month (much cheaper than AWS S3)
- **No egress fees**: Free data transfer out
- **S3-compatible API**: Easy to integrate
- **Global performance**: Cloudflare's global network
- **Generous free tier**: 10GB storage, 1 million Class A operations, 10 million Class B operations per month

## Setup Steps

### 1. Create Cloudflare Account and R2 Buckets

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 Object Storage
3. Create two buckets:
   - **Private bucket**: `matchtrip-uploads` (for sensitive files like ID documents)
   - **Public bucket**: `matchtrip-public` (for public images like destinations)
4. Note your Account ID from the R2 dashboard

### 2. Create API Token

1. Go to "Manage R2 API Tokens"
2. Create a new API token with:
   - **Permissions**: Object Read & Write
   - **Buckets**: Select both `matchtrip-uploads` and `matchtrip-public`
3. Save the Access Key ID and Secret Access Key

### 3. Configure Public Bucket Access

1. Go to your `matchtrip-public` bucket settings
2. Click on "Settings" tab
3. Under "Public access", click "Allow public access"
4. Add the following CORS policy:

```json
[
	{
		"AllowedOrigins": ["*"],
		"AllowedMethods": ["GET"],
		"AllowedHeaders": ["*"],
		"MaxAgeSeconds": 3600
	}
]
```

### 4. Configure Environment Variables

Add these to your `.env` file:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-account-id-here
R2_ACCESS_KEY_ID=your-access-key-id-here
R2_SECRET_ACCESS_KEY=your-secret-access-key-here
R2_BUCKET_NAME=matchtrip-uploads
R2_PUBLIC_BUCKET_NAME=matchtrip-public
R2_PUBLIC_URL=https://pub-your-account-id.r2.dev
# Or use custom domain: https://cdn.matchtrip.net
```

### 4. Install Required Dependencies

```bash
bun add @aws-sdk/client-s3
```

### 5. Update Upload API

Uncomment and configure the R2 client in `src/routes/api/upload/+server.ts`:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const r2Client = new S3Client({
	region: 'auto',
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID,
		secretAccessKey: R2_SECRET_ACCESS_KEY
	}
});
```

Then uncomment the upload logic in the POST handler.

### 6. Set Up Public Bucket Access

For the `matchtrip-public` bucket:

1. Go to Cloudflare Dashboard > R2 > `matchtrip-public`
2. Click on "Settings" tab
3. Under "R2.dev subdomain", enable "Allow public access"
4. Your public URL will be: `https://pub-[your-account-id].r2.dev`

### 7. Set Up Custom Domain (Optional but Recommended)

1. In your R2 bucket settings, go to "Custom Domains"
2. Add your domain (e.g., `cdn.matchtrip.net`)
3. Configure DNS records as instructed
4. Update `R2_PUBLIC_URL` to use your custom domain

### 7. Configure Bucket Policies (Optional)

For public read access to uploaded files, you can set bucket policies:

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "PublicReadGetObject",
			"Effect": "Allow",
			"Principal": "*",
			"Action": "s3:GetObject",
			"Resource": "arn:aws:s3:::matchtrip-uploads/*"
		}
	]
}
```

## File Organization

The upload API organizes files by type and bucket:

**Private Bucket (`matchtrip-uploads`)**:

- `profile/` - Profile images
- `id/` - ID documents and passports
- `certification/` - Guide certifications

**Public Bucket (`matchtrip-public`)**:

- `destination/` - Destination images for landing page display

## Security Considerations

1. **File validation**: The API validates file types and sizes
2. **Unique filenames**: Files are renamed with timestamps and random strings
3. **Access control**: Consider implementing signed URLs for sensitive documents
4. **CORS**: Configure CORS settings if needed for direct browser uploads

## Alternative Storage Options

If you prefer other storage solutions:

### Supabase Storage

- Good for smaller projects
- Integrated with Supabase ecosystem
- $0.021/GB/month

### UploadThing

- Developer-friendly
- Built for modern web frameworks
- Pricing based on usage

### AWS S3

- Most mature option
- Higher costs ($0.023/GB/month + egress fees)
- Extensive ecosystem

## Migration from Mock Storage

Once R2 is configured:

1. Update the upload API to use real R2 uploads
2. Test file uploads in development
3. Update any hardcoded mock URLs
4. Deploy and test in production

## Troubleshooting

### Common Issues

1. **CORS errors**: Configure CORS in R2 bucket settings
2. **Access denied**: Check API token permissions
3. **File not found**: Verify bucket name and file paths
4. **Large file uploads**: Consider implementing multipart uploads for files > 100MB

### Debug Tips

- Check Cloudflare R2 logs in the dashboard
- Verify environment variables are loaded correctly
- Test API endpoints with tools like Postman
- Monitor upload success/failure rates

## Cost Estimation

For a typical travel platform:

- **Storage**: ~$1.50/month for 100GB
- **Operations**: Usually within free tier
- **Bandwidth**: Free with R2
- **Total**: ~$1.50-5/month for most use cases

This is significantly cheaper than AWS S3 which would cost ~$25-30/month for the same usage.
