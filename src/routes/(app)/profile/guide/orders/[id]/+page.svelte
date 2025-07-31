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
	<header class="sticky top-0 z-10 border-b border-gray-100 bg-white">
		<div class="flex h-14 items-center px-4">
			<button onclick={() => goto('/profile/guide/orders')} class="-ml-2 p-2">
				<ChevronLeft class="h-5 w-5" />
			</button>
			<h1 class="ml-2 text-lg font-semibold">주문 상세</h1>
		</div>
	</header>

	<!-- Content -->
	<div class="bg-white pb-24">
		<!-- Order Date -->
		<div class="border-b border-gray-100 px-4 py-4">
			<p class="text-2xl font-bold">{formatDate(payment?.createdAt || offer.createdAt)} 결제</p>
		</div>

		<!-- Payment Status -->
		<div class="border-b border-gray-100 px-4 py-4">
			<span
				class={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${paymentStatus.class}`}
			>
				{paymentStatus.text}
			</span>
		</div>

		<!-- Trip Info -->
		<div class="border-b border-gray-100 px-4 py-4">
			<h2 class="mb-3 text-lg font-semibold">{offer.title}</h2>
			<div class="space-y-2 text-sm">
				<div class="flex items-start gap-3">
					<Calendar class="mt-0.5 h-4 w-4 text-gray-400" />
					<div>
						<p class="font-medium">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
						<p class="text-gray-500">
							{Math.ceil(
								(new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
									(1000 * 60 * 60 * 24)
							)}박
							{Math.ceil(
								(new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
									(1000 * 60 * 60 * 24)
							) + 1}일
						</p>
					</div>
				</div>
				<div class="flex items-start gap-3">
					<Users class="mt-0.5 h-4 w-4 text-gray-400" />
					<p>
						성인 {trip.adultsCount}명{trip.childrenCount > 0
							? `, 아동 ${trip.childrenCount}명`
							: ''}
					</p>
				</div>
			</div>
		</div>

		<!-- Traveler Info -->
		<div class="border-b border-gray-100 px-4 py-4">
			<h3 class="mb-3 font-semibold">주문자 정보</h3>
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
					<span class="font-medium"
						>{payment ? formatDate(payment.paidAt || payment.createdAt) + ' 오전 03:49' : '-'}</span
					>
				</div>
			</div>
		</div>

		<!-- Payment Details -->
		<div class="border-b border-gray-100 px-4 py-4">
			<h3 class="mb-3 font-semibold">결제 정보</h3>
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<span class="text-gray-600">총 상품금액 (1개)</span>
					<span class="font-medium">{formatPrice(offer.price)}원</span>
				</div>
				{#if payment}
					<div class="flex items-center justify-between">
						<span class="text-gray-600">할인금액</span>
						<span class="font-medium text-red-600"
							>-{formatPrice(Math.floor(offer.price * 0.033))}원</span
						>
					</div>
				{/if}
			</div>
		</div>

		<!-- Total Payment -->
		<div class="border-b border-gray-100 px-4 py-4">
			<div class="flex items-center justify-between">
				<span class="text-lg font-semibold">총 결제금액</span>
				<span class="text-xl font-bold">{formatPrice(payment?.amount || offer.price)}원</span>
			</div>
			{#if payment}
				<p class="mt-1 text-right text-sm text-gray-500">토스페이 / 체크카드</p>
			{/if}
		</div>

		<!-- Cancel Request -->
		{#if payment?.status === 'completed'}
			<div class="px-4 py-4">
				<button
					type="button"
					onclick={() => (showCancelModal = true)}
					class="w-full text-center text-sm text-gray-500 underline"
				>
					취소 요청
				</button>
			</div>
		{/if}
	</div>

	<!-- Error Message -->
	{#if form?.error}
		<div class="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
			<p class="text-sm text-red-600">{form.error}</p>
		</div>
	{/if}

	<!-- Fixed Bottom Button -->
	<div class="fixed right-0 bottom-0 left-0 border-t border-gray-100 bg-white p-4">
		<button
			type="button"
			onclick={() => goto(`/trips/${trip.id}`)}
			class="w-full rounded-lg bg-blue-600 py-4 font-semibold text-white transition-colors hover:bg-blue-700"
		>
			여행 상세보기
		</button>
	</div>

	<!-- Cancel Modal -->
	{#if showCancelModal}
		<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black px-4">
			<div class="w-full max-w-sm rounded-2xl bg-white p-6">
				<h2 class="mb-6 text-center text-xl font-bold">취소 요청</h2>

				<div class="mb-6">
					<label class="mb-2 block text-sm text-gray-600">취소 사유</label>
					<input
						type="text"
						bind:value={cancelReason}
						placeholder="취소 사유를 입력해 주세요"
						class="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-blue-500 focus:outline-none"
					/>
				</div>

				<div class="flex gap-3">
					<button
						type="button"
						onclick={() => {
							showCancelModal = false;
							cancelReason = '';
						}}
						class="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
							class="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
						>
							{isSubmitting ? '처리중...' : '요청하기'}
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}
</div>
