<script lang="ts">
	import {
		ChevronDown,
		ChevronRight,
		X,
		Download,
		MessageCircle,
		Edit,
		Trash2
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	interface Props {
		product: any;
		isOpen: boolean;
		onClose: () => void;
		showGuideTab?: boolean;
		showReviewTab?: boolean;
		showContactButton?: boolean;
		showEditDelete?: boolean;
		onEdit?: () => void;
		onDelete?: () => void;
	}

	const {
		product,
		isOpen = $bindable(),
		onClose,
		showGuideTab = true,
		showReviewTab = true,
		showContactButton = true,
		showEditDelete = false,
		onEdit,
		onDelete
	}: Props = $props();

	// Handle contact button click
	const handleContactClick = async () => {
		if (!product) return;

		try {
			// Create or get existing product conversation
			const response = await fetch('/api/product-conversations/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					productId: product.id,
					guideId: product.guide?.id || product.guideId
				})
			});

			if (response.ok) {
				const { conversationId } = await response.json();
				// Navigate to product chat page
				await goto(`/chat/product/${conversationId}`);
				onClose();
			} else {
				console.error('Failed to create conversation');
			}
		} catch (error) {
			console.error('Error creating conversation:', error);
		}
	};

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
		product?.imageUrl ||
			(typeof window !== 'undefined' ? getFirstImageFromDescription(product?.description) : null)
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
		class="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center"
		onclick={onClose}
	>
		<!-- Modal Container -->
		<div
			class="animate-slide-up flex h-[90vh] w-full max-w-[430px] flex-col rounded-t-2xl bg-white sm:h-[85vh] sm:rounded-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex-shrink-0 border-b bg-white">
				<div class="flex items-center justify-between px-4 py-4">
					<button onclick={onClose} class="p-1">
						<ChevronDown class="h-6 w-6" />
					</button>
					<h2 class="flex-1 text-center text-lg font-semibold">
						{product.destination?.city || product.title}
					</h2>
					{#if showEditDelete}
						<div class="flex items-center gap-2">
							{#if onEdit}
								<button
									onclick={onEdit}
									class="p-1 text-gray-600 transition-colors hover:text-blue-600"
									title="수정"
								>
									<Edit class="h-5 w-5" />
								</button>
							{/if}
							{#if onDelete}
								<button
									onclick={onDelete}
									class="p-1 text-gray-600 transition-colors hover:text-red-600"
									title="삭제"
								>
									<Trash2 class="h-5 w-5" />
								</button>
							{/if}
						</div>
					{:else}
						<div class="w-8"></div>
					{/if}
				</div>

				<!-- Tabs -->
				<div class="flex border-t">
					<button
						onclick={() => (activeTab = 'product')}
						class="{showGuideTab && showReviewTab
							? 'flex-1'
							: 'w-full'} py-3 text-center text-sm font-medium transition-colors {activeTab ===
						'product'
							? 'text-primary border-primary border-b-2'
							: 'text-gray-500'}"
					>
						상품 정보
					</button>
					{#if showGuideTab}
						<button
							onclick={() => (activeTab = 'guide')}
							class="flex-1 py-3 text-center text-sm font-medium transition-colors {activeTab ===
							'guide'
								? 'text-primary border-primary border-b-2'
								: 'text-gray-500'}"
						>
							가이드 정보
						</button>
					{/if}
					{#if showReviewTab}
						<button
							onclick={() => (activeTab = 'review')}
							class="flex-1 py-3 text-center text-sm font-medium transition-colors {activeTab ===
							'review'
								? 'text-primary border-primary border-b-2'
								: 'text-gray-500'}"
						>
							리뷰 <span class="text-gray-400">{product.reviewCount || 88}</span>
						</button>
					{/if}
				</div>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto">
				{#if activeTab === 'product'}
					<!-- Product Info Tab -->
					<div>
						<!-- Title and Price -->
						<div class="p-4">
							<h1 class="text-primary mb-2 text-xl font-bold">{product.title || '상품 정보'}</h1>
							<div class="mb-2 flex items-baseline gap-2">
								<span class="text-2xl font-bold">{formatPrice(product.price || 0)}원</span>
								<span class="text-sm text-gray-500">/1인당 금액</span>
							</div>
							<div class="mb-1 flex items-center justify-between text-sm">
								<span class="text-gray-500">투어 시간:</span>
								<span class="text-right">
									<span class="text-gray-700">{product.duration || 4}시간 소요</span>
									<button class="ml-2 text-blue-500">상담 필요</button>
								</span>
							</div>
							{#if product.languages && product.languages.length > 0}
								<div class="mt-3 flex items-center gap-3">
									<span class="text-xs text-gray-500">가이드 언어</span>
									<div class="flex flex-wrap gap-2">
										{#each product.languages as language, index}
											<span class="text-xs text-gray-700"
												>{language}{index < product.languages.length - 1 ? ',' : ''}</span
											>
										{/each}
									</div>
								</div>
							{/if}
						</div>

						<!-- Description Section -->
						<div class="border-t">
							<button
								onclick={() => (showDescription = !showDescription)}
								class="flex w-full items-center justify-between px-4 py-4"
							>
								<span class="font-semibold">상품 안내</span>
								<ChevronDown
									class="h-5 w-5 transition-transform {showDescription ? '' : '-rotate-90'}"
								/>
							</button>
							{#if showDescription}
								<div class="px-4 pb-4">
									{#if product.description}
										<div class="prose prose-sm max-w-none text-gray-600">
											{@html product.description}
										</div>
									{:else}
										<p class="text-sm text-gray-500">상품 설명이 없습니다.</p>
									{/if}

									{#if displayImage}
										<div class="mt-4 overflow-hidden rounded-lg bg-gray-100">
											<img src={displayImage} alt={product.title} class="h-auto w-full" />
										</div>
									{:else}
										<div
											class="mt-4 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-100"
										>
											<svg
												class="h-20 w-20 text-gray-400"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="1.5"
													d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
												/>
											</svg>
										</div>
									{/if}
								</div>
							{/if}
						</div>

						<!-- Other sections... -->
					</div>
				{:else if activeTab === 'guide' && showGuideTab}
					<!-- Guide Info Tab -->
					<div class="p-4">
						<div class="mb-6 flex items-center gap-4">
							<div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
								{#if product.guideProfile?.profileImageUrl || product.guide?.image}
									<img
										src={product.guideProfile?.profileImageUrl || product.guide?.image}
										alt={product.guide?.name}
										class="h-full w-full object-cover"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center text-gray-400">
										<svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
											/>
										</svg>
									</div>
								{/if}
							</div>
							<div class="flex-1">
								<h2 class="text-lg font-bold text-gray-900">
									{product.guide?.name || product.guideProfile?.username || '가이드'}
								</h2>
								{#if product.guideProfile?.isVerified}
									<div class="mt-1 flex items-center gap-1">
										<svg class="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clip-rule="evenodd"
											/>
										</svg>
										<span class="text-xs font-medium text-green-600">인증된 가이드</span>
									</div>
								{/if}
								{#if product.guideProfile?.currentLocation}
									<p class="mt-1 flex items-center gap-1 text-sm text-gray-600">
										<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
										{product.guideProfile.currentLocation}
									</p>
								{/if}
							</div>
						</div>

						{#if product.guideProfile?.introduction}
							<div class="mb-6 rounded-lg bg-gray-50 p-4">
								<h3 class="mb-2 font-semibold text-gray-900">소개</h3>
								<p class="text-sm whitespace-pre-wrap text-gray-600">
									{product.guideProfile.introduction}
								</p>
							</div>
						{/if}

						{#if product.guideProfile?.experience}
							<div class="mb-6">
								<h3 class="mb-2 font-semibold text-gray-900">경력</h3>
								<p class="text-sm text-gray-600">{product.guideProfile.experience}</p>
							</div>
						{/if}

						{#if product.guideProfile?.languages && product.guideProfile.languages.length > 0}
							<div class="mb-6">
								<h3 class="mb-2 font-semibold text-gray-900">사용 가능 언어</h3>
								<div class="flex flex-wrap gap-2">
									{#each product.guideProfile.languages as language}
										<span
											class="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
											>{language}</span
										>
									{/each}
								</div>
							</div>
						{/if}

						{#if product.guideProfile?.activityAreas && product.guideProfile.activityAreas.length > 0}
							<div class="mb-6">
								<h3 class="mb-2 font-semibold text-gray-900">활동 지역</h3>
								<div class="flex flex-wrap gap-2">
									{#each product.guideProfile.activityAreas as area}
										<span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
											>{area}</span
										>
									{/each}
								</div>
							</div>
						{/if}

						{#if !product.guideProfile?.introduction && !product.guideProfile?.experience && !product.guideProfile?.languages?.length && !product.guideProfile?.activityAreas?.length}
							<div class="py-8 text-center">
								<svg
									class="mx-auto mb-3 h-12 w-12 text-gray-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
								<p class="text-gray-500">가이드 정보가 아직 등록되지 않았습니다</p>
							</div>
						{/if}
					</div>
				{:else if activeTab === 'review' && showReviewTab}
					<!-- Reviews Tab -->
					<div class="p-4">
						<div class="py-8 text-center">
							<p class="text-gray-500">아직 리뷰가 없습니다</p>
							<p class="mt-2 text-sm text-gray-400">첫 번째 리뷰를 작성해주세요!</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer with Action Button -->
			{#if showContactButton}
				<div class="flex-shrink-0 border-t bg-white p-4">
					<button
						onclick={handleContactClick}
						class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-3 font-medium text-white transition-colors hover:bg-blue-600"
					>
						<MessageCircle class="h-5 w-5" />
						문의하기
					</button>
				</div>
			{/if}
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
