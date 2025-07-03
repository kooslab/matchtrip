<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Confetti from '$lib/components/Confetti.svelte';

	let showConfetti = $state(true);

	onMount(() => {
		// Hide confetti after 3 seconds
		setTimeout(() => {
			showConfetti = false;
		}, 3000);
	});

	function handleStart() {
		const userRole = $page.data.user?.role;

		if (userRole === 'guide') {
			goto('/my-offers');
		} else if (userRole === 'traveler') {
			goto('/my-trips');
		} else {
			// Fallback to home
			goto('/');
		}
	}
</script>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4 py-12"
>
	{#if showConfetti}
		<Confetti />
	{/if}

	<div class="relative z-10 w-full max-w-md text-center">
		<!-- Success Icon -->
		<div class="mb-8 flex justify-center">
			<div class="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
				<svg class="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
					></path>
				</svg>
			</div>
		</div>

		<!-- Heading -->
		<h1 class="mb-4 text-3xl font-bold text-gray-900">축하합니다! 🎉</h1>

		<!-- Message -->
		<p class="mb-8 text-lg text-gray-600">
			매치트립 가입이 완료되었습니다.<br />
			이제 특별한 여행을 시작해보세요!
		</p>

		<!-- Benefits List -->
		<div class="mb-8 rounded-xl bg-white p-6 text-left shadow-md">
			<h3 class="mb-4 font-semibold text-gray-900">이제 이런 것들을 할 수 있어요</h3>
			<ul class="space-y-3">
				{#if $page.data.user?.role === 'traveler'}
					<li class="flex items-start gap-3">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						<span class="text-gray-700">전 세계 현지 가이드 검색 및 매칭</span>
					</li>
					<li class="flex items-start gap-3">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						<span class="text-gray-700">맞춤형 여행 일정 요청 및 제안 받기</span>
					</li>
					<li class="flex items-start gap-3">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						<span class="text-gray-700">안전한 결제 시스템으로 예약 관리</span>
					</li>
				{:else}
					<li class="flex items-start gap-3">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						<span class="text-gray-700">여행자의 요청사항 확인 및 제안</span>
					</li>
					<li class="flex items-start gap-3">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						<span class="text-gray-700">자유로운 일정 관리와 수익 창출</span>
					</li>
					<li class="flex items-start gap-3">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						<span class="text-gray-700">전문 가이드로서의 프로필 관리</span>
					</li>
				{/if}
			</ul>
		</div>

		<!-- Start Button -->
		<button
			onclick={handleStart}
			class="w-full transform rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg transition-all transition-colors hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
		>
			시작하기
		</button>
	</div>
</div>
