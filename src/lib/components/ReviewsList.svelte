<script lang="ts">
	import { Star, MapPin, Calendar, User } from 'lucide-svelte';
	import { onMount } from 'svelte';

	interface Review {
		id: string;
		rating: number;
		content: string;
		createdAt: string;
		traveler: {
			id: string;
			name: string;
			image: string | null;
		};
		trip: {
			id: string;
			startDate: string;
			endDate: string;
			destination: {
				city: string;
				country: string;
			};
		};
	}

	interface Props {
		guideId: string;
		showSummary?: boolean;
		limit?: number;
	}

	let { guideId, showSummary = true, limit = 10 }: Props = $props();

	let reviews = $state<Review[]>([]);
	let totalCount = $state(0);
	let averageRating = $state(0);
	let isLoading = $state(false);
	let error = $state('');
	let offset = $state(0);
	let hasMore = $state(false);

	onMount(() => {
		fetchReviews();
	});

	async function fetchReviews() {
		isLoading = true;
		error = '';

		try {
			const response = await fetch(
				`/api/reviews?guideId=${guideId}&limit=${limit}&offset=${offset}`
			);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to fetch reviews');
			}

			reviews = data.reviews;
			totalCount = data.totalCount;
			averageRating = data.averageRating;
			hasMore = offset + limit < totalCount;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			isLoading = false;
		}
	}

	async function loadMore() {
		offset += limit;
		const response = await fetch(`/api/reviews?guideId=${guideId}&limit=${limit}&offset=${offset}`);
		const data = await response.json();

		if (response.ok) {
			reviews = [...reviews, ...data.reviews];
			hasMore = offset + limit < totalCount;
		}
	}

	function formatDate(date: string) {
		return new Date(date).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getRatingText(rating: number) {
		if (rating >= 4.5) return '최고예요';
		if (rating >= 4) return '매우 좋아요';
		if (rating >= 3.5) return '좋아요';
		if (rating >= 3) return '괜찮아요';
		if (rating >= 2) return '별로예요';
		return '아쉬워요';
	}
</script>

<div class="space-y-6">
	{#if showSummary && totalCount > 0}
		<!-- Review Summary -->
		<div class="rounded-lg bg-white p-6 shadow-sm">
			<h3 class="mb-4 text-lg font-semibold text-gray-800">여행자 후기</h3>
			<div class="flex items-center gap-6">
				<div class="text-center">
					<div class="text-3xl font-bold text-gray-800">{averageRating.toFixed(1)}</div>
					<div class="mt-1 flex justify-center gap-0.5">
						{#each [1, 2, 3, 4, 5] as star}
							<Star
								class="h-4 w-4 {star <= Math.round(averageRating)
									? 'fill-yellow-400 text-yellow-400'
									: 'text-gray-300'}"
							/>
						{/each}
					</div>
				</div>
				<div>
					<p class="text-lg font-medium text-gray-700">{getRatingText(averageRating)}</p>
					<p class="text-sm text-gray-500">총 {totalCount}개의 후기</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Reviews List -->
	{#if isLoading}
		<div class="flex justify-center py-8">
			<div class="text-center">
				<div
					class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-pink-500"
				></div>
				<p class="text-gray-600">후기를 불러오는 중...</p>
			</div>
		</div>
	{:else if error}
		<div class="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
	{:else if reviews.length === 0}
		<div class="rounded-lg bg-gray-50 p-8 text-center">
			<p class="text-gray-600">아직 작성된 후기가 없습니다.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each reviews as review}
				<div class="rounded-lg bg-white p-6 shadow-sm">
					<!-- Reviewer Info -->
					<div class="mb-4 flex items-start justify-between">
						<div class="flex items-start gap-3">
							{#if review.traveler.image}
								<img
									src={review.traveler.image}
									alt={review.traveler.name}
									class="h-10 w-10 rounded-full object-cover"
								/>
							{:else}
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
									<User class="h-5 w-5 text-gray-400" />
								</div>
							{/if}
							<div>
								<p class="font-medium text-gray-800">{review.traveler.name}</p>
								<div class="mt-1 flex items-center gap-4 text-sm text-gray-500">
									<div class="flex items-center gap-1">
										<MapPin class="h-3 w-3" />
										<span>{review.trip.destination.city}</span>
									</div>
									<div class="flex items-center gap-1">
										<Calendar class="h-3 w-3" />
										<span>{formatDate(review.trip.startDate)}</span>
									</div>
								</div>
							</div>
						</div>
						<div class="flex gap-0.5">
							{#each [1, 2, 3, 4, 5] as star}
								<Star
									class="h-4 w-4 {star <= review.rating
										? 'fill-yellow-400 text-yellow-400'
										: 'text-gray-300'}"
								/>
							{/each}
						</div>
					</div>

					<!-- Review Content -->
					<p class="whitespace-pre-wrap text-gray-700">{review.content}</p>

					<!-- Review Date -->
					<p class="mt-4 text-sm text-gray-400">
						{formatDate(review.createdAt)}
					</p>
				</div>
			{/each}

			{#if hasMore}
				<button
					onclick={loadMore}
					disabled={isLoading}
					class="w-full rounded-lg border border-gray-300 bg-white py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
				>
					더 많은 후기 보기
				</button>
			{/if}
		</div>
	{/if}
</div>
