# MatchTrip Storage Guide - Cloudflare R2

## 📋 Table of Contents

1. [Overview](#overview)
2. [Storage Policy](#storage-policy)
3. [Setup Guide](#setup-guide)
4. [Image Display & Routes](#image-display--routes)
5. [File Organization](#file-organization)
6. [Troubleshooting](#troubleshooting)

---

## Overview

MatchTrip uses Cloudflare R2 for object storage with a **private-first approach**. All files are stored in a private bucket and served through authenticated API endpoints using presigned URLs.

### Why Cloudflare R2?

- **Cost-effective**: $0.015/GB/month (much cheaper than AWS S3)
- **No egress fees**: Free data transfer out
- **S3-compatible API**: Easy to integrate
- **Global performance**: Cloudflare's global network
- **Generous free tier**: 10GB storage, 1 million Class A operations, 10 million Class B operations per month

---

## Storage Policy

### 🔒 IMPORTANT RULE: Private Bucket by Default

**ALL file uploads MUST be stored in the private R2 bucket (`R2_BUCKET_NAME`)**

There are NO exceptions to this rule unless explicitly documented and approved.

### Current Exceptions

#### 1. Destination Images 🗺️

- **Files**: `destination/*.{jpg,jpeg,png,webp}`
- **Bucket**: Public bucket (`R2_PUBLIC_BUCKET_NAME`)
- **Justification**:
  - Destination images are public marketing content
  - No authentication required - improves performance and reliability
  - Better for SEO and social media sharing
  - Reduces API server load
- **URL Format**: Direct R2 public URLs (e.g., `https://pub-xxx.r2.dev/destination/image.jpg`)
- **Authentication**: None required
- **Approved**: January 2025

### Why Private Bucket Only?

#### Security 🔐

- All files require authentication (user must be logged in)
- Presigned URLs expire after 1 hour
- Prevents unauthorized access to user content

#### Consistency 📦

- Single source of truth for all files
- Simplified backup and migration
- Easier to manage and monitor

#### Control 🎛️

- Can track who accesses files
- Can implement access controls per user/role
- Can audit file access patterns

#### Cost 💰

- Single bucket to manage
- No duplicate files across buckets
- Efficient storage usage

### Exception Process

If you believe you need to use a public bucket for a specific use case:

1. **Document the requirement** - Why must this be public?
2. **Security review** - What are the risks?
3. **Get approval** - From security/architecture team
4. **Update this document** - Add the exception with justification

---

## Setup Guide

### 1. Create Cloudflare Account and R2 Buckets

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 Object Storage
3. Create two buckets:
   - **Private bucket**: `matchtrip-dev` (for sensitive files like ID documents)
   - **Public bucket**: `matchtrip-public` (for public images like destinations)
4. Note your Account ID from the R2 dashboard

### 2. Create API Token

1. Go to "Manage R2 API Tokens"
2. Create a new API token with:
   - **Permissions**: Object Read & Write
   - **Buckets**: Select both `matchtrip-dev` and `matchtrip-public`
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

#### Main Application (matchtrip)

Add these to your `.env` file:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-account-id-here
R2_ACCESS_KEY_ID=your-access-key-id-here
R2_SECRET_ACCESS_KEY=your-secret-access-key-here
R2_BUCKET_NAME=matchtrip-dev
R2_PUBLIC_BUCKET_NAME=matchtrip-public
R2_PUBLIC_URL=https://pub-your-account-id.r2.dev
# Or use custom domain: https://cdn.matchtrip.net
```

#### Admin Application (admin-matchtrip)

Add these to your `.env` file:

```env
# R2 Storage Configuration (Private Bucket)
R2_ACCOUNT_ID=your-account-id-here
R2_ACCESS_KEY_ID=your-access-key-id-here
R2_SECRET_ACCESS_KEY=your-secret-access-key-here
R2_BUCKET_NAME=matchtrip-dev

# Note: R2_PUBLIC_BUCKET_NAME is NOT needed
# All images are served from private bucket
```

### 5. Install Required Dependencies

```bash
bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

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

---

## Image Display & Routes

### How Images Are Displayed

All images now follow this flow:

1. **Image URL in Database**: `/api/images/type/filename.jpg`
2. **Browser Request**: `<img src="/api/images/type/filename.jpg">`
3. **API Endpoint**: Generates presigned URL and redirects (302)
4. **R2 Private Bucket**: Serves image with temporary authentication

### Routes That Display Images

#### 1. **Product Images**

- **Route**: `/products`, `/products/[id]`
- **Field**: `products.imageUrl`
- **Display**: Product cards, product detail pages
- **Status**: ✅ Works with `/api/images/` endpoint

#### 2. **Product Content Images** (in descriptions)

- **Route**: `/products/[id]`, `/products/create/description`
- **Field**: Images embedded in `products.description` HTML
- **Display**: Rich text content with inline images
- **Status**: ✅ RichTextEditor uploads to private bucket

#### 3. **Destination Images**

- **Route**: `/destinations`, `/trips/create/destination`
- **Field**: `destinations.imageUrl`
- **Display**: Destination cards, trip creation
- **Status**: ✅ Uses public bucket with direct URLs

#### 4. **User Profile Images**

- **Route**: `/profile`, `/guide/[id]`, `/traveler/[id]`
- **Field**: `users.image`
- **Display**: Profile pages, user avatars
- **Status**: ✅ Works with `/api/images/` endpoint

#### 5. **Guide Profile Images**

- **Route**: `/profile/guide`, `/guide/[id]`
- **Field**: `guideProfiles.profileImage`
- **Display**: Guide profile pages
- **Status**: ✅ Works with `/api/images/` endpoint

#### 6. **Traveler Profile Images**

- **Route**: `/profile/traveler`, `/traveler/[id]`
- **Field**: `travelerProfiles.profileImage`
- **Display**: Traveler profile pages
- **Status**: ✅ Works with `/api/images/` endpoint

#### 7. **Chat/Message Images**

- **Route**: `/chat/[id]`, `/chat/product/[id]`
- **Field**: Images in messages
- **Display**: Chat conversation
- **Status**: ✅ Uploaded as 'product-message' type

#### 8. **Guide Documents** (PDFs/Images)

- **Route**: `/onboarding/guide/documents`
- **Field**: Various document uploads
- **Display**: Document verification
- **Status**: ✅ Works with `/api/images/` endpoint

### Admin App Requirements

The admin app (`admin-matchtrip`) must:

1. Have the same `/api/images/[...path]/+server.ts` endpoint
2. Have R2 credentials configured in `.env`
3. Handle both `imageUrl` and `fileIds` for backward compatibility

### How the API Endpoint Works

1. **Image URLs in database**: `/api/images/content/file.jpg`
2. **Browser requests**: `GET /api/images/content/file.jpg`
3. **API endpoint**:
   - Generates presigned URL for private R2 bucket
   - Returns 302 redirect to presigned URL
   - Browser follows redirect and loads image
4. **Caching**: Browser caches the actual image (not the presigned URL)

---

## File Organization

### File Types and Folders

All file types use the same private bucket with folder organization:

| Type                | Folder                                  | Example Path                                   | Bucket        |
| ------------------- | --------------------------------------- | ---------------------------------------------- | ------------- |
| Product content     | `content/`                              | `/api/images/content/123.jpg`                  | Private       |
| Product attachments | `product_attachment/`                   | `/api/images/product_attachment/file.pdf`      | Private       |
| Profile images      | `guide-profile/` or `traveler-profile/` | `/api/images/guide-profile/avatar.jpg`         | Private       |
| Destinations        | `destination/`                          | `https://pub-xxx.r2.dev/destination/paris.jpg` | **Public** ⚠️ |
| Documents           | `guide-document-*/`                     | `/api/images/guide-document-identity/id.jpg`   | Private       |
| Messages            | `product-message/`                      | `/api/images/product-message/chat.jpg`         | Private       |

### Upload Implementation

```typescript
// src/routes/api/upload/+server.ts
// ALWAYS uses private bucket (R2_BUCKET_NAME)
const bucketName = R2_BUCKET_NAME; // ✅ CORRECT
// const bucketName = R2_PUBLIC_BUCKET_NAME; // ❌ NEVER DO THIS
```

### File Access

```typescript
// All files served through authenticated endpoint
// URL format: /api/images/[type]/[filename]
// Example: /api/images/content/image.jpg
```

---

## Troubleshooting

### Common Issues

#### Images Don't Load

1. **Check browser console** for errors
2. **Check server logs** for R2 initialization messages
3. **Verify environment variables** are set correctly
4. **Test the endpoint directly**:
   ```
   http://localhost:5173/api/images/content/1754393699893-valtudhe54.png
   ```
   Should redirect to an R2 presigned URL

#### Error Codes

- **500 Error**: R2 credentials not configured
- **404 Error**: File doesn't exist in bucket
- **403 Error**: Invalid R2 credentials
- **CORS errors**: Configure CORS in R2 bucket settings

### Red Flags 🚩

- URLs starting with `https://` in database (should be `/api/images/`)
- Direct R2 URLs in responses
- New files appearing in public bucket (except destinations)
- Upload errors mentioning public bucket

### Debug Tips

- Check Cloudflare R2 logs in the dashboard
- Verify environment variables are loaded correctly
- Test API endpoints with tools like Postman
- Monitor upload success/failure rates

### Monitoring

#### How to Verify Compliance

1. Check upload logs - Should only show private bucket uploads
2. Check database - All URLs should start with `/api/images/` (except destinations)
3. Check R2 dashboard - Public bucket should have no new files (except destinations)

---

## Testing Checklist

After setting up or migrating:

- [ ] Product list shows images
- [ ] Product detail pages show main image
- [ ] Product descriptions show inline images
- [ ] Destination images display
- [ ] User profile pictures display
- [ ] Guide profile images display
- [ ] Chat message images display
- [ ] New image uploads work correctly
- [ ] Admin panel shows all images

---

## Important Notes

1. **Authentication Required**: All images (except destinations) require user authentication (session)
2. **Presigned URLs**: Generated on-demand with 1-hour expiration
3. **Caching**: Browser caches images, not the presigned URLs
4. **Performance**: Initial load might be slightly slower due to redirect
5. **Security**: Images are now protected and not publicly accessible
6. **All images are in private bucket** (`matchtrip-dev`) except destinations
7. **Public bucket is only for destinations**
8. **All URLs use `/api/images/` format** (except destinations)
9. **Files maintain folder structure** (content/, product_attachment/, etc.)
10. **Presigned URLs expire after 1 hour** (but browser caches the image)

---

## Cost Estimation

For a typical travel platform:

- **Storage**: ~$1.50/month for 100GB
- **Operations**: Usually within free tier
- **Bandwidth**: Free with R2
- **Total**: ~$1.50-5/month for most use cases

This is significantly cheaper than AWS S3 which would cost ~$25-30/month for the same usage.

---

## Developer Checklist

When implementing file uploads:

- [ ] Use `/api/upload` endpoint
- [ ] Store returned URL directly (always `/api/images/...` for private files)
- [ ] Never construct R2 URLs manually (except for destinations)
- [ ] Never use public bucket environment variables (except for destinations)
- [ ] Test that files require authentication to access
- [ ] Verify file is in correct folder

---

## Migration Status

✅ **Completed on**: January 2025

- All existing files migrated to private bucket
- All database URLs updated to `/api/images/` format
- Destination images remain in public bucket
- Both main and admin apps configured

---

**Last Updated**: January 2025
**Policy Version**: 2.0
**Status**: ACTIVE ✅
