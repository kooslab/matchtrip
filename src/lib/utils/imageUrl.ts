/**
 * Transform image URLs based on file type
 * - Destination images: Use direct public R2 URLs (no API endpoint)
 * - Other images: Use private bucket API endpoint for security
 */
export function transformImageUrl(
	imageUrl: string | null | undefined,
	type?: string
): string | null {
	if (!imageUrl) return null;

	// If it's already a full public URL (destination images), return as is
	if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
		return imageUrl;
	}

	// If it's using the API endpoint, handle destination images specially
	if (imageUrl.startsWith('/api/images/')) {
		const path = imageUrl.replace('/api/images/', '');

		// For destination images, redirect through API (which will redirect to public)
		// This maintains backward compatibility
		if (path.startsWith('destination/') || type === 'destination') {
			return imageUrl; // Let the API handle the redirect
		}

		// For destination images without proper prefix, add it
		if (
			!path.includes('/') &&
			!path.startsWith('destination/') &&
			path.match(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i
			)
		) {
			return `/api/images/destination/${path}`;
		}

		return imageUrl;
	}

	// Extract the key from various URL formats
	let key: string | null = null;

	// Handle R2 public URL format: https://pub-xxx.r2.dev/key
	if (imageUrl.includes('.r2.dev/')) {
		key = imageUrl.split('.r2.dev/')[1];
	}
	// Handle S3 URL format: https://bucket.s3.region.amazonaws.com/key
	else if (imageUrl.includes('.s3.') && imageUrl.includes('.amazonaws.com/')) {
		key = imageUrl.split('.amazonaws.com/')[1];
	}
	// Handle S3 alternative format: https://s3.region.amazonaws.com/bucket/key
	else if (imageUrl.includes('//s3.') && imageUrl.includes('.amazonaws.com/')) {
		const parts = imageUrl.split('.amazonaws.com/')[1].split('/');
		key = parts.slice(1).join('/');
	}

	// If we extracted a key, return the API endpoint URL
	if (key) {
		// Decode the key in case it's URL encoded
		key = decodeURIComponent(key);
		// Remove any query parameters
		key = key.split('?')[0];
		// Return the private bucket API endpoint
		return `/api/images/${key}`;
	}

	// If we couldn't parse it, return the original URL
	// This might be a local or external URL
	return imageUrl;
}

/**
 * Transform all image URLs in an object recursively
 */
export function transformImageUrlsInObject<T extends Record<string, any>>(obj: T): T {
	if (!obj || typeof obj !== 'object') return obj;

	const transformed = { ...obj };

	for (const key in transformed) {
		const value = transformed[key];

		// Handle imageUrl fields
		if (key === 'imageUrl' && typeof value === 'string') {
			transformed[key] = transformImageUrl(value) as any;
		}
		// Handle profileImageUrl fields
		else if (key === 'profileImageUrl' && typeof value === 'string') {
			transformed[key] = transformImageUrl(value) as any;
		}
		// Handle arrays
		else if (Array.isArray(value)) {
			transformed[key] = value.map((item) =>
				typeof item === 'object' ? transformImageUrlsInObject(item) : item
			) as any;
		}
		// Handle nested objects
		else if (value && typeof value === 'object') {
			transformed[key] = transformImageUrlsInObject(value);
		}
	}

	return transformed;
}
