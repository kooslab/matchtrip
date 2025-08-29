<script lang="ts">
	import { Star, MapPin, Calendar, User } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import SkeletonLoader from './SkeletonLoader.svelte';

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

<div>
	{#if showSummary && totalCount > 0}
		<!-- Review Summary -->
		<div class="rounded-lg bg-gray-50 p-6">
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
		<div class="space-y-6">
			{#if showSummary}
				<!-- Summary skeleton -->
				<div class="rounded-lg bg-gray-50 p-6">
					<SkeletonLoader height="h-8" rows={1} class="mb-2 w-3/4" />
					<SkeletonLoader height="h-6" rows={1} class="w-1/2" />
				</div>
			{/if}
			<!-- Reviews skeleton -->
			<div class="space-y-4">
				{#each Array(3) as _}
					<div class="border-t border-gray-100 pt-4">
						<div class="flex gap-3">
							<div class="h-10 w-10 animate-pulse rounded-full bg-gray-200"></div>
							<div class="flex-1">
								<SkeletonLoader height="h-4" rows={1} class="mb-2 w-1/4" />
								<SkeletonLoader height="h-3" rows={1} class="mb-2 w-1/3" />
								<SkeletonLoader height="h-4" rows={2} />
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if error}
		<div class="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
	{:else if reviews.length === 0}
		<div class="rounded-lg bg-gray-50 p-8 text-center">
			<p class="text-gray-600">아직 작성된 후기가 없습니다.</p>
		</div>
	{:else}
		<div>
			{#each reviews as review}
				{#if review}
					<div class="border-b border-gray-100 py-4 first:pt-0 last:border-0">
						<!-- Reviewer Info -->
						<div class="mb-4 flex items-start justify-between">
							<div class="flex items-start gap-3">
								{#if review.traveler?.image}
									<img
										src={review.traveler.image}
										alt={review.traveler?.name || '여행자'}
										class="h-10 w-10 rounded-full object-cover"
									/>
								{:else}
									<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
										<User class="h-5 w-5 text-gray-400" />
									</div>
								{/if}
								<div>
									<p class="font-medium text-gray-800">{review.traveler?.name || '익명'}</p>
									<div class="mt-1 flex items-center gap-4 text-sm text-gray-500">
										{#if review.trip?.destination?.city}
											<div class="flex items-center gap-1">
												<MapPin class="h-3 w-3 flex-shrink-0" />
												<span>{review.trip.destination.city}</span>
											</div>
										{/if}
										{#if review.trip?.startDate}
											<div class="flex items-center gap-1">
												<Calendar class="h-3 w-3 flex-shrink-0" />
												<span>{formatDate(review.trip.startDate)}</span>
											</div>
										{/if}
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
				{/if}
			{/each}

			{#if hasMore}
				<div class="pt-4">
					<button
						onclick={loadMore}
						disabled={isLoading}
						class="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
					>
						더 많은 후기 보기
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Fix icon sizes - ensure Lucide icons respect their size classes */
	:global(svg.lucide) {
		width: 1em !important;
		height: 1em !important;
	}

	/* Specific sizes for our icon classes */
	:global(.h-3.w-3) {
		width: 0.75rem !important;
		height: 0.75rem !important;
	}

	:global(.h-4.w-4) {
		width: 1rem !important;
		height: 1rem !important;
	}

	:global(.h-5.w-5) {
		width: 1.25rem !important;
		height: 1.25rem !important;
	}
</style>
