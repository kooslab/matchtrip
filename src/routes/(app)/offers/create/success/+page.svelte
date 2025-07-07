<script lang="ts">
	import { goto } from '$app/navigation';
	import { colors } from '$lib/constants/colors';
	import CheckCircle from '$lib/icons/CheckCircle.svelte';
	import flightUrl from '$lib/icons/icon-flight-mono.svg';

	function goToHome() {
		goto('/');
	}

	function goToMyOffers() {
		goto('/my-offers');
	}
</script>

<div class="flex min-h-screen flex-col bg-white">
	<!-- Main Content -->
	<div class="flex flex-1 flex-col items-center justify-center px-6 py-12">
		<div class="w-full max-w-sm text-center">
			<!-- Success Icon -->
			<div class="mb-8 flex justify-center">
				<div class="relative">
					<!-- Airplane background -->
					<img src={flightUrl} alt="비행기" class="h-32 w-32 opacity-10" />
					<!-- Check circle overlay -->
					<div class="absolute inset-0 flex items-center justify-center">
						<div
							class="flex h-16 w-16 items-center justify-center rounded-full shadow-lg"
							style="background-color: {colors.primary}"
						>
							<CheckCircle class="h-10 w-10 text-white" filled={false} />
						</div>
					</div>
				</div>
			</div>

			<!-- Success Message -->
			<h1 class="mb-3 text-2xl font-bold text-gray-900">여행제안이 완료되었습니다.</h1>

			<p class="mb-8 text-base text-gray-600">Match Your Trip, Make It Yours</p>

			<!-- Success Details -->
			<div class="mb-8 rounded-lg bg-gray-50 p-4">
				<div class="flex items-start gap-3">
					<div
						class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
						style="background-color: {colors.primary}"
					>
						<svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<div class="text-left">
						<p class="text-sm font-medium text-gray-900">제안이 성공적으로 등록되었습니다</p>
						<p class="mt-1 text-sm text-gray-600">여행자가 제안을 수락하면 알림으로 안내해드려요</p>
					</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="space-y-3">
				<button
					onclick={goToMyOffers}
					class="w-full rounded-lg py-3 text-base font-medium transition-colors"
					style="color: {colors.primary}; border: 1px solid {colors.primary}"
				>
					내 제안 보기
				</button>
			</div>
		</div>
	</div>

	<!-- Bottom CTA -->
	<div
		class="fixed right-0 bottom-20 left-0 bg-white px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
	>
		<button
			onclick={goToHome}
			class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all hover:opacity-90"
			style="background-color: {colors.primary}"
		>
			홈으로 가기
		</button>
	</div>
</div>
