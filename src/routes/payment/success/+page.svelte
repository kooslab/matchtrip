<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let paymentKey = $state('');
	let orderId = $state('');
	let amount = $state('');
	let isProcessing = $state(true);
	let error = $state<string | null>(null);
	let success = $state(false);

	onMount(async () => {
		// Get payment parameters from URL
		const urlParams = new URLSearchParams($page.url.search);
		paymentKey = urlParams.get('paymentKey') || '';
		orderId = urlParams.get('orderId') || '';
		amount = urlParams.get('amount') || '';

		console.log('Payment success page loaded with:', { paymentKey, orderId, amount });

		// Get pending payment info from session storage
		const pendingPaymentStr = sessionStorage.getItem('pendingPayment');
		if (!pendingPaymentStr) {
			console.error('No pending payment found in session storage');
			error = '결제 정보를 찾을 수 없습니다.';
			isProcessing = false;
			return;
		}

		const pendingPayment = JSON.parse(pendingPaymentStr);
		console.log('Pending payment from session:', pendingPayment);

		// Verify amount matches
		if (parseInt(amount) !== pendingPayment.amount) {
			console.error('Amount mismatch:', {
				urlAmount: parseInt(amount),
				sessionAmount: pendingPayment.amount
			});
			error = '결제 금액이 일치하지 않습니다.';
			isProcessing = false;
			return;
		}

		// Confirm payment with server
		try {
			const response = await fetch('/api/payments/confirm', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					paymentKey,
					orderId,
					amount: parseInt(amount),
					offerId: pendingPayment.offerId
				})
			});

			const result = await response.json();
			console.log('Payment confirmation response:', { status: response.status, result });

			if (response.ok && result.success) {
				success = true;
				// Clear pending payment
				sessionStorage.removeItem('pendingPayment');

				// Redirect to order history after 3 seconds
				setTimeout(() => {
					goto('/order-history');
				}, 3000);
			} else {
				console.error('Payment confirmation failed:', result);
				error = result.error || '결제 확인 중 오류가 발생했습니다.';
			}
		} catch (err) {
			console.error('Payment confirmation error:', err);
			error = '서버 연결 오류가 발생했습니다.';
		} finally {
			isProcessing = false;
		}
	});
</script>

<svelte:head>
	<title>결제 처리 중 - MatchTrip</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
	<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
		{#if isProcessing}
			<div class="flex flex-col items-center">
				<div class="mb-6">
					<div
						class="h-16 w-16 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"
					></div>
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">결제를 처리하고 있습니다</h2>
				<p class="text-center text-gray-600">잠시만 기다려주세요...</p>
			</div>
		{:else if success}
			<div class="flex flex-col items-center">
				<div class="mb-6">
					<svg
						class="h-16 w-16 text-green-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">결제가 완료되었습니다</h2>
				<p class="mb-6 text-center text-gray-600">
					여행 제안이 수락되었습니다.<br />
					곧 주문 내역 페이지로 이동합니다...
				</p>
				<div class="w-full space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-600">결제 금액</span>
						<span class="font-medium">{parseInt(amount).toLocaleString()}원</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">주문 번호</span>
						<span class="font-mono text-xs">{orderId}</span>
					</div>
				</div>
			</div>
		{:else if error}
			<div class="flex flex-col items-center">
				<div class="mb-6">
					<svg class="h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">결제 처리 실패</h2>
				<p class="mb-6 text-center text-red-600">{error}</p>
				<button
					onclick={() => goto('/my-trips')}
					class="rounded-lg bg-gray-100 px-6 py-2 hover:bg-gray-200"
				>
					나의 여행으로 돌아가기
				</button>
			</div>
		{/if}
	</div>
</div>
