<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronLeft, Plus, Edit, Trash2, Eye, Package } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import ProductDetailModal from '$lib/components/ProductDetailModal.svelte';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';
	
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
		const product = myProducts.find(p => p.id === productId);
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
		myProducts.forEach(product => {
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
	<div class="mx-auto min-h-screen max-w-[430px] bg-white">
		<!-- Header -->
		<header class="sticky top-0 z-50 bg-white border-b">
			<div class="flex items-center px-4 py-4">
				<button onclick={() => goto('/profile/guide')} class="p-1">
					<ChevronLeft class="h-6 w-6" />
				</button>
				<h1 class="flex-1 text-center text-lg font-semibold">내 상품 목록</h1>
				<button 
					onclick={() => goto('/products/create')}
					class="p-1"
				>
					<Plus class="h-6 w-6 text-blue-500" />
				</button>
			</div>
		</header>

		<!-- Main Content -->
		<main class="pb-24">
			{#if myProducts.length === 0}
				<!-- Empty State -->
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<div class="mb-4 text-gray-400">
						<svg class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
								d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
						</svg>
					</div>
					<h2 class="text-lg font-medium text-gray-900 mb-2">
						등록된 상품이 없습니다
					</h2>
					<p class="text-sm text-gray-500 mb-6">
						첫 번째 여행 상품을 만들어보세요!
					</p>
					<button
						onclick={() => goto('/products/create')}
						class="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
					>
						상품 만들기
					</button>
				</div>
			{:else}
				<!-- Products List -->
				<div class="divide-y divide-gray-100">
					{#each myProducts as product}
						{@const restrictions = productRestrictions[product.id]}
						{@const canEdit = !restrictions || restrictions.canEdit}
						{@const canDelete = !restrictions || restrictions.canDelete}
						{@const firstDescImage = extractFirstImage(product.description)}
						<div class="p-4 hover:bg-gray-50 transition-colors">
							<button
								onclick={() => handleProductClick(product.id)}
								class="w-full text-left"
							>
								<div class="flex gap-4">
									<!-- Product Image -->
									<div class="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
										{#if product.imageUrl || firstDescImage}
											<img 
												src={product.imageUrl || firstDescImage} 
												alt={product.title}
												class="w-full h-full object-cover"
											/>
										{:else}
											<div class="w-full h-full flex items-center justify-center text-gray-400">
												<Package class="w-8 h-8" />
											</div>
										{/if}
									</div>
									
									<!-- Product Info -->
									<div class="flex-1">
										<div class="flex items-start justify-between mb-1">
											<div class="flex-1">
												<h3 class="font-semibold text-gray-900">{product.title}</h3>
												{#if !canEdit}
													<div class="flex items-center gap-1 mt-1">
														<svg class="w-3 h-3 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2zM13 10V9a1 1 0 10-2 0v1m2 0a1 1 0 11-2 0" />
														</svg>
														<span class="text-xs text-orange-600">수정 제한</span>
													</div>
												{/if}
											</div>
											<span class={`px-2 py-1 text-xs rounded-full ${getStatusColor(product.status)}`}>
												{getStatusText(product.status)}
											</span>
										</div>
										
										{#if product.destination}
											<p class="text-sm text-gray-600 mb-1">{product.destination.city}</p>
										{/if}
										
										<p class="text-sm font-medium text-gray-900 mb-1">
											{formatPrice(product.price)}원
											<span class="text-gray-500 font-normal">/ 1인</span>
										</p>
										
										<div class="flex items-center gap-4 text-xs text-gray-500">
											{#if product.rating}
												<span>⭐ {product.rating}</span>
											{/if}
											<span>리뷰 {product.reviewCount || 0}</span>
											<span>{formatDate(product.createdAt)}</span>
										</div>
									</div>
								</div>
							</button>
							
							<!-- Action Buttons -->
							<div class="flex gap-2 mt-3">
								<button
									onclick={() => handleProductClick(product.id)}
									class="flex-1 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
								>
									<Eye class="w-4 h-4" />
									상세보기
								</button>
								<button
									onclick={(e) => handleEditClick(product.id, e)}
									disabled={!canEdit}
									class="flex-1 py-2 text-sm border rounded-lg transition-colors flex items-center justify-center gap-1 {canEdit 
										? 'text-gray-700 border-gray-300 hover:bg-gray-50' 
										: 'text-gray-400 border-gray-200 cursor-not-allowed'}"
									title={!canEdit ? '수정이 제한된 상품입니다' : ''}
								>
									<Edit class="w-4 h-4" />
									수정
								</button>
								<button
									onclick={(e) => handleDeleteClick(product.id, e)}
									disabled={!canDelete}
									class="px-4 py-2 text-sm border rounded-lg transition-colors flex items-center justify-center gap-1 {canDelete 
										? 'text-red-600 border-red-600 hover:bg-red-50' 
										: 'text-gray-400 border-gray-200 cursor-not-allowed'}"
									title={!canDelete ? '삭제가 제한된 상품입니다' : ''}
								>
									<Trash2 class="w-4 h-4" />
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</main>

		<!-- Bottom Navigation -->
		<GuideBottomNav />
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
/>