<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Star, MapPin, Calendar, User } from 'lucide-svelte';

	let tripId = $derived($page.params.id);
	let rating = $state(0);
	let content = $state('');
	let isLoading = $state(false);
	let isSubmitting = $state(false);
	let error = $state('');
	let tripData = $state<any>(null);
	let reviewExists = $state(false);

	// Star hover state
	let hoveredStar = $state(0);

	onMount(() => {
		fetchTripData();
	});

	async function fetchTripData() {
		isLoading = true;
		error = '';

		try {
			// Fetch trip data with accepted offer
			const response = await fetch(`/api/trips/${tripId}/review-info`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to load trip details');
			}

			if (data.reviewExists) {
				reviewExists = true;
				error = 'You have already reviewed this trip.';
			} else {
				tripData = data;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			isLoading = false;
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (rating === 0) {
			error = 'Please select a rating';
			return;
		}

		if (content.trim().length < 10) {
			error = 'Review must be at least 10 characters long';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const response = await fetch('/api/reviews', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					tripId,
					rating,
					content: content.trim()
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to submit review');
			}

			// Redirect to success page or trip page
			goto(`/review/success?guideId=${tripData.guide.id}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			isSubmitting = false;
		}
	}

	function formatDate(date: string) {
		return new Date(date).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="mx-auto max-w-2xl px-4">
		{#if isLoading}
			<div class="flex items-center justify-center py-12">
				<div class="text-center">
					<div
						class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-pink-500"
					></div>
					<p class="text-gray-600">여행 정보를 불러오는 중...</p>
				</div>
			</div>
		{:else if reviewExists}
			<div class="rounded-lg bg-white p-8 text-center shadow-sm">
				<p class="mb-4 text-gray-600">이미 이 여행에 대한 리뷰를 작성하셨습니다.</p>
				<div class="space-y-2">
					<a href="/my-trips" class="block text-pink-500 underline hover:text-pink-600"
						>내 여행 목록으로</a
					>
					<a href="/" class="block text-gray-500 underline hover:text-gray-600">홈으로 돌아가기</a>
				</div>
			</div>
		{:else if error && !tripData}
			<div class="rounded-lg bg-white p-8 text-center shadow-sm">
				<p class="mb-4 text-red-600">{error}</p>
				<a href="/my-trips" class="text-pink-500 underline hover:text-pink-600">내 여행 목록으로</a>
			</div>
		{:else if tripData}
			<div class="space-y-6">
				<!-- Trip Information -->
				<div class="rounded-lg bg-white p-6 shadow-sm">
					<h1 class="mb-6 text-2xl font-bold text-gray-800">여행 후기 작성</h1>

					<div class="space-y-4">
						<!-- Guide Info -->
						<div class="flex items-start gap-4">
							{#if tripData.guide.image}
								<img
									src={tripData.guide.image}
									alt={tripData.guide.name}
									class="h-16 w-16 rounded-full object-cover"
								/>
							{:else}
								<div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
									<User class="h-8 w-8 text-gray-400" />
								</div>
							{/if}
							<div>
								<h2 class="text-lg font-semibold text-gray-800">{tripData.guide.name} 가이드</h2>
								<p class="text-sm text-gray-600">{tripData.offer.title}</p>
							</div>
						</div>

						<!-- Trip Details -->
						<div class="space-y-2 border-t border-gray-100 pt-4">
							<div class="flex items-center gap-2 text-sm text-gray-600">
								<MapPin class="h-4 w-4" />
								<span>{tripData.destination.city}, {tripData.destination.country}</span>
							</div>
							<div class="flex items-center gap-2 text-sm text-gray-600">
								<Calendar class="h-4 w-4" />
								<span
									>{formatDate(tripData.trip.startDate)} - {formatDate(tripData.trip.endDate)}</span
								>
							</div>
						</div>
					</div>
				</div>

				<!-- Review Form -->
				<form onsubmit={handleSubmit} class="rounded-lg bg-white p-6 shadow-sm">
					<!-- Rating -->
					<div class="mb-6">
						<label class="mb-3 block text-sm font-medium text-gray-700">평점을 선택해주세요</label>
						<div class="flex gap-2">
							{#each [1, 2, 3, 4, 5] as star}
								<button
									type="button"
									onclick={() => (rating = star)}
									onmouseenter={() => (hoveredStar = star)}
									onmouseleave={() => (hoveredStar = 0)}
									disabled={isSubmitting}
									class="transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<Star
										class="h-8 w-8 {hoveredStar >= star || rating >= star
											? 'fill-yellow-400 text-yellow-400'
											: 'text-gray-300'}"
									/>
								</button>
							{/each}
						</div>
						{#if rating > 0}
							<p class="mt-2 text-sm text-gray-600">
								{rating === 5
									? '최고예요!'
									: rating === 4
										? '좋아요!'
										: rating === 3
											? '괜찮아요'
											: rating === 2
												? '별로예요'
												: '아쉬워요'}
							</p>
						{/if}
					</div>

					<!-- Review Content -->
					<div class="mb-6">
						<label for="content" class="mb-2 block text-sm font-medium text-gray-700">
							후기 내용
						</label>
						<textarea
							id="content"
							bind:value={content}
							placeholder="가이드와의 여행은 어떠셨나요? 다른 여행자들에게 도움이 될 수 있도록 자세히 작성해주세요."
							rows="6"
							disabled={isSubmitting}
							required
							class="w-full rounded-lg border border-gray-300 p-3 transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100 disabled:bg-gray-50"
						></textarea>
						<p class="mt-1 text-right text-sm text-gray-500">{content.length}자</p>
					</div>

					{#if error}
						<div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
					{/if}

					<div class="flex gap-3">
						<button
							type="button"
							onclick={() => goto(`/my-trips/${tripId}`)}
							class="flex-1 rounded-lg border border-gray-300 bg-white py-3 font-medium text-gray-700 transition hover:bg-gray-50"
						>
							취소
						</button>
						<button
							type="submit"
							disabled={isSubmitting || rating === 0 || content.trim().length < 10}
							class="flex-1 rounded-lg bg-pink-500 py-3 font-medium text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if isSubmitting}
								<span class="inline-flex items-center gap-2">
									<span
										class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
									></span>
									제출 중...
								</span>
							{:else}
								리뷰 제출하기
							{/if}
						</button>
					</div>
				</form>
			</div>
		{:else}
			<div class="rounded-lg bg-white p-8 text-center shadow-sm">
				<p class="text-gray-600">여행 정보를 찾을 수 없습니다.</p>
			</div>
		{/if}
	</div>
</div>
