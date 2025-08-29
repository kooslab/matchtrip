import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const sizes = [192, 512];
const inputFile = path.join(process.cwd(), 'static', 'logo-2.png');
const outputDir = path.join(process.cwd(), 'static');

async function generatePWAIcons() {
	try {
		// Check if input file exists
		await fs.access(inputFile);

		console.log('Generating PWA icons from:', inputFile);

		for (const size of sizes) {
			const outputFile = path.join(outputDir, `pwa-${size}x${size}.png`);

			await sharp(inputFile)
				.resize(size, size, {
					fit: 'contain',
					background: { r: 255, g: 255, b: 255, alpha: 1 }
				})
				.png()
				.toFile(outputFile);

			console.log(`✓ Generated ${outputFile}`);
		}

		console.log('PWA icons generated successfully!');
	} catch (error) {
		console.error('Error generating PWA icons:', error);

		// Fallback: Create simple colored squares as placeholder icons
		console.log('Creating fallback PWA icons...');

		for (const size of sizes) {
			const outputFile = path.join(outputDir, `pwa-${size}x${size}.png`);

			// Create a simple blue square with "M" text as placeholder
			const svg = `
				<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
					<rect width="${size}" height="${size}" fill="#1095f4"/>
					<text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dy=".3em">M</text>
				</svg>
			`;

			await sharp(Buffer.from(svg)).png().toFile(outputFile);

			console.log(`✓ Created fallback ${outputFile}`);
		}
	}
}

generatePWAIcons().catch(console.error);
