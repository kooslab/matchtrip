<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { useSession } from '$lib/authClient';
	import { onMount } from 'svelte';
	import Editor from '@tinymce/tinymce-svelte';

	// Authentication is now handled server-side in +page.server.ts
	const session = useSession();

	// Get trip ID from URL params
	let tripId = $derived($page.url.searchParams.get('tripId'));

	// Trip data
	let trip: any = $state(null);
	let loading = $state(true);
	let error = $state('');

	// Form data
	let pricePerPerson = $state('');
	let itinerary = $state('');
	let submitting = $state(false);

	// Check if mobile device
	let isMobile = $state(false);

	// TinyMCE configuration - mobile optimized with stacked toolbar
	const editorConfig = {
		height: isMobile ? 300 : 400,
		menubar: false,
		mobile: {
			theme: 'silver', // Use silver theme for better mobile control
			plugins: ['lists', 'autolink', 'link'],
			toolbar_mode: 'wrap' // Enable toolbar wrapping
		},
		plugins: ['lists', 'autolink', 'link', 'preview', 'visualblocks', 'wordcount'],
		toolbar_mode: 'wrap', // Enable toolbar wrapping for all devices
		toolbar: isMobile
			? [
					'undo redo | bold italic underline',
					'bullist numlist | outdent indent',
					'link | removeformat | preview'
				].join(' | ')
			: 'undo redo | blocks | bold italic underline | bullist numlist outdent indent | link removeformat | preview',
		content_style:
			'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; line-height: 1.6; padding: 8px; }',
		branding: false,
		resize: false,
		statusbar: false,
		toolbar_sticky: false,
		setup: (editor: any) => {
			editor.on('init', () => {
				// Ensure mobile-friendly behavior
				if (isMobile) {
					editor.getBody().style.fontSize = '16px'; // Prevent zoom on iOS
					editor.getBody().style.minHeight = '200px';
				}
			});
		}
	};

	// Simple textarea fallback for very small screens
	let useSimpleEditor = $state(false);

	// Fetch trip details
	async function fetchTrip() {
		if (!tripId) {
			error = '여행 ID가 필요합니다.';
			loading = false;
			return;
		}

		try {
			loading = true;
			const response = await fetch(`/api/trips/${tripId}`);
			const data = await response.json();

			if (data.success) {
				trip = data.trip;
				// Check if guide has already made an offer
				await checkExistingOffer();
			} else {
				error = data.error || '여행 정보를 불러오는데 실패했습니다.';
			}
		} catch (err) {
			console.error('Error fetching trip:', err);
			error = '서버 오류가 발생했습니다.';
		} finally {
			loading = false;
		}
	}

	// Check if guide has already made an offer for this trip
	async function checkExistingOffer() {
		try {
			const response = await fetch(`/api/offers/check?tripId=${tripId}`);
			const data = await response.json();

			if (data.hasOffer) {
				error = '이미 이 여행에 제안을 하셨습니다.';
			}
		} catch (err) {
			console.error('Error checking existing offer:', err);
		}
	}

	// Submit offer
	async function submitOffer() {
		if (!pricePerPerson || !itinerary.trim()) {
			alert('모든 필드를 입력해주세요.');
			return;
		}

		const price = parseInt(pricePerPerson);
		if (isNaN(price) || price <= 0) {
			alert('올바른 가격을 입력해주세요.');
			return;
		}

		try {
			submitting = true;
			const response = await fetch('/api/offers', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					tripId,
					pricePerPerson: price,
					itinerary
				})
			});

			const data = await response.json();

			if (data.success) {
				// Show success message and redirect
				alert('제안이 성공적으로 제출되었습니다!');
				goto('/trips');
			} else {
				alert(data.error || '제안 제출에 실패했습니다.');
			}
		} catch (err) {
			console.error('Error submitting offer:', err);
			alert('서버 오류가 발생했습니다.');
		} finally {
			submitting = false;
		}
	}

	// Calculate total price
	let totalPrice = $derived(() => {
		if (!trip || !pricePerPerson) return 0;
		const price = parseInt(pricePerPerson);
		return isNaN(price) ? 0 : price * trip.adultsCount;
	});

	// Format date
	function formatDate(date: Date | string) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Detect mobile device
	$effect(() => {
		if (typeof window !== 'undefined') {
			isMobile =
				window.innerWidth < 768 ||
				/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
			useSimpleEditor = false; // Start with TinyMCE editor by default, user can switch
		}
	});

	// Fetch trip when component mounts
	$effect(() => {
		if ($session.data && !$session.isPending && tripId) {
			fetchTrip();
		}
	});
</script>

<svelte:head>
	<title>제안하기 - MatchTrip</title>
</svelte:head>

{#if $session.isPending || loading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent">
		</div>
		<span class="ml-2 text-gray-600">로딩 중...</span>
	</div>
{:else if error}
	<div class="container mx-auto px-4 py-8">
		<div class="rounded-lg border border-red-200 bg-red-50 p-4">
			<p class="text-red-800">{error}</p>
			<button
				class="mt-2 text-sm text-red-600 underline hover:text-red-800"
				onclick={() => goto('/trips')}>
				여행찾기로 돌아가기
			</button>
		</div>
	</div>
{:else if !trip}
	<div class="container mx-auto px-4 py-8">
		<div class="text-center">
			<p class="text-gray-600">여행 정보를 찾을 수 없습니다.</p>
			<button
				class="mt-4 rounded-lg bg-pink-500 px-4 py-2 text-white hover:bg-pink-600"
				onclick={() => goto('/trips')}>
				여행찾기로 돌아가기
			</button>
		</div>
	</div>
{:else}
	<div class="container mx-auto px-4 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="mb-2 text-3xl font-bold text-gray-900">제안할 여행대상</h1>
			<button class="text-sm text-gray-600 hover:text-gray-800" onclick={() => goto('/trips')}>
				← 여행찾기로 돌아가기
			</button>
		</div>

		<!-- Trip Details -->
		<div class="mb-8 rounded-lg border border-gray-200 bg-white p-6">
			<h2 class="mb-4 text-xl font-semibold text-gray-900">여행 정보</h2>
			<div class="space-y-3">
				<div>
					<span class="font-medium text-gray-700">여행지:</span>
					<span class="ml-2 text-gray-900"
						>{trip.destination.city}, {trip.destination.country}</span>
				</div>
				<div>
					<span class="font-medium text-gray-700">여행일정:</span>
					<span class="ml-2 text-gray-900"
						>{formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}</span>
				</div>
				<div>
					<span class="font-medium text-gray-700">인원:</span>
					<span class="ml-2 text-gray-900"
						>성인 {trip.adultsCount}명{trip.childrenCount > 0
							? `, 아동 ${trip.childrenCount}명`
							: ''}</span>
				</div>
				{#if trip.customRequest}
					<div>
						<span class="font-medium text-gray-700">요청사항:</span>
						<p class="mt-1 rounded-md bg-gray-50 p-3 text-sm text-gray-600">{trip.customRequest}</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- AI Recommendation Section -->
		<div class="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
			<h2 class="mb-4 text-xl font-semibold text-gray-900">AI 추천일정 없음</h2>
			<p class="text-gray-600">AI가 추천하는 일정이 준비되면 여기에 표시됩니다.</p>
		</div>

		<!-- Offer Form -->
		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<h2 class="mb-6 text-xl font-semibold text-gray-900">나의 제안</h2>

			<!-- Price Section -->
			<div class="mb-6">
				<label for="price" class="mb-2 block text-sm font-medium text-gray-700"> 1인당 가격 </label>
				<div class="flex items-center space-x-4">
					<div class="flex-1">
						<div class="relative">
							<input
								id="price"
								type="number"
								bind:value={pricePerPerson}
								placeholder="100000"
								class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
								min="0"
								step="1000" />
							<span class="absolute top-2 right-3 text-gray-500">원</span>
						</div>
					</div>
					<div class="text-lg font-medium text-gray-900">
						총 {totalPrice().toLocaleString()}원
						<span class="text-sm text-gray-500">({trip.adultsCount}명)</span>
					</div>
				</div>
			</div>

			<!-- Itinerary Section -->
			<div class="mb-6">
				<div class="mb-2 flex items-center justify-between">
					<label class="block text-sm font-medium text-gray-700"> 여행일정 </label>
					<button
						type="button"
						onclick={() => (useSimpleEditor = !useSimpleEditor)}
						class="text-xs text-blue-600 underline hover:text-blue-800">
						{useSimpleEditor ? '고급 편집기 사용' : '간단 편집기 사용'}
					</button>
				</div>

				{#if useSimpleEditor}
					<!-- Simple textarea for very small screens -->
					<textarea
						bind:value={itinerary}
						placeholder="여행 일정을 작성해주세요...

예시:
09:00 - 호텔에서 출발
10:00 - 경복궁 관람 (1시간)
11:30 - 북촌 한옥마을 산책
13:00 - 점심식사 (인사동 전통 음식점)
..."
						class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						rows="12"
						style="font-size: 16px; line-height: 1.5;"></textarea>
				{:else}
					<!-- TinyMCE Editor -->
					<div class="rounded-lg border border-gray-300 {isMobile ? 'mobile-editor' : ''}">
						<Editor
							apiKey={import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key'}
							conf={editorConfig}
							bind:value={itinerary} />
					</div>
				{/if}

				<p class="mt-2 text-xs text-gray-500">
					여행 일정을 구체적으로 작성해주세요. 시간, 장소, 활동 등을 포함하면 더 좋습니다.
				</p>
			</div>

			<!-- Submit Button -->
			<div class="flex justify-end">
				<button
					onclick={submitOffer}
					disabled={submitting || !pricePerPerson || !itinerary.trim()}
					class="rounded-lg bg-pink-500 px-6 py-3 font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-gray-300">
					{submitting ? '제출 중...' : '제안하기'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Mobile-specific styles for TinyMCE with stacked toolbar */
	:global(.mobile-editor .tox-tinymce) {
		border-radius: 0.5rem;
	}

	/* Enable toolbar wrapping and stacking */
	:global(.mobile-editor .tox-toolbar-overlord) {
		flex-wrap: wrap;
	}

	:global(.mobile-editor .tox-toolbar) {
		flex-wrap: wrap;
		padding: 6px 4px;
		min-height: auto;
	}

	:global(.mobile-editor .tox-toolbar__primary) {
		flex-wrap: wrap;
		justify-content: flex-start;
	}

	:global(.mobile-editor .tox-toolbar__group) {
		margin: 2px 4px 2px 0;
		flex-wrap: wrap;
	}

	:global(.mobile-editor .tox-tbtn) {
		margin: 1px;
		min-width: 36px;
		height: 36px;
		flex-shrink: 0;
	}

	:global(.mobile-editor .tox-tbtn__select-label) {
		font-size: 12px;
	}

	:global(.mobile-editor .tox-edit-area__iframe) {
		min-height: 250px !important;
	}

	/* Ensure textarea doesn't zoom on iOS */
	textarea {
		font-size: 16px;
		-webkit-appearance: none;
		border-radius: 0.5rem;
	}

	/* Mobile responsive adjustments */
	@media (max-width: 640px) {
		:global(.mobile-editor .tox-toolbar) {
			padding: 4px 2px;
		}

		:global(.mobile-editor .tox-tbtn) {
			min-width: 32px;
			height: 32px;
		}

		:global(.mobile-editor .tox-toolbar__group) {
			margin: 1px 2px 1px 0;
		}
	}

	/* Very small screens */
	@media (max-width: 480px) {
		:global(.mobile-editor .tox-tbtn) {
			min-width: 28px;
			height: 28px;
		}
	}
</style>
