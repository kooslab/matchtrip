<script lang="ts">
	import { goto } from '$app/navigation';
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
	}
	
	const { product }: Props = $props();
	
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
</script>

<button
	onclick={() => goto(`/products/${product.id}`)}
	class="block w-full overflow-hidden rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow text-left"
>
	<!-- Image -->
	<div class="relative aspect-[4/3] overflow-hidden bg-gray-100">
		{#if product.imageUrl}
			<img
				src={product.imageUrl}
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
	</div>
	
	<!-- Content -->
	<div class="p-3">
		<!-- Title and Description -->
		<h3 class="text-sm font-medium text-gray-900 line-clamp-2">{product.title}</h3>
		<p class="mt-1 text-xs text-gray-500 line-clamp-2">
			{getPlainTextDescription(product.description)}
		</p>
		
		<!-- Price -->
		<div class="mt-2">
			<span class="text-base font-bold text-gray-900">{formatPrice(product.price)}원</span>
		</div>
		
		<!-- Rating -->
		{#if product.rating}
			<div class="mt-1 flex items-center gap-1">
				<Star class="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
				<span class="text-xs font-medium text-gray-900">{product.rating.toFixed(1)}</span>
			</div>
		{/if}
	</div>
</button>