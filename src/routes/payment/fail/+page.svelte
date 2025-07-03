<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let errorCode = $state('');
	let errorMessage = $state('');

	onMount(() => {
		// Get error parameters from URL
		const urlParams = new URLSearchParams($page.url.search);
		errorCode = urlParams.get('code') || 'UNKNOWN_ERROR';
		errorMessage = urlParams.get('message') || '알 수 없는 오류가 발생했습니다.';

		// Clear any pending payment data
		sessionStorage.removeItem('pendingPayment');
	});

	function goBackToTrips() {
		goto('/my-trips');
	}
</script>

<svelte:head>
	<title>결제 실패 - MatchTrip</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
	<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
		<div class="flex flex-col items-center">
			<div class="mb-6">
				<svg class="h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<h2 class="mb-2 text-xl font-semibold text-gray-900">결제를 실패했습니다</h2>
			<div class="mb-6 w-full space-y-2 rounded-lg bg-red-50 p-4 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-600">오류 코드</span>
					<span class="font-mono text-red-600">{errorCode}</span>
				</div>
				<div class="text-center text-red-600">{errorMessage}</div>
			</div>

			<div class="flex w-full flex-col gap-3">
				<button
					onclick={goBackToTrips}
					class="rounded-lg bg-pink-500 px-6 py-3 font-medium text-white hover:bg-pink-600"
				>
					나의 여행으로 돌아가기
				</button>

				<div class="text-center text-sm text-gray-600">
					<p>결제 관련 문의사항이 있으신가요?</p>
					<a href="/contact" class="text-pink-600 hover:underline">고객센터 문의하기</a>
				</div>
			</div>
		</div>
	</div>
</div>
