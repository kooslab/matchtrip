# Storage Policy - Private Bucket Only

## 🔒 IMPORTANT RULE: All Files MUST Use Private Bucket

### Policy Statement
**ALL file uploads MUST be stored in the private R2 bucket (`R2_BUCKET_NAME`)**

There are NO exceptions to this rule unless explicitly documented and approved.

## Why Private Bucket Only?

1. **Security** 🔐
   - All files require authentication (user must be logged in)
   - Presigned URLs expire after 1 hour
   - Prevents unauthorized access to user content

2. **Consistency** 📦
   - Single source of truth for all files
   - Simplified backup and migration
   - Easier to manage and monitor

3. **Control** 🎛️
   - Can track who accesses files
   - Can implement access controls per user/role
   - Can audit file access patterns

4. **Cost** 💰
   - Single bucket to manage
   - No duplicate files across buckets
   - Efficient storage usage

## Implementation

### Upload Process
```javascript
// src/routes/api/upload/+server.ts
// ALWAYS uses private bucket (R2_BUCKET_NAME)
const bucketName = R2_BUCKET_NAME; // ✅ CORRECT
// const bucketName = R2_PUBLIC_BUCKET_NAME; // ❌ NEVER DO THIS
```

### File Access
```javascript
// All files served through authenticated endpoint
// URL format: /api/images/[type]/[filename]
// Example: /api/images/content/image.jpg
```

### File Types and Folders
All file types use the same private bucket with folder organization:

| Type | Folder | Example Path |
|------|--------|--------------|
| Product content | `content/` | `/api/images/content/123.jpg` |
| Product attachments | `product_attachment/` | `/api/images/product_attachment/file.pdf` |
| Profile images | `guide-profile/` or `traveler-profile/` | `/api/images/guide-profile/avatar.jpg` |
| Destinations | `destination/` | `/api/images/destination/paris.jpg` |
| Documents | `guide-document-*/` | `/api/images/guide-document-identity/id.jpg` |
| Messages | `product-message/` | `/api/images/product-message/chat.jpg` |

## Environment Variables

### Required (Private Bucket)
```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=your_private_bucket  # ✅ REQUIRED
```

### Deprecated (Do Not Use)
```env
R2_PUBLIC_BUCKET_NAME=xxx  # ❌ DEPRECATED - DO NOT USE
R2_PUBLIC_URL=xxx          # ❌ DEPRECATED - DO NOT USE
```

## Exception Process

If you believe you need to use a public bucket for a specific use case:

1. **Document the requirement** - Why must this be public?
2. **Security review** - What are the risks?
3. **Get approval** - From security/architecture team
4. **Update this document** - Add the exception with justification

### Currently Approved Exceptions
**NONE** - All files must use private bucket

## Migration Status

✅ **Completed on**: January 2025
- All existing files migrated to private bucket
- All database URLs updated to `/api/images/` format
- Public bucket deprecated (can be deleted)

## Monitoring

### How to Verify Compliance
1. Check upload logs - Should only show private bucket uploads
2. Check database - All URLs should start with `/api/images/`
3. Check R2 dashboard - Public bucket should have no new files

### Red Flags 🚩
- URLs starting with `https://` in database
- Direct R2 URLs in responses
- New files appearing in public bucket
- Upload errors mentioning public bucket

## Developer Checklist

When implementing file uploads:

- [ ] Use `/api/upload` endpoint
- [ ] Store returned URL directly (always `/api/images/...`)
- [ ] Never construct R2 URLs manually
- [ ] Never use public bucket environment variables
- [ ] Test that files require authentication to access

## FAQ

**Q: What about SEO for public content like destination images?**
A: Use server-side rendering. The server can access images and include them in the initial HTML.

**Q: What about performance?**
A: Presigned URLs are cached by browsers. Initial request has small redirect overhead, but subsequent loads are fast.

**Q: Can we make some images public later?**
A: Yes, but it requires a policy change and security review. Update this document first.

**Q: What about CDN?**
A: Can be added in front of the `/api/images/` endpoint if needed, maintaining security.

## Contact

For questions or exception requests, contact the architecture team.

---

**Last Updated**: January 2025
**Policy Version**: 1.0
**Status**: ACTIVE ✅