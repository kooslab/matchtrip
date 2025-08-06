<script lang="ts">
	import { ChevronDown, ChevronRight, X, Download, MessageCircle } from 'lucide-svelte';
	import { onMount } from 'svelte';
	
	interface Props {
		product: any;
		isOpen: boolean;
		onClose: () => void;
	}
	
	const { product, isOpen = $bindable(), onClose }: Props = $props();
	
	// Tab state
	let activeTab = $state<'product' | 'guide' | 'review'>('product');
	
	// Accordion states
	let showDescription = $state(true);
	let showAttachments = $state(false);
	let showCancellation = $state(false);
	let showSeller = $state(false);
	
	// Format price with commas
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('ko-KR').format(price);
	};
	
	// Format file size
	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	};
	
	// Handle file download
	const downloadFile = async (url: string, filename: string) => {
		try {
			const response = await fetch(url);
			const blob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = downloadUrl;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(downloadUrl);
		} catch (error) {
			console.error('Download failed:', error);
		}
	};
	
	// Extract first image from description HTML
	const getFirstImageFromDescription = (html: string): string | null => {
		if (!html || typeof window === 'undefined') return null;
		const div = document.createElement('div');
		div.innerHTML = html;
		const firstImg = div.querySelector('img');
		return firstImg ? firstImg.src : null;
	};
	
	// Get display image
	const displayImage = $derived(
		product?.imageUrl || (typeof window !== 'undefined' ? getFirstImageFromDescription(product?.description) : null)
	);
	
	// Handle escape key
	onMount(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};
		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	});
	
	// Lock body scroll when modal is open
	$effect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

{#if isOpen && product}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center sm:items-center"
		onclick={onClose}
	>
		<!-- Modal Container -->
		<div 
			class="bg-white w-full max-w-[430px] h-[90vh] sm:h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col animate-slide-up"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex-shrink-0 bg-white border-b">
				<div class="flex items-center justify-between px-4 py-4">
					<button onclick={onClose} class="p-1">
						<ChevronDown class="h-6 w-6" />
					</button>
					<h2 class="font-semibold text-lg">{product.destination?.city || product.title}</h2>
					<div class="w-8"></div>
				</div>
				
				<!-- Tabs -->
				<div class="flex border-t">
					<button
						onclick={() => activeTab = 'product'}
						class="flex-1 py-3 text-center text-sm font-medium transition-colors {activeTab === 'product' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}"
					>
						상품 정보
					</button>
					<button
						onclick={() => activeTab = 'guide'}
						class="flex-1 py-3 text-center text-sm font-medium transition-colors {activeTab === 'guide' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}"
					>
						가이드 정보
					</button>
					<button
						onclick={() => activeTab = 'review'}
						class="flex-1 py-3 text-center text-sm font-medium transition-colors {activeTab === 'review' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}"
					>
						리뷰 <span class="text-gray-400">{product.reviewCount || 88}</span>
					</button>
				</div>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto">
				{#if activeTab === 'product'}
					<!-- Product Info Tab -->
					<div>
						<!-- Title and Price -->
						<div class="p-4">
							<h1 class="text-xl font-bold text-primary mb-2">{product.title || '상품 정보'}</h1>
							<div class="flex items-baseline gap-2 mb-2">
								<span class="text-2xl font-bold">{formatPrice(product.price || 0)}원</span>
								<span class="text-sm text-gray-500">/1인당 금액</span>
							</div>
							<div class="flex items-center justify-between text-sm mb-1">
								<span class="text-gray-500">투어 시간:</span>
								<span class="text-right">
									<span class="text-gray-700">{product.duration || 4}시간 소요</span>
									<button class="text-blue-500 ml-2">상담 필요</button>
								</span>
							</div>
							{#if product.languages && product.languages.length > 0}
								<div class="flex items-center gap-3 mt-3">
									<span class="text-xs text-gray-500">가이드 언어</span>
									<div class="flex flex-wrap gap-2">
										{#each product.languages as language, index}
											<span class="text-xs text-gray-700">{language}{index < product.languages.length - 1 ? ',' : ''}</span>
										{/each}
									</div>
								</div>
							{/if}
						</div>

						<!-- Description Section -->
						<div class="border-t">
							<button
								onclick={() => showDescription = !showDescription}
								class="flex w-full items-center justify-between px-4 py-4"
							>
								<span class="font-semibold">상품 안내</span>
								<ChevronDown class="h-5 w-5 transition-transform {showDescription ? '' : '-rotate-90'}" />
							</button>
							{#if showDescription}
								<div class="px-4 pb-4">
									{#if product.description}
										<div class="prose prose-sm max-w-none text-gray-600">
											{@html product.description}
										</div>
									{:else}
										<p class="text-gray-500 text-sm">상품 설명이 없습니다.</p>
									{/if}
									
									{#if displayImage}
										<div class="mt-4 rounded-lg overflow-hidden bg-gray-100">
											<img src={displayImage} alt={product.title} class="w-full h-auto" />
										</div>
									{:else}
										<div class="mt-4 rounded-lg overflow-hidden bg-gray-100 aspect-square flex items-center justify-center">
											<svg class="w-20 h-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
													d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
										</div>
									{/if}
								</div>
							{/if}
						</div>

						<!-- Other sections... -->
					</div>
				{:else if activeTab === 'guide'}
					<!-- Guide Info Tab -->
					<div class="p-4">
						<div class="flex items-center gap-4 mb-6">
							<div class="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
								{#if product.guideProfile?.profileImageUrl || product.guide?.image}
									<img 
										src={product.guideProfile?.profileImageUrl || product.guide?.image} 
										alt={product.guide?.name}
										class="w-full h-full object-cover"
									/>
								{:else}
									<div class="w-full h-full flex items-center justify-center text-gray-400">
										<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
										</svg>
									</div>
								{/if}
							</div>
							<div>
								<h2 class="text-lg font-bold">{product.guide?.name || product.guideProfile?.username || '가이드'}</h2>
								{#if product.guideProfile?.isVerified}
									<span class="text-xs text-green-600">✓ 인증된 가이드</span>
								{/if}
								<p class="text-sm text-gray-600 mt-1">{product.guideProfile?.currentLocation || ''}</p>
							</div>
						</div>
						
						{#if product.guideProfile?.introduction}
							<div class="mb-6">
								<h3 class="font-semibold mb-2">소개</h3>
								<p class="text-sm text-gray-600">{product.guideProfile.introduction}</p>
							</div>
						{/if}
						
						{#if product.guideProfile?.languages && product.guideProfile.languages.length > 0}
							<div class="mb-6">
								<h3 class="font-semibold mb-2">사용 가능 언어</h3>
								<div class="flex flex-wrap gap-2">
									{#each product.guideProfile.languages as language}
										<span class="px-3 py-1 bg-gray-100 text-sm rounded-full">{language}</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Reviews Tab -->
					<div class="p-4">
						<div class="text-center py-8">
							<p class="text-gray-500">아직 리뷰가 없습니다</p>
							<p class="text-sm text-gray-400 mt-2">첫 번째 리뷰를 작성해주세요!</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer with Action Button -->
			<div class="flex-shrink-0 bg-white border-t p-4">
				<button class="w-full bg-blue-500 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors">
					<MessageCircle class="w-5 h-5" />
					문의하기
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
	
	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
</style>