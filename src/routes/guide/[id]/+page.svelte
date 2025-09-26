<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { ChevronLeft, MapPin, Languages, Award, Calendar, Star, User } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import ReviewsList from '$lib/components/ReviewsList.svelte';

	let guideId = $derived($page.params.id);
	let guide = $state<any>(null);
	let isLoading = $state(true);
	let error = $state('');
	let stats = $state({
		completedTrips: 0,
		avgRating: 0,
		reviewCount: 0
	});

	onMount(() => {
		fetchGuideProfile();
	});

	async function fetchGuideProfile() {
		isLoading = true;
		error = '';

		try {
			// Fetch guide data
			const [guideResponse, statsResponse] = await Promise.all([
				fetch(`/api/guide/${guideId}`),
				fetch(`/api/guide/${guideId}/stats`)
			]);

			const guideData = await guideResponse.json();
			const statsData = await statsResponse.json();

			if (!guideResponse.ok) {
				throw new Error(guideData.error || 'Failed to fetch guide profile');
			}

			guide = guideData;
			stats = {
				completedTrips: statsData.completedTrips || 0,
				avgRating: statsData.rating || 0,
				reviewCount: statsData.reviewCount || 0
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			isLoading = false;
		}
	}

	function formatDate(date: string | null) {
		if (!date) return '';
		return new Date(date).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long'
		});
	}
</script>

<svelte:head>
	<title>{guide?.name || '가이드'} - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-white">
	<!-- Header -->
	<header class="sticky top-0 z-10 bg-white border-b border-gray-200">
		<div class="flex items-center justify-between px-4 py-3">
			<button onclick={() => history.back()} class="p-1">
				<ChevronLeft class="h-6 w-6" />
			</button>
			<h1 class="text-lg font-semibold">가이드 소개</h1>
			<div class="w-8"></div>
		</div>
	</header>

	<div class="mx-auto max-w-md">
		{#if isLoading}
			<!-- Skeleton Loader -->
			<div class="animate-pulse">
				<!-- Profile Section Skeleton -->
				<div class="flex items-center gap-4 px-5 py-6 border-b border-gray-100">
					<div class="h-20 w-20 flex-shrink-0 rounded-full bg-gray-200"></div>
					<div class="flex-1">
						<div class="h-7 w-32 bg-gray-200 rounded mb-2"></div>
						<div class="flex items-center gap-2">
							<div class="flex items-center gap-0.5">
								{#each [1, 2, 3, 4, 5] as star}
									<div class="h-4 w-4 bg-gray-200 rounded"></div>
								{/each}
							</div>
							<div class="h-4 w-24 bg-gray-200 rounded"></div>
						</div>
					</div>
				</div>

				<!-- Introduction Skeleton -->
				<div class="px-5 py-4 border-b border-gray-100">
					<div class="h-5 w-24 bg-gray-200 rounded mb-3"></div>
					<div class="space-y-2">
						<div class="h-4 w-full bg-gray-200 rounded"></div>
						<div class="h-4 w-5/6 bg-gray-200 rounded"></div>
						<div class="h-4 w-4/6 bg-gray-200 rounded"></div>
					</div>
				</div>

				<!-- Details Grid Skeleton -->
				<div class="px-5 py-4 space-y-4 border-b border-gray-100">
					{#each [1, 2, 3] as item}
						<div class="flex items-center justify-between">
							<div class="h-4 w-20 bg-gray-200 rounded"></div>
							<div class="h-4 w-32 bg-gray-200 rounded"></div>
						</div>
					{/each}
				</div>

				<!-- Activity Areas Skeleton -->
				<div class="px-5 py-4 border-b border-gray-100">
					<div class="h-5 w-20 bg-gray-200 rounded mb-3"></div>
					<div class="flex flex-wrap gap-2">
						{#each [1, 2, 3, 4] as item}
							<div class="h-7 w-20 bg-gray-200 rounded-full"></div>
						{/each}
					</div>
				</div>

				<!-- Photos Section Skeleton -->
				<div class="mx-5 my-6 h-48 bg-gray-100 rounded-lg"></div>
			</div>
		{:else if error}
			<div class="rounded-lg bg-white p-8 text-center shadow-sm">
				<p class="mb-4 text-red-600">{error}</p>
				<a href="/" class="text-pink-500 underline hover:text-pink-600">홈으로 돌아가기</a>
			</div>
		{:else if guide}
			<!-- Guide Profile Section -->
			<div class="flex items-center gap-4 px-5 py-6 border-b border-gray-100">
				<div
					class="h-20 w-20 flex-shrink-0 rounded-full bg-blue-100 bg-cover bg-center"
					style={guide.profile?.profileImageUrl
						? `background-image: url('${guide.profile.profileImageUrl}')`
						: ''}
				>
					{#if !guide.profile?.profileImageUrl}
						<div class="flex h-full w-full items-center justify-center text-2xl text-white">
							<svg class="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
								/>
							</svg>
						</div>
					{/if}
				</div>
				<div class="flex-1">
					<h3 class="mb-1 text-xl font-semibold text-gray-900">{guide.name}</h3>
					<div class="flex items-center gap-2">
						<div class="flex items-center gap-0.5">
							{#each [1, 2, 3, 4, 5] as star}
								<svg
									class="h-4 w-4 {star <= Math.round(stats.avgRating || 0)
										? 'fill-yellow-400 text-yellow-400'
										: 'text-gray-300'}"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
									/>
								</svg>
							{/each}
							<span class="ml-1 text-sm font-medium text-gray-700">
								{stats.avgRating?.toFixed(1) || '0.0'}
							</span>
						</div>
						<span class="text-sm text-gray-500">
							{stats.completedTrips || 0}건 여행 진행
						</span>
					</div>
				</div>
			</div>

			<!-- Guide Info Section -->
			{#if guide.profile?.introduction}
				<div class="px-5 py-4 border-b border-gray-100">
					<h4 class="font-semibold text-gray-900 mb-3">가이드 소개</h4>
					<div class="prose prose-sm max-w-none text-sm leading-relaxed text-gray-600">
						{@html guide.profile.introduction}
					</div>
				</div>
			{/if}

			<!-- Guide Details Grid -->
			<div class="px-5 py-4 space-y-4 border-b border-gray-100">
				{#if guide.profile?.currentLocation}
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-500">현재 위치</span>
						<span class="text-sm text-gray-900">{guide.profile.currentLocation}</span>
					</div>
				{/if}

				{#if guide.profile?.guideAreas}
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-500">가이드 지역</span>
						<span class="text-sm text-gray-900">{guide.profile.guideAreas}</span>
					</div>
				{/if}

				{#if guide.profile?.languages && guide.profile.languages.length > 0}
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-500">구사 언어</span>
						<span class="text-sm text-gray-900">{guide.profile.languages.join(', ')}</span>
					</div>
				{/if}

				{#if guide.profile?.experience}
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-500">경력</span>
						<span class="text-sm text-gray-900">{guide.profile.experience}</span>
					</div>
				{/if}

				{#if guide.profile?.certifications}
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-500">자격증</span>
						<span class="text-sm text-gray-900">{guide.profile.certifications}</span>
					</div>
				{/if}
			</div>

			<!-- Activity Areas -->
			{#if guide.profile?.activityAreas && guide.profile.activityAreas.length > 0}
				<div class="px-5 py-4 border-b border-gray-100">
					<h4 class="mb-3 text-sm font-semibold text-gray-900">활동 분야</h4>
					<div class="flex flex-wrap gap-2">
						{#each guide.profile.activityAreas as area}
							<span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
								{area}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Photos Section (placeholder like in modal) -->
			<div class="mx-5 my-6 flex h-48 items-center justify-center rounded-lg bg-gray-50">
				<div class="text-center">
					<svg
						class="mx-auto mb-2 h-16 w-16 text-gray-300"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<path
							d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
						/>
					</svg>
					<p class="text-sm text-gray-400">사진이 없습니다</p>
				</div>
			</div>

			<!-- Reviews Section -->
			<div class="px-5 pb-6">
				<h4 class="mb-4 text-lg font-semibold text-gray-900">여행자 후기</h4>
				<ReviewsList {guideId} showSummary={true} limit={5} />
			</div>
		{/if}
	</div>
</div>
