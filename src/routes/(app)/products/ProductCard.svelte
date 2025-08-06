<script lang="ts">
	import { Star } from 'lucide-svelte';
	import type { Product } from '$lib/server/db/schema';
	
	interface Props {
		product: {
			id: string;
			title: string;
			description: string;
			price: number;
			currency: string;
			imageUrl: string | null;
			rating: number | null;
			reviewCount: number;
			destination: {
				id: number;
				city: string;
				country: {
					id: number;
					name: string;
				} | null;
			} | null;
			guide: {
				id: string;
				name: string;
				image: string | null;
			} | null;
			guideProfile: {
				username: string | null;
				profileImageUrl: string | null;
			} | null;
		};
		onclick?: () => void;
	}
	
	const { product, onclick }: Props = $props();
	
	// Format price with commas
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('ko-KR').format(price);
	};
	
	// Extract plain text from rich text description (basic implementation)
	const getPlainTextDescription = (html: string) => {
		const div = document.createElement('div');
		div.innerHTML = html;
		return div.textContent || div.innerText || '';
	};
	
	// Extract first image from description HTML (client-side only)
	const getFirstImageFromDescription = (html: string): string | null => {
		if (!html || typeof window === 'undefined') return null;
		
		// Create a temporary div to parse HTML
		const div = document.createElement('div');
		div.innerHTML = html;
		
		// Find the first img tag
		const firstImg = div.querySelector('img');
		return firstImg ? firstImg.src : null;
	};
	
	// Get thumbnail image - either from imageUrl or first image in description
	const thumbnailImage = $derived(
		product.imageUrl || (typeof window !== 'undefined' ? getFirstImageFromDescription(product.description) : null)
	);
</script>

<button
	onclick={onclick || (() => {})}
	class="block w-full text-left"
>
	<!-- Image -->
	<div class="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
		{#if thumbnailImage}
			<img
				src={thumbnailImage}
				alt={product.title}
				class="h-full w-full object-cover"
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center text-gray-400">
				<svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
						d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</div>
		{/if}
		
		<!-- Badge (if needed) -->
		{#if product.isNew}
			<div class="absolute top-2 left-2">
				<span class="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">NEW</span>
			</div>
		{:else if product.isHot}
			<div class="absolute top-2 left-2">
				<span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">HOT</span>
			</div>
		{/if}
	</div>
	
	<!-- Content -->
	<div class="mt-2">
		<!-- Destination -->
		<h3 class="text-sm font-bold text-gray-900">
			{product.destination?.city || product.title}
		</h3>
		
		<!-- Guide name or description -->
		<p class="text-xs text-gray-500 mt-0.5">
			{product.guide?.name || product.guideProfile?.username || '독일'}
		</p>
	</div>
</button>