<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronLeft, Plus, Package } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import ProductDetailModal from '$lib/components/ProductDetailModal.svelte';

	const { data } = $props();

	const myProducts = $derived(data?.myProducts || []);
	const user = $derived(data?.user);

	// Modal state for product detail
	let selectedProduct = $state<any>(null);
	let isModalOpen = $state(false);

	// Product restrictions cache
	let productRestrictions = $state<Record<string, any>>({});

	// Extract first image from HTML description
	function extractFirstImage(htmlContent: string): string | null {
		if (!htmlContent) return null;

		// Use regex to extract img src during SSR
		// This works both on server and client
		const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
		const matches = [...htmlContent.matchAll(imgRegex)];

		for (const match of matches) {
			const imgTag = match[0];
			const src = match[1];

			// Skip icon images (checking for w-4 or h-4 classes)
			if (!imgTag.includes('w-4') && !imgTag.includes('h-4')) {
				return src;
			}
		}

		return null;
	}

	// Handle product click to view details
	const handleProductClick = async (productId: string) => {
		const product = myProducts.find((p) => p.id === productId);
		if (product) {
			// Update URL with query parameter
			const url = new URL(window.location.href);
			url.searchParams.set('productId', productId);
			window.history.pushState({}, '', url.toString());

			// Fetch full product details
			try {
				const response = await fetch(`/api/products/${productId}`);
				if (response.ok) {
					selectedProduct = await response.json();
					isModalOpen = true;
				}
			} catch (error) {
				console.error('Failed to fetch product:', error);
				selectedProduct = product;
				isModalOpen = true;
			}
		}
	};

	// Check restrictions for a product
	const checkProductRestrictions = async (productId: string) => {
		if (productRestrictions[productId]) return productRestrictions[productId];

		try {
			const response = await fetch(`/api/products/${productId}/restrictions`);
			if (response.ok) {
				const restrictions = await response.json();
				productRestrictions[productId] = restrictions;
				productRestrictions = { ...productRestrictions };
				return restrictions;
			}
		} catch (error) {
			console.error('Error checking restrictions:', error);
		}

		return { canEdit: true, canDelete: true };
	};

	// Handle edit click
	const handleEditClick = async (productId: string, event: Event) => {
		event.stopPropagation();

		const restrictions = await checkProductRestrictions(productId);
		if (!restrictions.canEdit) {
			window.alert(restrictions.reason || '이 상품은 수정할 수 없습니다.');
			return;
		}

		await goto(`/products/edit/${productId}`);
	};

	// Handle delete click
	const handleDeleteClick = async (productId: string, event: Event) => {
		event.stopPropagation();

		const restrictions = await checkProductRestrictions(productId);
		if (!restrictions.canDelete) {
			window.alert(restrictions.reason || '이 상품은 삭제할 수 없습니다.');
			return;
		}

		const confirmed = window.confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
		if (!confirmed) return;

		try {
			const response = await fetch(`/api/products/${productId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Delete failed');
			}

			// Refresh the page to update the list
			window.location.reload();
		} catch (error) {
			console.error('Error deleting product:', error);
			window.alert(error.message || '상품 삭제에 실패했습니다');
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

		// Preload restrictions for all products
		myProducts.forEach((product) => {
			checkProductRestrictions(product.id);
		});
	});

	// Format price with commas
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('ko-KR').format(price);
	};

	// Format date
	const formatDate = (date: Date | string) => {
		return new Date(date).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	// Get status badge color
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'published':
				return 'bg-green-100 text-green-700';
			case 'draft':
				return 'bg-gray-100 text-gray-700';
			case 'inactive':
				return 'bg-red-100 text-red-700';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	};

	// Get status text
	const getStatusText = (status: string) => {
		switch (status) {
			case 'published':
				return '게시중';
			case 'draft':
				return '임시저장';
			case 'inactive':
				return '비활성';
			default:
				return status;
		}
	};
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto min-h-screen max-w-md bg-white">
		<!-- Header -->
		<header class="sticky top-0 z-50 border-b bg-white">
			<div class="flex items-center px-4 py-4">
				<button onclick={() => goto('/profile/guide')} class="p-1">
					<ChevronLeft class="h-6 w-6 text-blue-500" />
				</button>
				<h1 class="flex-1 text-center text-lg font-semibold">내 상품 관리</h1>
				<div class="w-8"></div>
			</div>
		</header>

		<!-- Main Content -->
		<main class="pb-20">
			<!-- Product Count and Filter -->
			<div class="flex items-center justify-between border-b px-4 py-3">
				<div class="text-sm">
					전체 <span class="font-semibold text-blue-500">{myProducts.length}</span>
				</div>
				<button class="flex items-center gap-1 text-sm text-gray-600">
					최신순
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>
			</div>

			{#if myProducts.length === 0}
				<!-- Empty State -->
				<div class="flex flex-col items-center justify-center py-32 text-center">
					<div class="mb-4 text-gray-400">
						<svg class="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
							/>
						</svg>
					</div>
					<h2 class="mb-2 text-lg font-medium text-gray-900">등록된 상품이 없습니다</h2>
					<p class="mb-6 text-sm text-gray-500">첫 번째 여행 상품을 만들어보세요!</p>
				</div>
			{:else}
				<!-- Products Grid -->
				<div class="grid grid-cols-2 gap-3 p-4">
					{#each myProducts as product}
						{@const firstDescImage = extractFirstImage(product.description)}
						<button
							onclick={() => handleProductClick(product.id)}
							class="overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
						>
							<!-- Product Image -->
							<div class="relative aspect-[4/3] bg-gray-200">
								{#if product.imageUrl || firstDescImage}
									<img
										src={product.imageUrl || firstDescImage}
										alt={product.title}
										class="h-full w-full object-cover"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center text-gray-400">
										<Package class="h-8 w-8" />
									</div>
								{/if}

								<!-- Status Badge -->
								{#if product.status === 'published'}
									<div
										class="absolute top-2 left-2 rounded bg-blue-500 px-2 py-1 text-xs text-white"
									>
										가우디
									</div>
								{:else if product.status === 'draft'}
									<div
										class="absolute top-2 left-2 rounded bg-gray-500 px-2 py-1 text-xs text-white"
									>
										임시저장
									</div>
								{/if}
							</div>

							<!-- Product Info -->
							<div class="p-3">
								<h3 class="mb-2 line-clamp-2 text-left text-sm font-medium text-gray-600">
									{product.title}
								</h3>

								<div class="mb-1 flex items-start justify-between">
									<div class="text-base font-bold text-gray-900">
										{formatPrice(product.price)}원
									</div>
								</div>

								<div class="flex items-center gap-1 text-xs text-gray-600">
									{#if product.reviewCount && product.reviewCount > 0}
										<span class="text-yellow-500">⭐</span>
										<span>{product.rating || 0}</span>
										<span class="text-gray-500">({product.reviewCount})</span>
									{:else}
										<span class="text-gray-400">아직 리뷰가 없습니다</span>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</main>

		<!-- Floating Create Button -->
		<div class="pointer-events-none fixed right-0 bottom-0 left-0 z-50">
			<div class="relative mx-auto max-w-md">
				<button
					onclick={() => goto('/products/create')}
					class="pointer-events-auto absolute right-4 bottom-8 flex items-center justify-center gap-2 rounded-full bg-blue-500 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-blue-600"
				>
					새 상품 만들기
					<Plus class="h-5 w-5" />
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Product Detail Modal -->
<ProductDetailModal
	product={selectedProduct}
	bind:isOpen={isModalOpen}
	onClose={handleModalClose}
	showGuideTab={false}
	showReviewTab={false}
	showContactButton={false}
	showEditDelete={true}
	onEdit={() => {
		if (selectedProduct) {
			handleEditClick(selectedProduct.id, new Event('click'));
		}
	}}
	onDelete={() => {
		if (selectedProduct) {
			handleDeleteClick(selectedProduct.id, new Event('click'));
		}
	}}
/>
