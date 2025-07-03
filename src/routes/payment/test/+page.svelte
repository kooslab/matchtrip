<script lang="ts">
	import { onMount } from 'svelte';
	import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';

	let status = $state('Initializing...');
	let error = $state<string | null>(null);
	let widgets: any = null;

	onMount(async () => {
		try {
			status = 'Loading Toss Payments SDK...';
			const tossPayments = await loadTossPayments('test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm');

			status = 'Creating widgets...';
			widgets = tossPayments.widgets({
				customerKey: ANONYMOUS
			});

			status = 'Setting amount...';
			await widgets.setAmount({
				currency: 'KRW',
				value: 500
			});

			status = 'Rendering payment methods...';
			await widgets.renderPaymentMethods({
				selector: '#payment-method',
				variantKey: 'DEFAULT'
			});

			status = 'Rendering agreement...';
			await widgets.renderAgreement({
				selector: '#agreement',
				variantKey: 'AGREEMENT'
			});

			status = 'Success! Payment widget loaded.';
		} catch (err: any) {
			console.error('Error:', err);
			error = err.message || 'Unknown error';
			status = 'Failed';
		}
	});

	async function handlePayment() {
		if (!widgets) {
			alert('Payment widget not initialized');
			return;
		}

		try {
			await widgets.requestPayment({
				orderId: `ORDER_${Date.now()}`,
				orderName: '테스트 결제',
				successUrl: window.location.origin + '/payment/success',
				failUrl: window.location.origin + '/payment/fail',
				customerEmail: 'test@example.com',
				customerName: '테스트'
			});
		} catch (err: any) {
			console.error('Payment request error:', err);
			alert(err.message || '결제 요청 중 오류가 발생했습니다.');
		}
	}
</script>

<div class="mx-auto max-w-2xl p-8">
	<h1 class="mb-4 text-2xl font-bold">Toss Payments Test Page</h1>

	<div class="mb-4 rounded bg-gray-100 p-4">
		<p class="font-semibold">Status: {status}</p>
		{#if error}
			<p class="mt-2 text-red-600">Error: {error}</p>
		{/if}
	</div>

	<div class="space-y-4">
		<div id="payment-method" class="min-h-[200px] border p-4"></div>
		<div id="agreement" class="min-h-[100px] border p-4"></div>

		{#if status === 'Success! Payment widget loaded.'}
			<button
				onclick={handlePayment}
				class="w-full rounded-lg bg-blue-500 px-4 py-3 font-medium text-white hover:bg-blue-600"
			>
				결제하기
			</button>
		{/if}
	</div>
</div>
