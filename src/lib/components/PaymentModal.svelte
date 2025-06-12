<script lang="ts">
	import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		offer: any;
		trip: any;
	}

	let { isOpen = $bindable(), onClose, offer, trip }: Props = $props();

	let paymentWidget: any = $state(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let widgetContainer: HTMLDivElement;
	let hasInitialized = false;

	// Initialize when modal opens
	$effect(() => {
		if (isOpen && !hasInitialized && widgetContainer) {
			hasInitialized = true;
			// Longer delay to ensure DOM is fully ready
			setTimeout(() => {
				initializePaymentWidget();
			}, 500);
		}

		// Cleanup when modal closes
		if (!isOpen) {
			if (paymentWidget) {
				paymentWidget = null;
				const paymentMethodEl = document.getElementById('payment-method');
				const agreementEl = document.getElementById('agreement');
				if (paymentMethodEl) paymentMethodEl.innerHTML = '';
				if (agreementEl) agreementEl.innerHTML = '';
			}
			hasInitialized = false;
			isLoading = false;
			error = null;
		}
	});

	// Handle body scroll lock
	$effect(() => {
		if (isOpen) {
			// Allow scrolling in modal
			document.body.style.overflow = 'hidden';
			document.documentElement.style.overflow = 'hidden';
		} else {
			// Restore scrolling
			document.body.style.overflow = '';
			document.documentElement.style.overflow = '';
		}

		return () => {
			// Cleanup on unmount
			document.body.style.overflow = '';
			document.documentElement.style.overflow = '';
		};
	});

	async function initializePaymentWidget() {
		try {
			console.log('Starting payment initialization...');
			isLoading = true;
			error = null;

			// Check if elements exist
			const paymentEl = document.getElementById('payment-method');
			const agreementEl = document.getElementById('agreement');

			if (!paymentEl || !agreementEl) {
				console.error('Payment elements not found:', { paymentEl, agreementEl });
				throw new Error('Payment elements not found in DOM');
			}

			// Clear any existing content
			paymentEl.innerHTML = '';
			agreementEl.innerHTML = '';

			// Initialize Toss Payments
			const tossPayments = await loadTossPayments('test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm');

			// Create widgets
			const widgets = tossPayments.widgets({
				customerKey: ANONYMOUS
			});

			// Set payment amount - ensure price is a number
			const priceValue = typeof offer.price === 'string' ? parseInt(offer.price) : offer.price;

			await widgets.setAmount({
				currency: 'KRW',
				value: priceValue
			});

			// Render payment methods
			await widgets.renderPaymentMethods({
				selector: '#payment-method',
				variantKey: 'DEFAULT'
			});

			// Render agreement
			await widgets.renderAgreement({
				selector: '#agreement',
				variantKey: 'AGREEMENT'
			});

			paymentWidget = widgets;
			isLoading = false;
			console.log('Payment widget initialized successfully!');
		} catch (err: any) {
			console.error('Payment widget initialization error:', err);
			error = err?.message || '결제 시스템을 불러오는데 실패했습니다.';
			isLoading = false;
			paymentWidget = null;
		}
	}

	async function handlePayment() {
		if (!paymentWidget) return;

		try {
			const orderId = generateOrderId();
			const orderName = `${trip.destination?.city || '여행'} - ${offer.guide?.name || '가이드'} 투어`;

			// Store order info in session storage for later verification
			sessionStorage.setItem(
				'pendingPayment',
				JSON.stringify({
					offerId: offer.id,
					tripId: trip.id,
					amount: offer.price,
					orderId
				})
			);

			// Request payment
			await paymentWidget.requestPayment({
				orderId,
				orderName,
				successUrl: `${window.location.origin}/payment/success`,
				failUrl: `${window.location.origin}/payment/fail`,
				customerEmail: trip.user?.email || '',
				customerName: trip.user?.name || ''
			});
		} catch (err: any) {
			console.error('Payment request error:', err);
			if (err.code === 'USER_CANCEL') {
				// User cancelled payment
				return;
			}
			alert('결제 요청 중 오류가 발생했습니다.');
		}
	}

	function generateOrderId() {
		return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Close modal on escape key
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- Modal backdrop -->
	<div
		class="fixed inset-0 z-50 overflow-y-auto bg-black/50"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}>
		<!-- Modal content wrapper -->
		<div class="flex min-h-full items-center justify-center p-4">
			<!-- Modal content -->
			<div
				class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl"
				bind:this={widgetContainer}>
				<!-- Header -->
				<div class="flex items-center justify-between border-b px-3 py-1.5">
					<h2 class="text-base font-semibold text-gray-900">결제하기</h2>
					<button
						onclick={onClose}
						class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Content -->
				<div class="p-3">
					<!-- Payment Info -->
					<div class="mb-2 rounded-lg bg-gray-50 p-2">
						<h3 class="mb-1 text-xs font-medium text-gray-900">결제 정보</h3>
						<div class="space-y-0.5 text-xs">
							<div class="flex justify-between">
								<span class="text-gray-600">여행지</span>
								<span class="font-medium">{trip.destination?.city || '알 수 없음'}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">가이드</span>
								<span class="font-medium">{offer.guide?.name || '알 수 없음'}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">여행 기간</span>
								<span class="font-medium">
									{new Date(trip.startDate).toLocaleDateString()} ~ {new Date(
										trip.endDate
									).toLocaleDateString()}
								</span>
							</div>
							<div class="mt-1 flex justify-between border-t pt-1">
								<span class="font-medium text-gray-900">총 금액</span>
								<span class="text-base font-bold text-pink-600"
									>{offer.price.toLocaleString()}원</span>
							</div>
						</div>
					</div>

					<!-- Payment Widget Container -->
					<div class="relative">
						{#if isLoading}
							<div class="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
								<div class="flex flex-col items-center justify-center text-center">
									<div
										class="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent">
									</div>
									<p class="text-sm text-gray-600">결제 시스템을 불러오는 중...</p>
								</div>
							</div>
						{/if}

						{#if error}
							<div class="mb-2 rounded-lg bg-red-50 p-2 text-sm text-red-600">
								<p>{error}</p>
							</div>
						{/if}

						<!-- Payment Widget - Always rendered -->
						<div class="space-y-1">
							<div id="payment-method" class="w-full" style="min-height: 250px;"></div>
							<div id="agreement" class="w-full" style="min-height: 120px;"></div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="mt-2 flex gap-2">
						<button
							onclick={onClose}
							class="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
							취소
						</button>
						<button
							onclick={handlePayment}
							disabled={isLoading || !!error || !paymentWidget}
							class="flex-1 rounded-lg bg-pink-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50">
							결제하기
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Toss Payments widget custom styles */
	:global(#payment-method) {
		width: 100%;
		overflow: hidden;
	}

	:global(#payment-method img) {
		max-width: 100%;
		height: auto;
		object-fit: contain;
	}

	:global(#agreement) {
		width: 100%;
		margin-top: 0.5rem;
	}
</style>
