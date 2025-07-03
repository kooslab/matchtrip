<script lang="ts">
	import { page } from '$app/stores';
	import {
		User,
		Globe,
		DollarSign,
		Languages,
		Calendar,
		Heart,
		Utensils,
		UserCheck,
		MapPin,
		Phone,
		AlertCircle,
		Clock
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function getAvatarUrl(name: string) {
		return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=200`;
	}

	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long'
		});
	}
</script>

<div class="mx-auto w-full px-3 py-6 sm:max-w-4xl sm:px-4 sm:py-8">
	{#if data.traveler}
		<div class="rounded-lg bg-white shadow">
			<!-- Profile Header -->
			<div class="border-b border-gray-200 p-3 sm:p-6">
				<div class="flex items-start space-x-6">
					<!-- Profile Image -->
					<img
						src={data.travelerProfile?.profileImageUrl || getAvatarUrl(data.traveler.name)}
						alt="{data.traveler.name}'s profile"
						class="h-32 w-32 rounded-full object-cover"
					/>

					<!-- Basic Info -->
					<div class="flex-1">
						<h1 class="text-3xl font-bold text-gray-900">{data.traveler.name}</h1>

						{#if data.travelerProfile?.nationality}
							<p class="mt-2 flex items-center text-gray-600">
								<Globe class="mr-2 h-4 w-4" />
								{data.travelerProfile.nationality}
							</p>
						{/if}

						<p class="mt-2 flex items-center text-sm text-gray-500">
							<Clock class="mr-2 h-4 w-4" />
							{formatDate(data.traveler.createdAt)}부터 회원
						</p>
					</div>
				</div>
			</div>

			<!-- Profile Content -->
			{#if data.travelerProfile}
				<div class="space-y-6 p-3 sm:p-6">
					<!-- Travel Preferences -->
					<div class="space-y-4">
						<h2 class="text-xl font-semibold text-gray-900">여행 선호사항</h2>

						<div class="grid gap-4 sm:grid-cols-2">
							<!-- Travel Style -->
							{#if data.travelerProfile.travelStyle}
								<div>
									<h3 class="flex items-center text-sm font-medium text-gray-700">
										<MapPin class="mr-2 h-4 w-4" />
										여행 스타일
									</h3>
									<p class="mt-1 text-gray-900">{data.travelerProfile.travelStyle}</p>
								</div>
							{/if}

							<!-- Budget Range -->
							{#if data.travelerProfile.budgetRange}
								<div>
									<h3 class="flex items-center text-sm font-medium text-gray-700">
										<DollarSign class="mr-2 h-4 w-4" />
										예산 범위
									</h3>
									<p class="mt-1 text-gray-900">{data.travelerProfile.budgetRange}</p>
								</div>
							{/if}

							<!-- Travel Frequency -->
							{#if data.travelerProfile.travelFrequency}
								<div>
									<h3 class="flex items-center text-sm font-medium text-gray-700">
										<Calendar class="mr-2 h-4 w-4" />
										여행 빈도
									</h3>
									<p class="mt-1 text-gray-900">{data.travelerProfile.travelFrequency}</p>
								</div>
							{/if}
						</div>

						<!-- Preferred Languages -->
						{#if data.travelerProfile.preferredLanguages && data.travelerProfile.preferredLanguages.length > 0}
							<div>
								<h3 class="flex items-center text-sm font-medium text-gray-700">
									<Languages class="mr-2 h-4 w-4" />
									선호 언어
								</h3>
								<div class="mt-2 flex flex-wrap gap-2">
									{#each data.travelerProfile.preferredLanguages as language}
										<span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
											{language}
										</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Interests -->
						{#if data.travelerProfile.interests && data.travelerProfile.interests.length > 0}
							<div>
								<h3 class="flex items-center text-sm font-medium text-gray-700">
									<Heart class="mr-2 h-4 w-4" />
									관심사
								</h3>
								<div class="mt-2 flex flex-wrap gap-2">
									{#each data.travelerProfile.interests as interest}
										<span class="rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-800">
											{interest}
										</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- Dietary & Accessibility -->
					{#if (data.travelerProfile.dietaryRestrictions && data.travelerProfile.dietaryRestrictions.length > 0) || data.travelerProfile.accessibilityNeeds}
						<div class="space-y-4 border-t pt-6">
							<h2 class="text-xl font-semibold text-gray-900">특별 요구사항</h2>

							<!-- Dietary Restrictions -->
							{#if data.travelerProfile.dietaryRestrictions && data.travelerProfile.dietaryRestrictions.length > 0}
								<div>
									<h3 class="flex items-center text-sm font-medium text-gray-700">
										<Utensils class="mr-2 h-4 w-4" />
										식이 제한
									</h3>
									<div class="mt-2 flex flex-wrap gap-2">
										{#each data.travelerProfile.dietaryRestrictions as restriction}
											<span class="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
												{restriction}
											</span>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Accessibility Needs -->
							{#if data.travelerProfile.accessibilityNeeds}
								<div>
									<h3 class="flex items-center text-sm font-medium text-gray-700">
										<UserCheck class="mr-2 h-4 w-4" />
										접근성 요구사항
									</h3>
									<p class="mt-1 text-gray-900">{data.travelerProfile.accessibilityNeeds}</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{:else}
				<div class="p-3 text-center text-gray-500 sm:p-6">
					<p>추가 프로필 정보가 없습니다.</p>
				</div>
			{/if}
		</div>
	{:else}
		<div class="rounded-lg bg-white p-8 text-center shadow">
			<AlertCircle class="mx-auto h-12 w-12 text-gray-400" />
			<h2 class="mt-4 text-xl font-semibold text-gray-900">여행자를 찾을 수 없습니다</h2>
			<p class="mt-2 text-gray-600">찾고 곈4신 여행자 프로필이 존재하지 않습니다.</p>
			<a
				href="/trips"
				class="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
			>
				여행 찾아보기
			</a>
		</div>
	{/if}
</div>
