import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.svg', 'favicon.png', 'logo-1.png', 'logo-2.png'],
			manifest: {
				name: 'MatchTrip - 현지 가이드 매칭 플랫폼',
				short_name: '매치트립',
				description: '여행자와 현지 가이드를 연결하는 스마트한 여행 플랫폼',
				theme_color: '#1095f4',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: '/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: '/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				],
				categories: ['travel', 'lifestyle'],
				lang: 'ko-KR'
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff,woff2}'],
				cleanupOutdatedCaches: true,
				clientsClaim: true,
				skipWaiting: true,
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'gstatic-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					{
						urlPattern: /\/api\/.*\/*.js$/,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'api-cache',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 5 // 5 minutes
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					{
						urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'image-cache',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					}
				]
			},
			devOptions: {
				enabled: true,
				suppressWarnings: true,
				navigateFallback: '/',
				type: 'module'
			}
		})
	]
});
