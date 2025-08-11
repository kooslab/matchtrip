# Image Display Routes After Private Bucket Migration

## Overview
After migrating all images to the private bucket, all image URLs will use the `/api/images/[path]` endpoint, which generates presigned URLs for secure access.

## How Images Are Displayed

All images now follow this flow:
1. **Image URL in Database**: `/api/images/type/filename.jpg`
2. **Browser Request**: `<img src="/api/images/type/filename.jpg">`
3. **API Endpoint**: Generates presigned URL and redirects (302)
4. **R2 Private Bucket**: Serves image with temporary authentication

## Routes That Display Images

### 1. **Product Images**
- **Route**: `/products`, `/products/[id]`
- **Field**: `products.imageUrl`
- **Display**: Product cards, product detail pages
- **Status**: ✅ Works with `/api/images/` endpoint

### 2. **Product Content Images** (in descriptions)
- **Route**: `/products/[id]`, `/products/create/description`
- **Field**: Images embedded in `products.description` HTML
- **Display**: Rich text content with inline images
- **Status**: ✅ RichTextEditor uploads to private bucket

### 3. **Destination Images**
- **Route**: `/destinations`, `/trips/create/destination`
- **Field**: `destinations.imageUrl`
- **Display**: Destination cards, trip creation
- **Status**: ✅ Will work after migration

### 4. **User Profile Images**
- **Route**: `/profile`, `/guide/[id]`, `/traveler/[id]`
- **Field**: `users.image`
- **Display**: Profile pages, user avatars
- **Status**: ✅ Works with `/api/images/` endpoint

### 5. **Guide Profile Images**
- **Route**: `/profile/guide`, `/guide/[id]`
- **Field**: `guideProfiles.profileImage`
- **Display**: Guide profile pages
- **Status**: ✅ Works with `/api/images/` endpoint

### 6. **Traveler Profile Images**
- **Route**: `/profile/traveler`, `/traveler/[id]`
- **Field**: `travelerProfiles.profileImage`
- **Display**: Traveler profile pages
- **Status**: ✅ Works with `/api/images/` endpoint

### 7. **Chat/Message Images**
- **Route**: `/chat/[id]`, `/chat/product/[id]`
- **Field**: Images in messages
- **Display**: Chat conversation
- **Status**: ✅ Uploaded as 'product-message' type

### 8. **Guide Documents** (PDFs/Images)
- **Route**: `/onboarding/guide/documents`
- **Field**: Various document uploads
- **Display**: Document verification
- **Status**: ✅ Works with `/api/images/` endpoint

## Admin App Requirements

The admin app (`admin-matchtrip`) must:
1. Have the same `/api/images/[...path]/+server.ts` endpoint
2. Have R2 credentials configured in `.env`
3. Handle both `imageUrl` and `fileIds` for backward compatibility

## Testing Checklist After Migration

Run `bun run migrate:all-to-private` then test:

- [ ] Product list shows images
- [ ] Product detail pages show main image
- [ ] Product descriptions show inline images
- [ ] Destination images display
- [ ] User profile pictures display
- [ ] Guide profile images display
- [ ] Chat message images display
- [ ] New image uploads work correctly
- [ ] Admin panel shows all images

## Important Notes

1. **Authentication Required**: All images now require user authentication (session)
2. **Presigned URLs**: Generated on-demand with 1-hour expiration
3. **Caching**: Browser caches images, not the presigned URLs
4. **Performance**: Initial load might be slightly slower due to redirect
5. **Security**: Images are now protected and not publicly accessible

## Migration Command

```bash
# Run the migration
bun run migrate:all-to-private

# This will:
# 1. Update all file_uploads URLs to /api/images/
# 2. Update all product imageUrls
# 3. Update all destination imageUrls
# 4. Update all user profile images
# 5. Update guide and traveler profile images
# 6. Copy files from public to private bucket (if needed)
```