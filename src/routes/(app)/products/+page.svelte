<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';
	import ProductCard from './ProductCard.svelte';
	
	const { data } = $props();
	
	// Get data from server
	const products = $derived(data.products || []);
	const selectedDestination = $derived(data.selectedDestination);
	const user = $derived(data.user);
	
	// Filter state
	let filterBy = $state<'all' | 'latest'>('all');
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

		<!-- Filters -->
		<div class="flex justify-between px-4 py-3 border-b">
			<button
				onclick={() => filterBy = 'all'}
				class="px-3 py-1.5 text-sm rounded-full transition-colors {filterBy === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}"
			>
				전체 {products.length}
			</button>
			<button
				onclick={() => filterBy = 'latest'}
				class="px-3 py-1.5 text-sm rounded-full transition-colors {filterBy === 'latest' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}"
			>
				최신순
			</button>
		</div>

		<!-- Main Content -->
		<main class="px-4 py-4">
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
				<div class="grid grid-cols-2 gap-4">
					{#each products as product}
						<ProductCard {product} />
					{/each}
				</div>
			{/if}
		</main>
	</div>
</div>