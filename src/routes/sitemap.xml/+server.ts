import { db } from '$lib/server/db';
import { products, destinations } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const BASE_URL = 'https://matchtrip.net';

export async function GET() {
	// Fetch all published products
	const publishedProducts = await db
		.select({
			id: products.id,
			updatedAt: products.updatedAt
		})
		.from(products)
		.where(eq(products.status, 'active'));

	// Fetch all destinations
	const allDestinations = await db
		.select({
			id: destinations.id
		})
		.from(destinations);

	const today = new Date().toISOString().split('T')[0];

	// Static pages with their priorities and change frequencies
	const staticPages = [
		{ url: '/', priority: '1.0', changefreq: 'daily' },
		{ url: '/products', priority: '0.9', changefreq: 'daily' },
		{ url: '/login', priority: '0.3', changefreq: 'monthly' },
		{ url: '/terms', priority: '0.2', changefreq: 'yearly' },
		{ url: '/terms/service', priority: '0.2', changefreq: 'yearly' },
		{ url: '/terms/privacy', priority: '0.2', changefreq: 'yearly' },
		{ url: '/terms/refund-policy', priority: '0.2', changefreq: 'yearly' },
		{ url: '/contact', priority: '0.3', changefreq: 'monthly' }
	];

	let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

	// Add static pages
	for (const page of staticPages) {
		xml += `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
	}

	// Add destination filter pages
	for (const destination of allDestinations) {
		xml += `  <url>
    <loc>${BASE_URL}/products?destination=${destination.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
	}

	// Add product pages
	for (const product of publishedProducts) {
		const lastmod = product.updatedAt
			? new Date(product.updatedAt).toISOString().split('T')[0]
			: today;
		xml += `  <url>
    <loc>${BASE_URL}/products/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
	}

	xml += `</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
}
