<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import walkImage from '$lib/images/walk.png';
	import iconInfo from '$lib/icons/icon-info-circle-mono.svg';
	import logoUrl from '$lib/images/Matchtrip.svg';

	function handleStart() {
		goto('/my-trips');
	}
</script>

<div class="min-h-screen bg-white">
	<div class="max-w-md mx-auto relative min-h-screen flex flex-col">
		<!-- Header with logo -->
		<div class="p-4 pt-8 flex justify-center">
			<img src={logoUrl} alt="Matchtrip" class="h-6" />
		</div>

		<!-- Main content -->
		<div class="flex-1 flex flex-col items-center justify-center px-6 pb-20">
			<!-- Traveler illustration -->
			<div class="mb-8">
				<img src={walkImage} alt="여행자" class="w-48 h-48 object-contain" />
			</div>

			<!-- Welcome message -->
			<h2 class="text-2xl font-bold text-gray-900 mb-3 text-center">
				회원가입이 완료되었습니다.
			</h2>
			<p class="text-gray-500 text-center mb-12">
				Match Your Trip, Make It Yours
			</p>

			<!-- Info message -->
			<div class="w-full bg-green-50 rounded-lg p-4 flex items-start gap-3 mb-8">
				<img src={iconInfo} alt="정보" class="w-5 h-5 mt-0.5 flex-shrink-0" 
					style="filter: invert(74%) sepia(76%) saturate(401%) hue-rotate(82deg) brightness(90%) contrast(88%);" />
				<p class="text-sm text-green-700">
					당신에게 딱 맞는 여행, 지금 간편하게 받아보세요
				</p>
			</div>
		</div>

		<!-- Bottom button -->
		<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
			<div class="max-w-md mx-auto p-4">
				<button
					onclick={handleStart}
					class="w-full h-12 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
				>
					홈으로
				</button>
			</div>
		</div>
	</div>
</div>
