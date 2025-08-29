<script lang="ts">
	import { goto } from '$app/navigation';
	import { colors } from '$lib/constants/colors';
	import airplaneUrl from '$lib/images/airplane.png';

	function goToHome() {
		goto('/');
	}
</script>

<div class="flex h-screen max-h-screen flex-col overflow-hidden">
	<!-- Main Content -->
	<div class="flex flex-1 flex-col items-center justify-center px-4 py-6">
		<div class="w-full text-center">
			<!-- Success Icon -->
			<div class="mb-4 flex justify-center">
				<img src={airplaneUrl} alt="비행기" class="h-24 w-24" />
			</div>

			<!-- Success Message -->
			<h1 class="mb-2 text-xl font-bold text-gray-900">여행제안이 완료되었습니다.</h1>

			<p class="mb-4 text-sm text-gray-600">Match Your Trip, Make It Yours</p>

			<!-- Success Details -->
			<div class="mb-4 rounded-lg bg-gray-50 p-4">
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
		</div>
	</div>

	<!-- Bottom CTA -->
	<div class="pb-safe px-4 py-4">
		<button
			onclick={goToHome}
			class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all hover:opacity-90"
			style="background-color: {colors.primary}"
		>
			홈으로 가기
		</button>
	</div>
</div>
