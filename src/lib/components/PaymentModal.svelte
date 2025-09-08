<script lang="ts">
	import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
	import { generateOrderId } from '$lib/utils/displayId';

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
	let widgetContainer = $state<HTMLDivElement>();
	let hasInitialized = false;
	let isProcessingPayment = $state(false);

	// Check if payment can proceed - simplified
	const canProceedPayment = $derived(!isLoading && !!paymentWidget && !isProcessingPayment);

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
			isProcessingPayment = false;
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

			// Debug: Log environment variables
			console.log('Toss Payment Environment (PaymentModal):', {
				clientKey: import.meta.env.VITE_TOSS_CLIENT_KEY,
				variantKey: import.meta.env.VITE_TOSS_VARIANT_KEY,
				isDev: import.meta.env.DEV,
				isProd: import.meta.env.PROD,
				mode: import.meta.env.MODE
			});

			// Initialize Toss Payments
			const tossPayments = await loadTossPayments(import.meta.env.VITE_TOSS_CLIENT_KEY);

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

			const variantKey = import.meta.env.VITE_TOSS_VARIANT_KEY;
			console.log('Using variantKey for payment methods (PaymentModal):', variantKey);

			// Render payment methods
			await widgets.renderPaymentMethods({
				selector: '#payment-method',
				variantKey: variantKey
			});

			console.log('Using variantKey for agreement (PaymentModal):', variantKey);

			// Render agreement
			await widgets.renderAgreement({
				selector: '#agreement',
				variantKey: variantKey
			});

			// Widget is ready to use

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

		isProcessingPayment = true;
		error = null;

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
			isProcessingPayment = false;

			if (err.code === 'USER_CANCEL') {
				// User cancelled payment
				return;
			}

			// Check for specific error about payment method selection
			if (
				err.message?.includes('카드 결제 정보를 선택해주세요') ||
				err.message?.includes('결제 정보를 선택')
			) {
				error = '결제 방법을 먼저 선택해주세요.';
			} else {
				error = err.message || '결제 요청 중 오류가 발생했습니다.';
			}
		}
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
		role="button"
		tabindex="-1"
		aria-label="Close modal"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onClose();
			}
		}}
	>
		<!-- Modal content wrapper -->
		<div class="flex min-h-full items-center justify-center p-4">
			<!-- Modal content -->
			<div
				class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
				bind:this={widgetContainer}
			>
				<!-- Header -->
				<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
					<h2 class="text-lg font-semibold text-gray-900">결제하기</h2>
					<button
						onclick={onClose}
						aria-label="Close modal"
						class="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<!-- Content -->
				<div class="p-4">
					<!-- Payment Info -->
					<div class="mb-4 rounded-xl bg-gray-50 p-4">
						<h3 class="mb-3 text-sm font-semibold text-gray-900">결제 정보</h3>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600">여행지</span>
								<span class="font-medium text-gray-900"
									>{trip.destination?.city || '알 수 없음'}</span
								>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">가이드</span>
								<span class="font-medium text-gray-900">{offer.guide?.name || '알 수 없음'}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">여행 기간</span>
								<span class="font-medium text-gray-900">
									{new Date(trip.startDate).toLocaleDateString()} ~ {new Date(
										trip.endDate
									).toLocaleDateString()}
								</span>
							</div>
							<div class="mt-3 flex justify-between border-t border-gray-200 pt-3">
								<span class="font-semibold text-gray-900">총 금액</span>
								<span class="text-lg font-bold text-[#1095f4]"
									>{offer.price.toLocaleString()}원</span
								>
							</div>
						</div>
					</div>

					<!-- Payment Widget Container -->
					<div class="relative">
						{#if isLoading}
							<div class="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
								<div class="flex flex-col items-center justify-center text-center">
									<div
										class="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-[#1095f4] border-t-transparent"
									></div>
									<p class="text-sm text-gray-600">결제 시스템을 불러오는 중...</p>
								</div>
							</div>
						{/if}

						{#if error}
							<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
								<p>{error}</p>
							</div>
						{/if}

						<!-- Payment Widget - Always rendered -->
						<div class="space-y-3">
							{#if !isLoading && !error}
								<div class="mb-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
									<p class="font-medium">결제 방법을 선택하고 약관에 동의해주세요</p>
									<p class="mt-1 text-xs">
										카드, 계좌이체 등 원하시는 결제 수단을 선택한 후 결제하기 버튼을 눌러주세요.
									</p>
								</div>
							{/if}
							<div id="payment-method" class="w-full rounded-lg" style="min-height: 250px;"></div>
							<div id="agreement" class="w-full rounded-lg" style="min-height: 120px;"></div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="mt-6 flex gap-3">
						<button
							onclick={onClose}
							class="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
						>
							취소
						</button>
						<button
							onclick={handlePayment}
							disabled={!canProceedPayment}
							class="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50
								{canProceedPayment ? 'bg-[#1095f4] hover:bg-blue-600' : 'bg-gray-300'}"
						>
							{#if isProcessingPayment}
								<svg
									class="h-4 w-4 animate-spin text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								처리 중...
							{:else}
								결제하기
							{/if}
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
