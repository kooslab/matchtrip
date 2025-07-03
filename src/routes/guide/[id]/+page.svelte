<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { MapPin, Languages, Award, Calendar, Star, User } from 'lucide-svelte';
	import ReviewsList from '$lib/components/ReviewsList.svelte';

	let guideId = $derived($page.params.id);
	let guide = $state<any>(null);
	let isLoading = $state(true);
	let error = $state('');

	onMount(() => {
		fetchGuideProfile();
	});

	async function fetchGuideProfile() {
		isLoading = true;
		error = '';

		try {
			// Fetch guide data
			const response = await fetch(`/api/guide/${guideId}`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to fetch guide profile');
			}

			guide = data;
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

<div class="min-h-screen bg-gray-50 py-8">
	<div class="mx-auto max-w-4xl px-4">
		{#if isLoading}
			<div class="flex items-center justify-center py-12">
				<div class="text-center">
					<div
						class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-pink-500"
					></div>
					<p class="text-gray-600">가이드 정보를 불러오는 중...</p>
				</div>
			</div>
		{:else if error}
			<div class="rounded-lg bg-white p-8 text-center shadow-sm">
				<p class="mb-4 text-red-600">{error}</p>
				<a href="/" class="text-pink-500 underline hover:text-pink-600">홈으로 돌아가기</a>
			</div>
		{:else if guide}
			<div class="space-y-6">
				<!-- Guide Header -->
				<div class="rounded-lg bg-white p-6 shadow-sm">
					<div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
						{#if guide.profile?.profileImageUrl}
							<img
								src={guide.profile.profileImageUrl}
								alt={guide.name}
								class="h-32 w-32 rounded-full object-cover"
							/>
						{:else}
							<div class="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200">
								<User class="h-16 w-16 text-gray-400" />
							</div>
						{/if}

						<div class="flex-1 text-center sm:text-left">
							<div class="mb-2 flex items-center justify-center gap-2 sm:justify-start">
								<h1 class="text-2xl font-bold text-gray-800">{guide.name}</h1>
								{#if guide.profile?.isVerified}
									<span
										class="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
									>
										인증됨
									</span>
								{/if}
							</div>

							{#if guide.profile?.currentLocation}
								<div
									class="mb-4 flex items-center justify-center gap-2 text-gray-600 sm:justify-start"
								>
									<MapPin class="h-4 w-4" />
									<span>{guide.profile.currentLocation}</span>
								</div>
							{/if}

							{#if guide.profile?.introduction}
								<div class="prose prose-sm max-w-none text-gray-700">
									{@html guide.profile.introduction}
								</div>
							{/if}

							{#if guide.createdAt}
								<p class="mt-4 text-sm text-gray-500">
									{formatDate(guide.createdAt)}부터 활동 중
								</p>
							{/if}
						</div>
					</div>
				</div>

				<!-- Guide Details -->
				<div class="grid gap-6 md:grid-cols-2">
					<!-- Guide Areas -->
					{#if guide.profile?.guideAreas}
						<div class="rounded-lg bg-white p-6 shadow-sm">
							<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
								<MapPin class="h-5 w-5 text-pink-500" />
								가이드 지역
							</h3>
							<p class="text-gray-700">{guide.profile.guideAreas}</p>
						</div>
					{/if}

					<!-- Languages -->
					{#if guide.profile?.languages && guide.profile.languages.length > 0}
						<div class="rounded-lg bg-white p-6 shadow-sm">
							<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
								<Languages class="h-5 w-5 text-pink-500" />
								구사 가능 언어
							</h3>
							<div class="flex flex-wrap gap-2">
								{#each guide.profile.languages as language}
									<span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
										{language}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Experience -->
					{#if guide.profile?.experience}
						<div class="rounded-lg bg-white p-6 shadow-sm">
							<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
								<Calendar class="h-5 w-5 text-pink-500" />
								경력
							</h3>
							<p class="text-gray-700">{guide.profile.experience}</p>
						</div>
					{/if}

					<!-- Certifications -->
					{#if guide.profile?.certifications}
						<div class="rounded-lg bg-white p-6 shadow-sm">
							<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
								<Award class="h-5 w-5 text-pink-500" />
								자격증
							</h3>
							<p class="text-gray-700">{guide.profile.certifications}</p>
						</div>
					{/if}
				</div>

				<!-- Activity Areas -->
				{#if guide.profile?.activityAreas && guide.profile.activityAreas.length > 0}
					<div class="rounded-lg bg-white p-6 shadow-sm">
						<h3 class="mb-4 text-lg font-semibold text-gray-800">활동 분야</h3>
						<div class="flex flex-wrap gap-2">
							{#each guide.profile.activityAreas as area}
								<span class="rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-700">
									{area}
								</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Reviews Section -->
				<ReviewsList {guideId} showSummary={true} limit={5} />
			</div>
		{/if}
	</div>
</div>
