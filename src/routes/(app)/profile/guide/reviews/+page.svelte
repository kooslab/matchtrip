<script lang="ts">
	import { ChevronLeft, Star } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const { data } = $props();
	const user = $derived(data?.user);

	let reviews = $state<any[]>([]);
	let isLoading = $state(true);
	let stats = $state({
		totalReviews: 0,
		averageRating: 0,
		ratingDistribution: {
			5: 0,
			4: 0,
			3: 0,
			2: 0,
			1: 0
		}
	});

	onMount(() => {
		fetchReviews();
	});

	async function fetchReviews() {
		isLoading = true;
		try {
			const response = await fetch(`/api/guide/${user?.id}/reviews`);
			if (response.ok) {
				const data = await response.json();
				reviews = data.reviews || [];
				stats = data.stats || stats;
			}
		} catch (error) {
			console.error('Failed to fetch reviews:', error);
		} finally {
			isLoading = false;
		}
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}

	function getRatingPercentage(count: number) {
		if (stats.totalReviews === 0) return 0;
		return (count / stats.totalReviews) * 100;
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="sticky top-0 z-10 bg-white border-b border-gray-200">
		<div class="flex items-center justify-between px-4 py-3">
			<button onclick={() => goto('/profile/guide')} class="p-1">
				<ChevronLeft class="h-6 w-6" />
			</button>
			<h1 class="text-lg font-semibold">여행 리뷰</h1>
			<div class="w-8"></div>
		</div>
	</header>

	<div class="mx-auto max-w-md">
		{#if isLoading}
			<div class="flex items-center justify-center py-12">
				<div class="text-center">
					<div class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-pink-500"></div>
					<p class="text-gray-600">리뷰를 불러오는 중...</p>
				</div>
			</div>
		{:else}
			<!-- Rating Summary -->
			<div class="bg-white p-6 border-b">
				<div class="flex items-center gap-6">
					<div class="text-center">
						<div class="text-4xl font-bold">{stats.averageRating.toFixed(1)}</div>
						<div class="flex items-center gap-1 mt-1">
							{#each Array(5) as _, i}
								<Star
									class="h-4 w-4 {i < Math.round(stats.averageRating)
										? 'fill-yellow-400 text-yellow-400'
										: 'text-gray-300'}"
								/>
							{/each}
						</div>
						<div class="text-sm text-gray-500 mt-1">총 {stats.totalReviews}개</div>
					</div>
					<div class="flex-1">
						{#each [5, 4, 3, 2, 1] as rating}
							<div class="flex items-center gap-2 mb-1">
								<span class="text-sm text-gray-600 w-2">{rating}</span>
								<div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
									<div
										class="h-full bg-yellow-400"
										style="width: {getRatingPercentage(stats.ratingDistribution[rating])}%"
									></div>
								</div>
								<span class="text-sm text-gray-500 w-8 text-right">
									{stats.ratingDistribution[rating]}
								</span>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Reviews List -->
			{#if reviews.length === 0}
				<div class="text-center py-12">
					<p class="text-gray-500">아직 받은 리뷰가 없습니다.</p>
				</div>
			{:else}
				<div class="divide-y divide-gray-200">
					{#each reviews as review}
						<div class="bg-white p-4">
							<div class="flex items-start justify-between mb-2">
								<div>
									<div class="font-medium">{review.travelerName || '여행자'}</div>
									<div class="text-sm text-gray-500">{formatDate(review.createdAt)}</div>
								</div>
								<div class="flex items-center gap-1">
									{#each Array(5) as _, i}
										<Star
											class="h-4 w-4 {i < review.rating
												? 'fill-yellow-400 text-yellow-400'
												: 'text-gray-300'}"
										/>
									{/each}
								</div>
							</div>
							<p class="text-gray-700">{review.content}</p>
							{#if review.tripDestination}
								<div class="mt-2 text-sm text-gray-500">
									{review.tripDestination} 여행
								</div>
							{/if}
							{#if review.images && review.images.length > 0}
								<div class="flex gap-2 mt-3 overflow-x-auto">
									{#each review.images as image}
										<img
											src={image}
											alt="리뷰 이미지"
											class="h-20 w-20 rounded-lg object-cover flex-shrink-0"
										/>
									{/each}
								</div>
							{/if}
							{#if review.tags && review.tags.length > 0}
								<div class="flex flex-wrap gap-2 mt-3">
									{#each review.tags as tag}
										<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
											{tag}
										</span>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>