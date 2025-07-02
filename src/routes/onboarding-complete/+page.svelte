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

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
	{#if showConfetti}
		<Confetti />
	{/if}
	
	<div class="max-w-md w-full text-center relative z-10">
		<!-- Success Icon -->
		<div class="mb-8 flex justify-center">
			<div class="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center">
				<svg class="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
				</svg>
			</div>
		</div>

		<!-- Heading -->
		<h1 class="text-3xl font-bold text-gray-900 mb-4">
			축하합니다! 🎉
		</h1>
		
		<!-- Message -->
		<p class="text-lg text-gray-600 mb-8">
			매치트립 가입이 완료되었습니다.<br/>
			이제 특별한 여행을 시작해보세요!
		</p>

		<!-- Benefits List -->
		<div class="bg-white rounded-xl shadow-md p-6 mb-8 text-left">
			<h3 class="font-semibold text-gray-900 mb-4">이제 이런 것들을 할 수 있어요</h3>
			<ul class="space-y-3">
				{#if $page.data.user?.role === 'traveler'}
					<li class="flex items-start gap-3">
						<svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span class="text-gray-700">전 세계 현지 가이드 검색 및 매칭</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span class="text-gray-700">맞춤형 여행 일정 요청 및 제안 받기</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span class="text-gray-700">안전한 결제 시스템으로 예약 관리</span>
					</li>
				{:else}
					<li class="flex items-start gap-3">
						<svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span class="text-gray-700">여행자의 요청사항 확인 및 제안</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span class="text-gray-700">자유로운 일정 관리와 수익 창출</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						<span class="text-gray-700">전문 가이드로서의 프로필 관리</span>
					</li>
				{/if}
			</ul>
		</div>

		<!-- Start Button -->
		<button
			onclick={handleStart}
			class="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
		>
			시작하기
		</button>
	</div>
</div>