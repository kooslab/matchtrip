<script lang="ts">
	import { goto } from '$app/navigation';
	import ArrowBackIcon from '$lib/icons/icon-arrow-back-android-mono.svg';
	import CalendarCheckIcon from '$lib/icons/icon-calendar-check-mono.svg';
	import UserTwoIcon from '$lib/icons/icon-user-two-mono.svg';
	import CancellationRequestModal from '$lib/components/cancellation/CancellationRequestModal.svelte';
	import CancellationFlow from '$lib/components/cancellation/CancellationFlow.svelte';
	import { canCancelBooking } from '$lib/utils/refundCalculator';

	let { data } = $props();
	let order = $derived(data.order);

	let showCancelModal = $state(false);
	let showCancelFlow = $state(false);
	let canCancel = $derived(() => {
		if (!order) return false;
		// Allow cancellation for completed payments
		// For past trips, it will require admin approval
		return order.payment.status === 'completed';
	});

	$effect(() => {
		console.log('Order data:', order);
		console.log('Order type:', order?.type);
		console.log('Order id:', order?.id);
		console.log('Should show button:', order?.type === 'trip' && order?.id);
	});

	function formatDate(date: Date | string | null) {
		if (!date) return '날짜 정보 없음';
		const dateObj = typeof date === 'string' ? new Date(date) : date;

		// Format as YYYY. MM. DD
		const year = dateObj.getFullYear();
		const month = String(dateObj.getMonth() + 1).padStart(2, '0');
		const day = String(dateObj.getDate()).padStart(2, '0');

		return `${year}. ${month}. ${day}`;
	}

	function formatDateTime(date: Date | string | null) {
		if (!date) return '날짜 정보 없음';
		const dateObj = typeof date === 'string' ? new Date(date) : date;

		const year = dateObj.getFullYear();
		const month = dateObj.getMonth() + 1;
		const day = dateObj.getDate();
		const hours = dateObj.getHours();
		const minutes = String(dateObj.getMinutes()).padStart(2, '0');
		const period = hours < 12 ? '오전' : '오후';
		const displayHours = hours % 12 || 12;

		return `${year}년 ${month}월 ${day}일 ${period} ${displayHours}:${minutes}`;
	}

	function formatPaymentDate(date: Date | string | null) {
		if (!date) return '';
		const dateObj = typeof date === 'string' ? new Date(date) : date;

		const year = dateObj.getFullYear();
		const month = String(dateObj.getMonth() + 1).padStart(2, '0');
		const day = String(dateObj.getDate()).padStart(2, '0');

		return `${year}. ${month}. ${day} 결제`;
	}

	function formatDuration(startDate: Date | string, endDate: Date | string) {
		const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
		const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
		const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
		return `${days}박 ${days + 1}일`;
	}

	function getPaymentStatusText(status: string) {
		const statusMap: Record<string, string> = {
			completed: '여행 완료',
			cancelled: '결제 취소',
			pending: '결제 대기',
			failed: '결제 실패',
			refunded: '환불 완료'
		};
		return statusMap[status] || status;
	}

	function goToTripDetails() {
		if (order.type === 'trip' && order.id) {
			goto(`/my-trips/${order.id}`);
		}
	}

	function goToProductChat() {
		if (order.type === 'product' && order.id) {
			goto(`/chat/product/${order.id}`);
		}
	}

	function formatPhoneNumber(phone: string | null) {
		if (!phone) return '전화번호 미등록';
		// Format phone number as XXX-XXXX-XXXX
		const cleaned = phone.replace(/\D/g, '');
		if (cleaned.length === 11) {
			return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
		}
		if (cleaned.length === 10) {
			return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
		}
		return phone;
	}

	function formatPaymentMethod(method: string | null) {
		if (!method) return '결제 정보 없음';

		const methodMap: Record<string, string> = {
			CARD: '카드',
			TOSSPAY: '토스페이',
			VIRTUAL_ACCOUNT: '가상계좌',
			TRANSFER: '계좌이체',
			MOBILE_PHONE: '휴대폰',
			CULTURE_GIFT_CERTIFICATE: '문화상품권',
			BOOK_GIFT_CERTIFICATE: '도서문화상품권',
			GAME_GIFT_CERTIFICATE: '게임문화상품권'
		};

		return methodMap[method] || method;
	}

	function handleCancelRequest() {
		if (canCancel()) {
			// Use the new step-by-step flow instead of modal
			showCancelFlow = true;
		}
	}

	function handleCancelSuccess(event: CustomEvent) {
		const { cancellationRequest, refundCalculation } = event.detail;
		alert(`취소 요청이 완료되었습니다.
예상 환불 금액: ${refundCalculation.refundAmount.toLocaleString()}원`);
		// Refresh the page or redirect
		goto('/order-history');
	}
</script>

<svelte:head>
	<title>주문 상세 - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-white">
	<div class="relative mx-auto flex h-screen max-w-md flex-col overflow-hidden bg-white">
		<!-- Header -->
		<div class="sticky top-0 z-10 bg-white/95 backdrop-blur">
			<div class="flex h-14 items-center justify-center px-4 py-2.5">
				<div class="flex w-full items-center justify-between">
					<button onclick={() => goto('/order-history')} class="relative h-5 w-5">
						<img src={ArrowBackIcon} alt="Back" class="h-full w-full" />
					</button>
					<div
						class="text-primary absolute left-1/2 -translate-x-1/2 text-center text-base font-bold"
					>
						주문 상세
					</div>
					<div class="h-5 w-5"></div>
				</div>
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto" style="padding-bottom: {order ? '80px' : '32px'}">
			<div class="flex w-full flex-col gap-0">
				<!-- Payment Date Section -->
				<div class="border-gray-f7 border-b-4 px-4 py-5">
					<div class="flex flex-col gap-4">
						<div class="flex items-center justify-between border-b border-gray-100/50 pb-2">
							<div class="flex items-center gap-2">
								<div class="text-primary text-[13px] font-semibold">
									{formatPaymentDate(order.payment.paidAt || order.payment.createdAt)}
								</div>
							</div>
						</div>

						<!-- Trip Info Card -->
						<div class="flex flex-col gap-3">
							<div class="flex items-center justify-between">
								<div class="bg-secondary rounded px-2 py-0.5 text-[11px] font-medium text-white">
									{getPaymentStatusText(order.payment.status)}
								</div>
							</div>

							<div class="flex flex-col gap-4">
								<div class="flex items-center gap-1">
									<div class="text-primary flex-1 text-base font-bold">
										{#if order.type === 'trip'}
											{order.destination?.city || '알 수 없는 도시'}, {order.destination?.country ||
												'알 수 없는 국가'}
										{:else}
											{order.productTitle || '알 수 없는 상품'}
										{/if}
									</div>
								</div>

								<div class="flex flex-col gap-2">
									{#if order.type === 'trip'}
										<div class="flex items-center gap-1">
											<img
												src={CalendarCheckIcon}
												alt="Calendar"
												class="h-4 w-4"
												style="filter: brightness(0) saturate(100%) invert(60%) sepia(8%) saturate(506%) hue-rotate(175deg) brightness(91%) contrast(86%);"
											/>
											<div class="text-gray-66 text-xs">
												{formatDate(order.startDate)} ~ {formatDate(order.endDate)}
											</div>
											<div class="text-color-primary text-xs font-semibold">
												{formatDuration(order.startDate, order.endDate)}
											</div>
										</div>
										<div class="flex items-center gap-1">
											<img
												src={UserTwoIcon}
												alt="People"
												class="h-4 w-4"
												style="filter: brightness(0) saturate(100%) invert(60%) sepia(8%) saturate(506%) hue-rotate(175deg) brightness(91%) contrast(86%);"
											/>
											<div class="text-gray-66 flex items-center text-xs">
												<span>성인 {order.adultsCount || 0}명</span>
												{#if order.childrenCount > 0}
													<span class="text-gray-c1 mx-1">・</span>
													<span>아동 {order.childrenCount}명</span>
												{/if}
											</div>
										</div>
									{:else if order.productDuration}
										<div class="flex items-center gap-1">
											<img
												src={CalendarCheckIcon}
												alt="Calendar"
												class="h-4 w-4"
												style="filter: brightness(0) saturate(100%) invert(60%) sepia(8%) saturate(506%) hue-rotate(175deg) brightness(91%) contrast(86%);"
											/>
											<div class="text-gray-66 text-xs">
												{order.productDuration}일 일정
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Order Info Section -->
				<div class="border-gray-f7 border-b-4 px-4 py-5">
					<div class="mb-4 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="text-primary text-base font-bold">주문자 정보</div>
						</div>
					</div>

					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-3">
							<div class="text-secondary w-12 text-[13px]">주문자</div>
							<div class="text-gray-66 text-[13px]">{order.user?.name || '이름 없음'}</div>
						</div>
						<div class="flex items-center gap-3">
							<div class="text-secondary w-12 text-[13px]">휴대폰</div>
							<div class="text-gray-66 text-[13px]">{formatPhoneNumber(order.user?.phone)}</div>
						</div>
						<div class="flex items-start gap-3">
							<div class="text-secondary w-12 text-[13px]">결제일시</div>
							<div class="text-gray-66 flex-1 text-[13px]">
								{formatDateTime(order.payment.paidAt || order.payment.createdAt)}
							</div>
						</div>
					</div>
				</div>

				<!-- Review Section (if trip is completed and has review) -->
				{#if order.review}
					<div class="border-gray-f7 border-b-4 px-4 py-5">
						<div class="mb-4 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<div class="text-primary text-base font-bold">작성 리뷰</div>
							</div>
						</div>

						<div class="flex flex-col gap-3">
							<div class="text-gray-66 text-[13px] leading-5">
								{order.review.content}
							</div>

							{#if order.review.images && order.review.images.length > 0}
								<div class="flex gap-2">
									{#each order.review.images.slice(0, 2) as image}
										<div
											class="bg-gray-f7 h-[100px] flex-1 overflow-hidden rounded-xl border border-gray-100/20"
										>
											<img src={image} alt="Review" class="h-full w-full object-cover" />
										</div>
									{/each}
									{#if order.review.images.length < 3}
										{#each Array(3 - order.review.images.length) as _}
											<div class="h-[100px] flex-1 opacity-0"></div>
										{/each}
									{/if}
								</div>
							{/if}

							{#if order.review.tags && order.review.tags.length > 0}
								<div class="flex flex-wrap gap-2">
									{#each order.review.tags as tag}
										<div class="rounded-2xl border border-gray-100/50 bg-white px-3 py-1.5">
											<div class="text-gray-66 text-[11px] font-medium">
												{tag}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Payment Details Section -->
				<div class="border-gray-f7 border-b-8 px-4 py-5">
					<div class="mb-4 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="text-primary text-base font-bold">결제 정보</div>
						</div>
					</div>

					<div class="flex flex-col gap-5">
						<div class="flex flex-col gap-2">
							<div class="flex flex-col gap-5">
								<div class="border-gray-e8 flex flex-col gap-3 border-b pb-5">
									<div class="flex items-center justify-between">
										<div class="text-secondary text-[13px]">총 상품금액 (1개)</div>
										<div class="text-primary text-[13px]">
											{order.payment.amount.toLocaleString()}원
										</div>
									</div>
								</div>

								<div class="flex items-center justify-between">
									<div class="text-primary text-base font-bold">총 결제금액</div>
									<div class="text-primary text-base font-bold">
										{order.payment.amount.toLocaleString()}원
									</div>
								</div>
							</div>

							<div class="flex items-center justify-between">
								<div class="text-gray-99 text-xs">결제방법</div>
								<div class="text-gray-99 text-xs">
									{formatPaymentMethod(order.payment.paymentMethod)}
								</div>
							</div>
							
							{#if order.payment.displayId}
							<div class="flex items-center justify-between">
								<div class="text-gray-99 text-xs">주문번호</div>
								<div class="text-gray-99 text-xs font-medium">
									{order.payment.displayId}
								</div>
							</div>
							{/if}
						</div>

						{#if order.payment.status === 'completed' && canCancel()}
							<div class="border-gray-e8 mt-4 border-t pt-4">
								<button
									onclick={handleCancelRequest}
									class="w-full py-2 text-center text-[13px] font-medium text-red-500 transition-colors hover:text-red-600"
								>
									결제 취소 요청
								</button>
							</div>
						{:else if order.payment.status === 'cancelled'}
							<div class="border-gray-e8 mt-4 border-t pt-4">
								<div class="text-center text-[13px] text-gray-500">취소 완료</div>
							</div>
						{:else if order.payment.status === 'refunded'}
							<div class="border-gray-e8 mt-4 border-t pt-4">
								<div class="text-center text-[13px] text-gray-500">환불 완료</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Bottom Action Button -->
		<div
			class="border-gray-f1 fixed right-0 bottom-0 left-0 z-50 border-t bg-white shadow-[0px_-5px_20px_rgba(0,0,0,0.08)]"
		>
			<div class="mx-auto w-full max-w-md">
				<div class="px-4 py-4">
					{#if order?.type === 'trip' && order?.id}
						<button
							onclick={goToTripDetails}
							class="bg-color-primary flex h-12 w-full items-center justify-center rounded-[9px] transition-colors hover:bg-blue-600"
						>
							<div class="text-sm font-semibold text-white">여행 상세보기</div>
						</button>
					{:else if order?.type === 'product' && order?.id}
						<button
							onclick={goToProductChat}
							class="bg-color-primary flex h-12 w-full items-center justify-center rounded-[9px] transition-colors hover:bg-blue-600"
						>
							<div class="text-sm font-semibold text-white">채팅으로 이동</div>
						</button>
					{:else}
						<button
							onclick={() => goto('/order-history')}
							class="flex h-12 w-full items-center justify-center rounded-[9px] bg-gray-200"
						>
							<div class="text-sm font-semibold text-gray-700">주문 목록으로</div>
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Cancellation Modal (keeping for backward compatibility) -->
{#if order && showCancelModal}
	<CancellationRequestModal
		isOpen={showCancelModal}
		userRole={data.user?.role || 'traveler'}
		paymentId={order.payment.id}
		paymentAmount={order.payment.amount}
		tripStartDate={order.type === 'trip' ? order.startDate : null}
		productDate={order.type === 'product' ? order.productDate : null}
		on:close={() => (showCancelModal = false)}
		on:success={handleCancelSuccess}
	/>
{/if}

<!-- New Step-by-Step Cancellation Flow -->
{#if order && showCancelFlow}
	<CancellationFlow
		isOpen={showCancelFlow}
		userRole={data.user?.role || 'traveler'}
		paymentId={order.payment.id}
		paymentAmount={order.payment.amount}
		tripStartDate={order.type === 'trip' ? order.startDate : null}
		productDate={order.type === 'product' ? order.productDate : null}
		on:close={() => (showCancelFlow = false)}
		on:success={handleCancelSuccess}
	/>
{/if}

<style>
	:global(.text-primary) {
		color: #052236;
	}

	:global(.text-secondary) {
		color: #8ea0ac;
	}

	:global(.text-color-primary) {
		color: #1095f4;
	}

	:global(.text-color-orange) {
		color: #f75b2b;
	}

	:global(.text-gray-66) {
		color: #536b7c;
	}

	:global(.text-gray-99) {
		color: #919fa8;
	}

	:global(.text-gray-c1) {
		color: #c1c1c1;
	}

	:global(.bg-secondary) {
		background-color: #8ea0ac;
	}

	:global(.bg-color-primary) {
		background-color: #1095f4;
	}

	:global(.bg-gray-f7) {
		background-color: #f7f9fa;
	}

	:global(.border-gray-f7) {
		border-color: #f7f9fa;
	}

	:global(.border-gray-f1) {
		border-color: #f1f1f1;
	}

	:global(.border-gray-e8) {
		border-color: #e8e8e8;
	}
</style>
