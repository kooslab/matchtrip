<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { ChevronLeft, Calendar, MapPin, Users, Phone } from 'lucide-svelte';
	import { formatDate } from '$lib/utils/dateFormatter';

	const { data, form } = $props();
	const order = $derived(data.order);
	const payment = $derived(order.payment);
	const trip = $derived(order.trip);
	const traveler = $derived(order.traveler);
	const offer = $derived(order.offer);
	const destination = $derived(order.destination);

	let isSubmitting = $state(false);
	let showCancelModal = $state(false);
	let cancelReason = $state('');

	function formatPrice(amount: number) {
		return new Intl.NumberFormat('ko-KR').format(amount);
	}

	function getPaymentStatusBadge(status: string | null | undefined) {
		if (!status) return { text: '결제 대기', class: 'bg-gray-100 text-gray-800' };
		switch (status) {
			case 'completed':
				return { text: '결제 완료', class: 'bg-green-100 text-green-800' };
			case 'cancelled':
				return { text: '취소 요청', class: 'bg-red-100 text-red-800' };
			case 'refunded':
				return { text: '환불 완료', class: 'bg-red-100 text-red-800' };
			case 'failed':
				return { text: '결제 실패', class: 'bg-orange-100 text-orange-800' };
			default:
				return { text: '결제 진행중', class: 'bg-blue-100 text-blue-800' };
		}
	}

	const paymentStatus = $derived(getPaymentStatusBadge(payment?.status));
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="sticky top-0 z-10 bg-white border-b border-gray-100">
		<div class="flex items-center h-14 px-4">
			<button onclick={() => goto('/profile/guide/orders')} class="p-2 -ml-2">
				<ChevronLeft class="h-5 w-5" />
			</button>
			<h1 class="ml-2 text-lg font-semibold">주문 상세</h1>
		</div>
	</header>

	<!-- Content -->
	<div class="bg-white pb-24">
		<!-- Order Date -->
		<div class="px-4 py-4 border-b border-gray-100">
			<p class="text-2xl font-bold">{formatDate(payment?.createdAt || offer.createdAt)} 결제</p>
		</div>

		<!-- Payment Status -->
		<div class="px-4 py-4 border-b border-gray-100">
			<span class={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${paymentStatus.class}`}>
				{paymentStatus.text}
			</span>
		</div>

		<!-- Trip Info -->
		<div class="px-4 py-4 border-b border-gray-100">
			<h2 class="text-lg font-semibold mb-3">{offer.title}</h2>
			<div class="space-y-2 text-sm">
				<div class="flex items-start gap-3">
					<Calendar class="h-4 w-4 text-gray-400 mt-0.5" />
					<div>
						<p class="font-medium">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
						<p class="text-gray-500">
							{Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))}박 
							{Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}일
						</p>
					</div>
				</div>
				<div class="flex items-start gap-3">
					<Users class="h-4 w-4 text-gray-400 mt-0.5" />
					<p>성인 {trip.adultsCount}명{trip.childrenCount > 0 ? `, 아동 ${trip.childrenCount}명` : ''}</p>
				</div>
			</div>
		</div>

		<!-- Traveler Info -->
		<div class="px-4 py-4 border-b border-gray-100">
			<h3 class="font-semibold mb-3">주문자 정보</h3>
			<div class="space-y-2 text-sm">
				<div class="flex items-center justify-between">
					<span class="text-gray-600">주문자</span>
					<span class="font-medium">{traveler.name}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-gray-600">휴대폰</span>
					<span class="font-medium">{traveler.phone || '010-3567-1234'}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-gray-600">결제일시</span>
					<span class="font-medium">{payment ? formatDate(payment.paidAt || payment.createdAt) + ' 오전 03:49' : '-'}</span>
				</div>
			</div>
		</div>

		<!-- Payment Details -->
		<div class="px-4 py-4 border-b border-gray-100">
			<h3 class="font-semibold mb-3">결제 정보</h3>
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<span class="text-gray-600">총 상품금액 (1개)</span>
					<span class="font-medium">{formatPrice(offer.price)}원</span>
				</div>
				{#if payment}
					<div class="flex items-center justify-between">
						<span class="text-gray-600">할인금액</span>
						<span class="font-medium text-red-600">-{formatPrice(Math.floor(offer.price * 0.033))}원</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Total Payment -->
		<div class="px-4 py-4 border-b border-gray-100">
			<div class="flex items-center justify-between">
				<span class="text-lg font-semibold">총 결제금액</span>
				<span class="text-xl font-bold">{formatPrice(payment?.amount || offer.price)}원</span>
			</div>
			{#if payment}
				<p class="text-sm text-gray-500 mt-1 text-right">토스페이 / 체크카드</p>
			{/if}
		</div>

		<!-- Cancel Request -->
		{#if payment?.status === 'completed'}
			<div class="px-4 py-4">
				<button
					type="button"
					onclick={() => showCancelModal = true}
					class="w-full text-center text-sm text-gray-500 underline"
				>
					취소 요청
				</button>
			</div>
		{/if}

	</div>

	<!-- Error Message -->
	{#if form?.error}
		<div class="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
			<p class="text-sm text-red-600">{form.error}</p>
		</div>
	{/if}

	<!-- Fixed Bottom Button -->
	<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
		<button
			type="button"
			onclick={() => goto(`/trips/${trip.id}`)}
			class="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
		>
			여행 상세보기
		</button>
	</div>

	<!-- Cancel Modal -->
	{#if showCancelModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
			<div class="bg-white rounded-2xl p-6 w-full max-w-sm">
				<h2 class="text-xl font-bold text-center mb-6">취소 요청</h2>
				
				<div class="mb-6">
					<label class="text-sm text-gray-600 mb-2 block">취소 사유</label>
					<input
						type="text"
						bind:value={cancelReason}
						placeholder="취소 사유를 입력해 주세요"
						class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
					/>
				</div>

				<div class="flex gap-3">
					<button
						type="button"
						onclick={() => {
							showCancelModal = false;
							cancelReason = '';
						}}
						class="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
					>
						닫기
					</button>
					<form 
						method="POST" 
						action="?/cancelPayment" 
						class="flex-1"
						use:enhance={() => {
							if (!cancelReason.trim()) {
								alert('취소 사유를 입력해 주세요.');
								return { cancel: true };
							}
							isSubmitting = true;
							return async ({ result }) => {
								isSubmitting = false;
								if (result.type === 'success') {
									await goto('/profile/guide/orders');
								} else if (result.type === 'failure') {
									alert(result.data?.error || '취소 요청 중 오류가 발생했습니다.');
								}
								showCancelModal = false;
							};
						}}
					>
						<input type="hidden" name="cancelReason" value={cancelReason} />
						<button
							type="submit"
							disabled={isSubmitting}
							class="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
						>
							{isSubmitting ? '처리중...' : '요청하기'}
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}
</div>