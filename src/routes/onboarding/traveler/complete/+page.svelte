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
	<div class="relative mx-auto flex min-h-screen max-w-md flex-col">
		<!-- Header with logo -->
		<div class="flex justify-center p-4 pt-8">
			<img src={logoUrl} alt="Matchtrip" class="h-6" />
		</div>

		<!-- Main content -->
		<div class="flex flex-1 flex-col items-center justify-center px-6 pb-20">
			<!-- Traveler illustration -->
			<div class="mb-8">
				<img src={walkImage} alt="여행자" class="h-48 w-48 object-contain" />
			</div>

			<!-- Welcome message -->
			<h2 class="mb-3 text-center text-2xl font-bold text-gray-900">회원가입이 완료되었습니다.</h2>
			<p class="mb-12 text-center text-gray-500">Match Your Trip, Make It Yours</p>

			<!-- Info message -->
			<div class="mb-8 flex w-full items-start gap-3 rounded-lg bg-green-50 p-4">
				<img
					src={iconInfo}
					alt="정보"
					class="mt-0.5 h-5 w-5 flex-shrink-0"
					style="filter: invert(74%) sepia(76%) saturate(401%) hue-rotate(82deg) brightness(90%) contrast(88%);"
				/>
				<p class="text-sm text-green-700">당신에게 딱 맞는 여행, 지금 간편하게 받아보세요</p>
			</div>
		</div>

		<!-- Bottom button -->
		<div class="fixed right-0 bottom-0 left-0 border-t border-gray-100 bg-white">
			<div class="mx-auto max-w-md p-4">
				<button
					onclick={handleStart}
					class="h-12 w-full rounded-lg bg-blue-500 font-semibold text-white transition-colors hover:bg-blue-600"
				>
					홈으로
				</button>
			</div>
		</div>
	</div>
</div>
