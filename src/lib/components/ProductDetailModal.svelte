<script lang="ts">
	import {
		ChevronDown,
		ChevronRight,
		X,
		Download,
		MessageCircle,
		Edit,
		Trash2,
		Share2
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import StarIcon from '$lib/icons/icon-star-mono.svg';

	interface Props {
		product: any;
		isOpen: boolean;
		onClose: () => void;
		showGuideTab?: boolean;
		showReviewTab?: boolean;
		showContactButton?: boolean;
		showEditDelete?: boolean;
		isLoggedIn?: boolean;
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
		isLoggedIn = true,
		onEdit,
		onDelete
	}: Props = $props();

	// Loading state for contact button
	let isContactLoading = $state(false);

	// Share button state
	let shareButtonText = $state('링크 복사');
	let isShareCopied = $state(false);
	let showCopyToast = $state(false);

	// Handle share button click
	const handleShareClick = async () => {
		if (!product?.id) return;

		// Generate public product URL with destination parameter
		const url = new URL(`${window.location.origin}/products`);
		if (product.destination?.id) {
			url.searchParams.set('destination', product.destination.id.toString());
		}
		url.searchParams.set('productId', product.id);
		const publicUrl = url.toString();

		try {
			await navigator.clipboard.writeText(publicUrl);
			console.log('[SHARE] Copied public URL to clipboard:', publicUrl);

			// Show success feedback
			isShareCopied = true;
			shareButtonText = '복사 완료!';
			showCopyToast = true;

			// Reset after 2 seconds
			setTimeout(() => {
				isShareCopied = false;
				shareButtonText = '링크 복사';
				showCopyToast = false;
			}, 2000);
		} catch (error) {
			console.error('[SHARE] Failed to copy to clipboard:', error);
			// Fallback: show alert with URL
			alert(`링크를 복사하지 못했습니다. 수동으로 복사해주세요:\n\n${publicUrl}`);
		}
	};

	// Handle contact button click
	const handleContactClick = async () => {
		if (!product || isContactLoading) return;

		// If user is not logged in, redirect to login page
		if (!isLoggedIn) {
			await goto('/login');
			return;
		}

		isContactLoading = true;

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
				isContactLoading = false;
			}
		} catch (error) {
			console.error('Error creating conversation:', error);
			isContactLoading = false;
		}
	};

	// Tab state
	let activeTab = $state<'product' | 'guide' | 'review'>('product');

	// Accordion states
	let showDescription = $state(true);
	let showAttachments = $state(false);
	let showCancellation = $state(false);
	let showSeller = $state(false);

	// Reviews state
	let reviews = $state<any[]>([]);
	let isLoadingReviews = $state(false);

	// Fetch reviews when review tab is selected
	$effect(() => {
		if (activeTab === 'review' && product && reviews.length === 0 && !isLoadingReviews) {
			fetchReviews();
		}
	});

	// Fetch reviews function
	const fetchReviews = async () => {
		if (!product?.id) return;
		
		isLoadingReviews = true;
		try {
			const response = await fetch(`/api/products/${product.id}/reviews`);
			if (response.ok) {
				reviews = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch reviews:', error);
		} finally {
			isLoadingReviews = false;
		}
	};

	// Format date
	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

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
			<div class="flex-shrink-0 border-b bg-white rounded-t-2xl">
				<div class="flex items-center justify-between px-4 pb-4 pt-8">
					<button onclick={onClose} class="p-1">
						<ChevronDown class="h-6 w-6" />
					</button>
					<h2 class="flex-1 text-center text-lg font-semibold">
						{product.destination?.city || product.title}
					</h2>
					{#if showEditDelete}
						<div class="flex items-center gap-2">
							<button
								onclick={handleShareClick}
								class="p-1 text-gray-600 transition-colors hover:text-green-600 {isShareCopied ? 'text-green-600' : ''}"
								title={shareButtonText}
							>
								<Share2 class="h-5 w-5" />
							</button>
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
							리뷰 <span class="text-gray-400">{product.reviewCount || 0}</span>
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
						{#if isLoadingReviews}
							<div class="py-8 text-center">
								<svg
									class="mx-auto h-8 w-8 animate-spin text-gray-400"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								<p class="mt-2 text-sm text-gray-500">리뷰를 불러오는 중...</p>
							</div>
						{:else if reviews.length > 0}
							<div class="space-y-4">
								{#each reviews as review}
									<div class="border-b pb-4 last:border-b-0">
										<div class="mb-2 flex items-start justify-between">
											<div class="flex items-center gap-3">
												<div class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
													{#if review.travelerProfile?.profileImageUrl || review.traveler?.image}
														<img
															src={review.travelerProfile?.profileImageUrl || review.traveler?.image}
															alt={review.traveler?.name}
															class="h-full w-full object-cover"
														/>
													{:else}
														<div class="flex h-full w-full items-center justify-center text-gray-400">
															<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
												<div>
													<p class="font-medium text-gray-900">
														{review.traveler?.name || review.travelerProfile?.username || '여행자'}
													</p>
													<p class="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
												</div>
											</div>
											<div class="flex items-center gap-0.5">
												{#each Array(5) as _, i}
													<div class="h-4 w-4">
														<img 
															src={StarIcon} 
															alt="Star" 
															class="h-full w-full"
															style={i < review.rating ? 'filter: brightness(0) saturate(100%) invert(73%) sepia(95%) saturate(1352%) hue-rotate(6deg) brightness(104%) contrast(97%)' : 'filter: opacity(0.3)'}
														/>
													</div>
												{/each}
											</div>
										</div>
										{#if review.content}
											<p class="text-sm text-gray-600">{review.content}</p>
										{/if}
									</div>
								{/each}
							</div>
						{:else}
							<div class="py-8 text-center">
								<p class="text-gray-500">아직 리뷰가 없습니다</p>
								<p class="mt-2 text-sm text-gray-400">첫 번째 리뷰를 작성해주세요!</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Footer with Action Button -->
			{#if showContactButton}
				<div class="flex-shrink-0 border-t bg-white p-4">
					<button
						onclick={handleContactClick}
						disabled={isContactLoading}
						class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-3 font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
					>
						{#if isContactLoading}
							<svg
								class="h-5 w-5 animate-spin"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							<span>처리중...</span>
						{:else}
							<MessageCircle class="h-5 w-5" />
							<span>문의하기</span>
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Copy Success Toast -->
	{#if showCopyToast}
		<div
			class="fixed top-24 left-1/2 z-[110] -translate-x-1/2 animate-fade-in rounded-lg bg-green-600 px-4 py-3 text-white shadow-lg"
		>
			<div class="flex items-center gap-2">
				<svg
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
				<span class="font-medium">공유 링크가 복사되었습니다!</span>
			</div>
		</div>
	{/if}
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

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
</style>
