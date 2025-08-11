<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import ProductCard from './ProductCard.svelte';
	import ProductDetailModal from '$lib/components/ProductDetailModal.svelte';
	
	const { data } = $props();
	
	// Get data from server
	const destinations = $derived(data.destinations || []);
	const products = $derived(data.products || []);
	const selectedDestination = $derived(data.selectedDestination);
	const user = $derived(data.user);
	
	// Filter state
	let filterBy = $state<'all' | 'latest'>('all');
	
	// Modal state
	let selectedProduct = $state<any>(null);
	let isModalOpen = $state(false);
	
	// Handle product click
	const handleProductClick = async (productId: string) => {
		// Find the product in our current list
		const product = products.find(p => p.id === productId);
		if (product) {
			selectedProduct = product;
			isModalOpen = true;
			// Update URL with query parameter
			const url = new URL(window.location.href);
			url.searchParams.set('productId', productId);
			window.history.pushState({}, '', url.toString());
		} else {
			// If product not in list, fetch it
			try {
				const response = await fetch(`/api/products/${productId}`);
				if (response.ok) {
					selectedProduct = await response.json();
					isModalOpen = true;
					const url = new URL(window.location.href);
					url.searchParams.set('productId', productId);
					window.history.pushState({}, '', url.toString());
				}
			} catch (error) {
				console.error('Failed to fetch product:', error);
			}
		}
	};
	
	// Handle modal close
	const handleModalClose = () => {
		isModalOpen = false;
		selectedProduct = null;
		// Remove query parameter
		const url = new URL(window.location.href);
		url.searchParams.delete('productId');
		window.history.pushState({}, '', url.toString());
	};
	
	// Check if we should open modal on mount (if URL has product ID in query)
	onMount(() => {
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search);
			const productId = urlParams.get('productId');
			if (productId) {
				handleProductClick(productId);
			}
		}
	});
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto min-h-screen max-w-[430px] bg-white">
		<!-- Header -->
		<header class="sticky top-0 z-50 bg-white border-b">
			<div class="flex items-center px-4 py-4">
				<button onclick={() => goto('/')} class="p-1">
					<ArrowLeft class="h-6 w-6 text-blue-500" />
				</button>
				<h1 class="flex-1 text-center text-lg font-semibold">
					{#if selectedDestination}
						{selectedDestination.city}
					{:else}
						여행 상품
					{/if}
				</h1>
				<div class="w-8"></div>
			</div>
		</header>

		<!-- Show destinations if no specific destination selected -->
		{#if !selectedDestination && destinations.length > 0}
			<main class="p-4">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">여행 지역 선택</h2>
				<div class="grid grid-cols-2 gap-4">
					{#each destinations as destination}
						<button
							onclick={() => goto(`/products?destination=${destination.id}`)}
							class="text-left group"
						>
							<div class="relative overflow-hidden rounded-lg aspect-[4/3] mb-2">
								{#if destination.imageUrl}
									<img 
										src={destination.imageUrl} 
										alt={destination.city}
										class="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
										onerror={(e) => {
											e.target.style.display = 'none';
											e.target.nextElementSibling.style.display = 'flex';
										}}
									/>
									<div class="h-full w-full bg-gray-200 hidden items-center justify-center">
										<span class="text-gray-400 text-xs">{destination.city}</span>
									</div>
								{:else}
									<div class="h-full w-full bg-gray-200 flex items-center justify-center">
										<span class="text-gray-400 text-xs">{destination.city}</span>
									</div>
								{/if}
							</div>
							<div class="px-1">
								<h3 class="font-semibold text-sm text-gray-900">{destination.city}</h3>
								<p class="text-xs text-gray-600">{destination.country?.name}</p>
								<p class="text-xs text-blue-600 mt-0.5">{destination.productCount}개 상품</p>
							</div>
						</button>
					{/each}
				</div>
			</main>
		{:else if selectedDestination}
			<!-- Filters for selected destination -->
			<div class="flex items-center gap-3 px-4 py-3">
				<button
					onclick={() => filterBy = 'all'}
					class="px-3 py-1.5 text-sm rounded-full transition-colors {filterBy === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600'}"
				>
					전체 {products.length}
				</button>
				<button
					onclick={() => filterBy = 'latest'}
					class="px-3 py-1.5 text-sm transition-colors {filterBy === 'latest' ? 'text-gray-900 font-medium' : 'text-gray-600'}"
				>
					최신순 ↓
				</button>
			</div>

			<!-- Main Content -->
			<main class="pb-4">
				{#if products.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<div class="mb-4 text-gray-400">
						<svg class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
					</div>
					<h2 class="text-lg font-medium text-gray-900 mb-2">
						{#if selectedDestination}
							{selectedDestination.city}의 여행 상품이 없습니다
						{:else}
							등록된 여행 상품이 없습니다
						{/if}
					</h2>
					<p class="text-sm text-gray-500">
						곧 새로운 상품이 등록될 예정입니다
					</p>
				</div>
			{:else}
				<div class="px-4">
					<div class="grid grid-cols-3 gap-3">
						{#each products.slice(0, 6) as product, index}
							<ProductCard {product} onclick={() => handleProductClick(product.id)} />
						{/each}
					</div>
					
					{#if products.length > 6}
						<!-- Promotional Banner -->
						<div class="my-6 rounded-lg bg-blue-50 p-4">
							<p class="text-xs text-gray-600 mb-1">What is Lorem Ipsum</p>
							<h3 class="text-sm font-bold text-gray-900">What is Lorem Ipsum</h3>
						</div>
						
						<!-- Rest of products -->
						<div class="grid grid-cols-3 gap-3">
							{#each products.slice(6) as product}
								<ProductCard {product} onclick={() => handleProductClick(product.id)} />
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</main>
		{:else}
			<!-- No destinations available -->
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<div class="mb-4 text-gray-400">
					<svg class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
				<h2 class="text-lg font-medium text-gray-900 mb-2">
					등록된 여행 상품이 없습니다
				</h2>
				<p class="text-sm text-gray-500">
					곧 새로운 상품이 등록될 예정입니다
				</p>
			</div>
		{/if}
	</div>
</div>

<!-- Product Detail Modal -->
<ProductDetailModal 
	product={selectedProduct} 
	bind:isOpen={isModalOpen} 
	onClose={handleModalClose} 
/>