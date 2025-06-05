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
			const tossPayments = await loadTossPayments(
				"test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"
			);
			
			// Create widgets
			const widgets = tossPayments.widgets({
				customerKey: ANONYMOUS
			});
			
			// Set payment amount - ensure price is a number
			const priceValue = typeof offer.price === 'string' ? parseInt(offer.price) : offer.price;
			
			await widgets.setAmount({
				currency: "KRW",
				value: priceValue,
			});
			
			// Render payment methods
			await widgets.renderPaymentMethods({
				selector: "#payment-method",
				variantKey: "DEFAULT",
			});
			
			// Render agreement
			await widgets.renderAgreement({ 
				selector: "#agreement", 
				variantKey: "AGREEMENT" 
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
			sessionStorage.setItem('pendingPayment', JSON.stringify({
				offerId: offer.id,
				tripId: trip.id,
				amount: offer.price,
				orderId
			}));
			
			// Request payment
			await paymentWidget.requestPayment({
				orderId,
				orderName,
				successUrl: `${window.location.origin}/payment/success`,
				failUrl: `${window.location.origin}/payment/fail`,
				customerEmail: trip.user?.email || "",
				customerName: trip.user?.name || "",
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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}>
		<!-- Modal content -->
		<div class="w-full max-w-lg rounded-lg bg-white shadow-xl" bind:this={widgetContainer}>
			<!-- Header -->
			<div class="flex items-center justify-between border-b px-6 py-4">
				<h2 class="text-xl font-semibold text-gray-900">결제하기</h2>
				<button
					onclick={onClose}
					class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="p-6">
				<!-- Payment Info -->
				<div class="mb-6 rounded-lg bg-gray-50 p-4">
					<h3 class="mb-3 font-medium text-gray-900">결제 정보</h3>
					<div class="space-y-2 text-sm">
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
						<div class="mt-3 flex justify-between border-t pt-3">
							<span class="font-medium text-gray-900">총 금액</span>
							<span class="text-lg font-bold text-pink-600"
								>{offer.price.toLocaleString()}원</span>
						</div>
					</div>
				</div>

				<!-- Payment Widget Container -->
				<div class="relative">
					{#if isLoading}
						<div class="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
							<div class="text-center">
								<div
									class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent">
								</div>
								<p class="text-gray-600">결제 시스템을 불러오는 중...</p>
							</div>
						</div>
					{/if}
					
					{#if error}
						<div class="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
							<p>{error}</p>
						</div>
					{/if}
					
					<!-- Payment Widget - Always rendered -->
					<div class="space-y-4" style="min-height: 300px;">
						<div id="payment-method" class="w-full" style="min-height: 200px;"></div>
						<div id="agreement" class="w-full" style="min-height: 100px;"></div>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="mt-6 flex gap-3">
					<button
						onclick={onClose}
						class="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50">
						취소
					</button>
					<button
						onclick={handlePayment}
						disabled={isLoading || !!error || !paymentWidget}
						class="flex-1 rounded-lg bg-pink-500 px-4 py-3 font-medium text-white hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed">
						결제하기
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Toss Payments widget custom styles */
	:global(#payment-method) {
		width: 100%;
	}

	:global(#agreement) {
		width: 100%;
		margin-top: 1rem;
	}
</style>